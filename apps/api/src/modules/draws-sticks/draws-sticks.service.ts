import { HttpStatus, Injectable } from '@nestjs/common';
import {
  FEATURE_PRICING,
  stickDrawSchema,
  type AuthenticatedUser,
  type DivinationStick,
  type StickDraw,
} from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { apiEnv } from '../../config/env';
import { AiFeatureExecutionOrchestrator } from '../../providers/ai/ai-feature-execution.orchestrator';
import { drawStickDeterministic } from './stick-deck';
import { buildStickReadingPrompt } from './stick-prompts';

@Injectable()
export class DrawsSticksService {
  constructor(
    private readonly orchestrator: AiFeatureExecutionOrchestrator,
  ) {}

  async drawStick(
    user: AuthenticatedUser,
    ipAddress: string,
    question: string,
    seed?: string,
  ): Promise<StickDraw> {
    if (!apiEnv.EXTENDED_SYSTEM_STICKS_ENABLED) {
      // Cờ tắt = từ chối có chủ đích (feature tồn tại nhưng chưa bật) → 403 FORBIDDEN, đồng bộ tarot.
      throw new ApiErrorHttpException(
        HttpStatus.FORBIDDEN,
        'FEATURE_DISABLED',
        'Tính năng Xin xăm hiện chưa được bật.',
      );
    }

    const normalizedQuestion = question.trim();
    if (!normalizedQuestion) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        'Câu hỏi xin xăm không được để trống.',
      );
    }

    const stick = drawStickDeterministic(seed);

    const narrative = await this.orchestrator.executeFeature({
      userId: user.userId,
      ipAddress,
      isAnonymous: !user.email,
      quotaFeatureKey: 'stick-draw',
      quotaErrorMessage: 'Đã vượt hạn mức xin xăm.',
      explanationKind: 'stick-reading',
      cost: FEATURE_PRICING.STICKS,
      paymentErrorMessage: 'Tính năng xin xăm yêu cầu đăng nhập và có XU. Vui lòng đăng nhập hoặc nạp XU.',
      paymentInsufficientFundsMessage: `Tính năng xin xăm yêu cầu ${FEATURE_PRICING.STICKS} XU. Số dư XU của bạn không đủ, vui lòng nạp thêm XU.`,
      promptOverride: buildStickReadingPrompt(normalizedQuestion, stick),
      generateFallback: () => this.generateDeterministicNarrative(normalizedQuestion, stick),
      tier: 'light',
    });

    return stickDrawSchema.parse({
      question: normalizedQuestion,
      stick,
      narrative,
      seed,
    });
  }

  private generateDeterministicNarrative(question: string, stick: DivinationStick): string {
    return `Câu hỏi: ${question.trim()}. Bạn rút được quẻ số ${stick.id} — ${stick.title} (mức ${stick.level}). Thơ quẻ: ${stick.poem} Nghĩa nền: ${stick.interpretation} Hãy xem đây là gợi ý chiêm nghiệm: soi lời quẻ vào câu hỏi của bạn, rồi chọn một hành động nhỏ, rõ ràng cho hôm nay.`;
  }
}
