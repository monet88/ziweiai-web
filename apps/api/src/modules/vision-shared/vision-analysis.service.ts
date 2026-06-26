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
import { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';

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
    private readonly persistence: SupabasePersistenceGateway,
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
    // guard từ chối) thì ảnh đã ghi vào Storage mà người dùng không nhận được kết quả. Provider chỉ
    // cần imageBytes/mimeType (không cần imagePath) nên đảo thứ tự an toàn: LLM lỗi → ném sớm, KHÔNG
    // ghi ảnh mồ côi.
    const { narrative, providerMetadata } = await this.generateVisionNarrative(kind, mimeType, imageBytes, question);

    const { imagePath } = await this.storageGateway.uploadVisionImage({
      ownerUserId: user.userId,
      imageBytes,
      mimeType,
    });

    // US-017 follow-up (decision 0023): lưu vĩnh viễn ảnh + luận giải + câu hỏi để Xem Tướng/Xem Tay
    // hiện trong Lịch sử như mọi hệ khác. Một row vision_results + một row history_views trỏ vào nó.
    // Bọc trong try/catch không nuốt lỗi: persist hỏng vẫn trả kết quả cho người dùng (họ đã chờ LLM),
    // chỉ log cảnh báo — KHÔNG để lỗi ghi lịch sử biến một lượt vision thành công thành 5xx.
    const normalizedQuestion = question?.trim() ? question.trim() : null;
    await this.persistVisionHistory({ user, kind, imagePath, normalizedQuestion, narrative, providerMetadata });

    return visionAnalysisSchema.parse({ kind, imagePath, narrative });
  }

  // Hai bước ghi tuần tự (createVisionResult rồi createHistoryView) KHÔNG nằm trong một transaction —
  // gateway dùng REST của Supabase nên không có transaction xuyên-bảng. Nếu bước history_views hỏng sau
  // khi vision_results đã ghi, ta sẽ có row vision + ảnh sinh trắc mồ côi KHÔNG bao giờ hiện trong lịch
  // sử (listHistory chỉ duyệt theo history_views) và cũng KHÔNG xoá được qua UI (deleteVisionResult dựa
  // trên việc nó xuất hiện trong danh sách). Bù trừ thủ công (compensating rollback): gỡ row vision +
  // ảnh đã upload để không để lại dữ liệu sinh trắc mồ côi. Toàn khối vẫn không ném ra ngoài — người
  // dùng đã chờ LLM nên luôn nhận kết quả; chỉ log cảnh báo khi ghi/bù trừ lỗi.
  private async persistVisionHistory(params: {
    user: AuthenticatedUser;
    kind: VisionKind;
    imagePath: string;
    normalizedQuestion: string | null;
    narrative: string;
    providerMetadata: Record<string, string>;
  }): Promise<void> {
    const { user, kind, imagePath, normalizedQuestion, narrative, providerMetadata } = params;

    let visionResultId: string | null = null;
    try {
      const visionResult = await this.persistence.createVisionResult({
        ownerUserId: user.userId,
        kind,
        imagePath,
        question: normalizedQuestion,
        renderedMarkdown: narrative,
        providerMetadata,
      });
      visionResultId = visionResult.id;
      await this.persistence.createHistoryView({
        ownerUserId: user.userId,
        chartSnapshotId: null,
        explanationResultId: null,
        visionResultId: visionResult.id,
      });
    } catch (error) {
      this.logger.warn(
        `[vision.${kind}] persist lịch sử thất bại (kết quả vẫn trả về): ${error instanceof Error ? error.message : String(error)}`,
      );
      // Bù trừ: ảnh đã upload TRƯỚC khi ghi DB nên persist hỏng ở BẤT KỲ bước nào cũng để lại ảnh
      // sinh trắc mồ côi (bucket không còn cron dọn — decision 0023). Hai nhánh:
      //  - vision_results đã tạo nhưng history_views hỏng → gỡ cả row + ảnh.
      //  - createVisionResult hỏng ngay (chưa có row) → chỉ có ảnh mồ côi; vẫn phải gỡ, vì client
      //    chỉ xoá được theo visionResult.id xuất hiện trong lịch sử — không có row thì người dùng
      //    không bao giờ với tới ảnh này để xoá.
      if (visionResultId) {
        await this.rollbackOrphanedVisionResult(user.userId, visionResultId, imagePath, kind);
      } else {
        await this.deleteOrphanedVisionImage(imagePath, kind);
      }
    }
  }

  // Gỡ row vision + ảnh khi bước history_views hỏng. Gọi persistence.deleteVisionResult (gateway
  // owner-scoped delete; history_views cascade theo FK), rồi deleteVisionImage gỡ file Storage.
  //
  // Thứ tự ở ĐÂY (row trước, ảnh sau) NGƯỢC với deleteVisionResult công khai (ảnh trước, row sau) — và
  // sự bất đối xứng này là CỐ Ý: rollback ưu tiên gỡ row vô-chủ trước (row vừa tạo chưa có history_views
  // trỏ tới, người dùng không bao giờ với tới được để tự xoá), còn delete công khai ưu tiên gỡ ảnh sinh
  // trắc trước để không bao giờ để ảnh mồ côi trong bucket không-cron. Mỗi bước bù trừ tự bọc lỗi: rollback
  // hỏng KHÔNG được leo thang thành 5xx (kết quả LLM đã trả cho người dùng) — chỉ log để vận hành xử lý sau.
  private async rollbackOrphanedVisionResult(
    ownerUserId: string,
    visionResultId: string,
    imagePath: string,
    kind: VisionKind,
  ): Promise<void> {
    try {
      await this.persistence.deleteVisionResult(ownerUserId, visionResultId);
    } catch (rollbackError) {
      this.logger.error(
        `[vision.${kind}] bù trừ xoá vision_results id=${visionResultId} thất bại (row mồ côi): ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`,
      );
    }
    await this.deleteOrphanedVisionImage(imagePath, kind);
  }

  // Gỡ riêng ảnh đã upload khi chưa kịp tạo row vision_results (createVisionResult hỏng ngay). Không có
  // row để xoá nên chỉ dọn file Storage. Tự bọc lỗi như mọi bước bù trừ: ảnh dọn hỏng KHÔNG leo thang
  // thành 5xx — chỉ log để vận hành xử lý sau.
  private async deleteOrphanedVisionImage(imagePath: string, kind: VisionKind): Promise<void> {
    try {
      await this.storageGateway.deleteVisionImage(imagePath);
    } catch (rollbackError) {
      this.logger.error(
        `[vision.${kind}] bù trừ xoá ảnh path=${imagePath} thất bại (ảnh mồ côi): ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`,
      );
    }
  }

  // US-017 follow-up (decision 0023): quyền được quên. Xoá một mục vision của chính người dùng —
  // gỡ ảnh sinh trắc khỏi Storage TRƯỚC rồi mới xoá row DB (history_views cascade theo FK). Thứ tự
  // này tránh để row biến mất nhưng ảnh còn mồ côi trong bucket không-cron. Không tìm thấy id của
  // owner → NOT_FOUND (không lộ tồn tại của tài nguyên người khác).
  async deleteVisionResult(user: AuthenticatedUser, visionResultId: string): Promise<void> {
    assertEmailIdentityRequired(user);

    const record = await this.persistence.findVisionResultById(user.userId, visionResultId);
    if (!record) {
      throw new ApiErrorHttpException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'Không tìm thấy mục Xem Tướng/Xem Tay cần xoá.',
      );
    }

    await this.storageGateway.deleteVisionImage(record.imagePath);
    await this.persistence.deleteVisionResult(user.userId, visionResultId);
    this.logger.log(`[vision.${record.kind}] đã xoá vision result id=${visionResultId} (quyền được quên)`);
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
  ): Promise<{ narrative: string; providerMetadata: Record<string, string> }> {
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
      return { narrative: providerResult.renderedMarkdown, providerMetadata: providerResult.providerMetadata };
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
