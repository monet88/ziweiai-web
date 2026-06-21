import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { visionAnalysisSchema, type AuthenticatedUser, type VisionAnalysis, type VisionKind } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { assertCanUseAiExplanation } from '../../common/entitlement/ai-entitlement.guard';
import { assertEmailIdentityRequired } from '../auth/identity.guard';
import { apiEnv } from '../../config/env';
import { ExplanationProviderRouter } from '../../providers/ai/explanation-provider-router';
import { ProviderTimeoutError, ProviderUnavailableError } from '../../providers/ai/provider-errors';
import { QuotasService } from '../quotas/quotas.service';
import { RateLimitWindowError } from '../quotas/quota-errors';
import { buildVisionUserPrompt } from './vision-prompts';
import { VisionStorageGateway } from './vision-storage.gateway';

export interface VisionAnalysisInput {
  kind: VisionKind;
  user: AuthenticatedUser;
  ipAddress: string;
  imageBytes: Uint8Array;
  mimeType: string;
  question?: string;
}

/**
 * Luận giải vision dùng chung cho Xem Tướng (US-017e) + Xem Tay (US-017f).
 *
 * Trật tự gate bám draws-tarot, THÊM identity + vision quota (decision 0012):
 *   1. Cờ EXTENDED_SYSTEM_<FACE|PALM>_ENABLED off → 403 FEATURE_DISABLED.
 *   2. assertEmailIdentityRequired(user) → 403 IDENTITY_REQUIRED (chặn anon: PII + chi phí vision).
 *   3. assertCanUseAiExplanation() → 402 PAYMENT_REQUIRED (gate AI dùng chung decision 0010, TRƯỚC quota).
 *   4. assertCanCreateVisionAnalysis() → 429 VISION_QUOTA_EXCEEDED (quota vision riêng, đắt token).
 *   5. vision LLM (provider chain đọc ảnh) → upload ảnh vào vision-uploads → visionAnalysisSchema.parse.
 *      (Gọi LLM trước rồi mới upload: nếu LLM lỗi thì KHÔNG để lại ảnh sinh trắc mồ côi trong Storage.)
 *
 * Vision LLM tái dùng ExplanationProviderRouter qua imageInput (router lọc chain chỉ provider+model
 * đọc được ảnh) + promptOverride (persona/nhiệm vụ tiếng Việt); system prompt EXPLANATION_SYSTEM_PROMPT
 * ép tiếng Việt + chốt giọng + chặn chữ Hán (CJK guard ở provider). KHÔNG có nhánh deterministic: vision
 * mà không đọc ảnh là vô nghĩa — nếu chưa cấu hình provider đọc ảnh, router ném PROVIDER_UNAVAILABLE.
 */
@Injectable()
export class VisionAnalysisService {
  private readonly logger = new Logger(VisionAnalysisService.name);

  constructor(
    private readonly quotasService: QuotasService,
    private readonly providerRouter: ExplanationProviderRouter,
    private readonly storageGateway: VisionStorageGateway,
  ) {}

