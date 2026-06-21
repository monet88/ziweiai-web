import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { mbtiResultSchema, type AuthenticatedUser, type MbtiAnswer, type MbtiResult } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { assertCanUseAiExplanation } from '../../common/entitlement/ai-entitlement.guard';
import { apiEnv } from '../../config/env';
import { QuotasService } from '../quotas/quotas.service';
import { scoreMbti } from './mbti-scoring';

@Injectable()
export class QuizzesMbtiService {
  private readonly logger = new Logger(QuizzesMbtiService.name);

  constructor(private readonly quotasService: QuotasService) {}

  async submitQuiz(user: AuthenticatedUser, ipAddress: string, answers: readonly MbtiAnswer[]): Promise<MbtiResult> {
    if (!apiEnv.EXTENDED_SYSTEM_MBTI_ENABLED) {
      // Cờ tắt = từ chối có chủ đích (feature tồn tại nhưng chưa bật) → 403 FORBIDDEN, đồng bộ Tarot.
      throw new ApiErrorHttpException(
        HttpStatus.FORBIDDEN,
        'FEATURE_DISABLED',
        'Tính năng MBTI hiện chưa được bật.',
      );
    }

    // Gate AI (premium) TRƯỚC quota: không free-for-all thì chặn 402 ngay, không để user
    // non-premium "tiêu" lượt kiểm tra quota cho thao tác chắc chắn bị từ chối (giống Tarot).
    // Dùng guard entitlement DÙNG CHUNG (decision 0010) thay vì tự viết — một nguồn chính sách
    // cho mọi đường AI text, tránh lệch hành vi/thông điệp giữa các endpoint (review PR #24).
    assertCanUseAiExplanation(this.logger);
    // email rỗng/null ⟺ phiên ẩn danh (decision 0009): anon JWT có thể mang email="" nên dùng
    // !user.email để không bỏ lọt nhánh anon. Đồng bộ với assertEmailIdentityRequired.
    await this.assertCanCreateMbtiQuiz(user.userId, ipAddress, !user.email);

    const scored = scoreMbti(answers);
    const narrative = this.generateDeterministicNarrative(scored);

    return mbtiResultSchema.parse({ ...scored, narrative });
  }

  // Bọc lỗi quota (raw Error từ QuotasService) thành 429 RATE_LIMITED cho đồng bộ với /charts,
  // /explanations, /draws/tarot; nếu không bọc, raw Error rơi xuống ApiErrorFilter → 500.
  private async assertCanCreateMbtiQuiz(userId: string, ipAddress: string, isAnonymous: boolean): Promise<void> {
    try {
      await this.quotasService.assertCanCreateMbtiQuiz(userId, ipAddress, isAnonymous);
    } catch (error) {
      throw new ApiErrorHttpException(
        HttpStatus.TOO_MANY_REQUESTS,
        'RATE_LIMITED',
        error instanceof Error ? error.message : 'Đã vượt hạn mức làm trắc nghiệm MBTI.',
      );
    }
  }

  // Giai đoạn proof: narrative deterministic (chưa wire LLM thật) — giống Tarot. Khi bật LLM
  // thật ở bước sau, thay thân hàm này bằng provider chain (giữ nguyên gate phía trên).
  private generateDeterministicNarrative(scored: Omit<MbtiResult, 'narrative'>): string {
    const axisSummary = scored.axes
      .map((axis) => `${axis.label} ${axis.score}%`)
      .join('; ');

    return `Kiểu tính cách của bạn là ${scored.type}. Theo bốn trục: ${axisSummary}. Hãy xem đây là gợi ý tham khảo ban đầu: nhận ra điểm mạnh tự nhiên của mình, lưu ý những trục gần mức cân bằng vì đó là nơi bạn linh hoạt nhất, và chọn một thói quen nhỏ phù hợp với xu hướng nổi trội để phát triển trong tuần này.`;
  }
}
