import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { visionAnalysisSchema, type AuthenticatedUser, type VisionAnalysis, type VisionKind } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { assertCanUseAiExplanation } from '../../common/entitlement/ai-entitlement.guard';
import { assertEmailIdentityRequired } from '../auth/identity.guard';
import { apiEnv } from '../../config/env';
import { ExplanationProviderRouter } from '../../providers/ai/explanation-provider-router';
import { ProviderTimeoutError, ProviderUnavailableError } from '../../providers/ai/provider-errors';
import { QuotasService } from '../quotas/quotas.service';
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
 *   5. upload ảnh vào vision-uploads → vision LLM (provider chain đọc ảnh) → visionAnalysisSchema.parse.
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

    // GATE 5: upload ảnh (RLS owner-only, cron xoá 7 ngày) rồi gọi vision LLM với ảnh đính kèm.
    const { imagePath } = await this.storageGateway.uploadVisionImage({
      ownerUserId: user.userId,
      imageBytes,
      mimeType,
    });

    const narrative = await this.generateVisionNarrative(kind, mimeType, imageBytes, question);

    return visionAnalysisSchema.parse({ kind, imagePath, narrative });
  }

  private isSystemEnabled(kind: VisionKind): boolean {
    return kind === 'face' ? apiEnv.EXTENDED_SYSTEM_FACE_ENABLED : apiEnv.EXTENDED_SYSTEM_PALM_ENABLED;
  }

  private async assertVisionQuota(userId: string, ipAddress: string): Promise<void> {
    try {
      await this.quotasService.assertCanCreateVisionAnalysis(userId, ipAddress);
    } catch (error) {
      throw new ApiErrorHttpException(
        HttpStatus.TOO_MANY_REQUESTS,
        'VISION_QUOTA_EXCEEDED',
        error instanceof Error ? error.message : 'Đã vượt hạn mức luận giải bằng hình ảnh trong ngày.',
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