  async analyze(input: VisionAnalysisInput): Promise<VisionAnalysis> {
    const { kind, user, ipAddress, imageBytes, mimeType, question } = input;

    // GATE 1: cờ tính năng theo hệ (fail-closed). Cờ tắt = từ chối có chủ đích → 403 FEATURE_DISABLED
    // (đồng bộ Tarot/MBTI/Hợp Hôn), KHÔNG 404.
    if (!this.isSystemEnabled(kind)) {
      throw new ApiErrorHttpException(
        HttpStatus.FORBIDDEN,
        'FEATURE_DISABLED',
        kind === 'face' ? 'Tính năng Xem Tướng hiện chưa được bật.' : 'Tính năng Xem Tay hiện chưa được bật.',
      );
    }

    // GATE 2: chặn anon (email rỗng/null). Vision tốn token + ảnh sinh trắc không thu hồi được nếu vô
    // danh → bắt buộc danh tính email (decision 0009 + 0012). Helper ném 403 IDENTITY_REQUIRED.
    assertEmailIdentityRequired(user);

    // GATE 3: gate AI premium TRƯỚC quota (402) — không để user non-premium "tiêu" lượt quota cho thao
    // tác chắc chắn bị từ chối. Dùng guard entitlement DÙNG CHUNG (decision 0010).
    assertCanUseAiExplanation(this.logger);

    // GATE 4: quota vision riêng (đắt token gấp 5-10× text). Bọc raw Error → 429 VISION_QUOTA_EXCEEDED.
    await this.assertVisionQuota(user.userId, ipAddress);

    // GATE 5: gọi vision LLM TRƯỚC, upload ảnh SAU khi có kết quả. Ảnh chân dung/lòng bàn tay là dữ
    // liệu sinh trắc — nếu upload trước rồi LLM lỗi (chưa cấu hình provider đọc ảnh, timeout/5xx, CJK
    // guard từ chối) thì ảnh đã ghi vào Storage mà người dùng không nhận được kết quả, chỉ bị cron xoá
    // sau 7 ngày (review PR #28). Provider chỉ cần imageBytes/mimeType (không cần imagePath) nên đảo
    // thứ tự an toàn: LLM lỗi → ném sớm, KHÔNG ghi ảnh mồ côi.
    const narrative = await this.generateVisionNarrative(kind, mimeType, imageBytes, question);

    const { imagePath } = await this.storageGateway.uploadVisionImage({
      ownerUserId: user.userId,
      imageBytes,
      mimeType,
    });

    return visionAnalysisSchema.parse({ kind, imagePath, narrative });
  }

  private isSystemEnabled(kind: VisionKind): boolean {
    return kind === 'face' ? apiEnv.EXTENDED_SYSTEM_FACE_ENABLED : apiEnv.EXTENDED_SYSTEM_PALM_ENABLED;
  }

  private async assertVisionQuota(userId: string, ipAddress: string): Promise<void> {
    try {
      await this.quotasService.assertCanCreateVisionAnalysis(userId, ipAddress);
    } catch (error) {
      // Phân biệt hai loại "quá nhiều request" để client không nhầm rate-limit tạm thời thành hết
      // hạn mức ngày (review PR #28/#31): dùng typed error (instanceof) thay vì so khớp chuỗi message
      // (fragile khi đổi text/bản địa hoá). Cửa sổ per-phút → RATE_LIMITED; trần daily vision →
      // VISION_QUOTA_EXCEEDED. Message luôn Việt hoá ở đây (QuotasService giữ message tiếng Anh thô).
      if (error instanceof RateLimitWindowError) {
        throw new ApiErrorHttpException(
          HttpStatus.TOO_MANY_REQUESTS,
          'RATE_LIMITED',
          'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
        );
      }
      throw new ApiErrorHttpException(
        HttpStatus.TOO_MANY_REQUESTS,
        'VISION_QUOTA_EXCEEDED',
        'Đã vượt hạn mức luận giải bằng hình ảnh trong ngày.',
      );
    }
  }

  private async generateVisionNarrative(
    kind: VisionKind,
    mimeType: string,
    imageBytes: Uint8Array,
    question?: string,
  ): Promise<string> {
    const base64 = Buffer.from(imageBytes).toString('base64');
    try {
      const providerResult = await this.providerRouter.generate('auto', {
        explanationKind: `vision-${kind}`,
        promptOverride: buildVisionUserPrompt(kind, question),
        imageInput: { base64, mimeType },
      });
      this.logger.log(
        `[vision.${kind}] outcome=generated provider=${providerResult.providerMetadata.provider ?? 'unknown'} tokensIn=${providerResult.providerMetadata.promptTokens ?? '0'} tokensOut=${providerResult.providerMetadata.completionTokens ?? '0'}`,
      );
      return providerResult.renderedMarkdown;
    } catch (error) {
      if (error instanceof ProviderTimeoutError) {
        throw new ApiErrorHttpException(HttpStatus.GATEWAY_TIMEOUT, 'PROVIDER_TIMEOUT', error.message);
      }
      if (error instanceof ProviderUnavailableError) {
        throw new ApiErrorHttpException(HttpStatus.BAD_GATEWAY, 'PROVIDER_UNAVAILABLE', error.message);
      }
      throw error;
    }
  }
}
