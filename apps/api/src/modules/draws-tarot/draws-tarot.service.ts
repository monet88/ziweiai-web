import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  tarotDrawSchema,
  TAROT_SPREAD_CARD_COUNTS,
  type AuthenticatedUser,
  type TarotDraw,
  type TarotSpread,
  FEATURE_PRICING,
} from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { apiEnv } from '../../config/env';
import { AiFeatureExecutionOrchestrator } from '../../providers/ai/ai-feature-execution.orchestrator';
import { drawDeterministic, type TarotCardDraw } from './tarot-deck';
import { SPREAD_LABELS_VI } from './tarot-prompts';

import { TarotGroundingAdapter } from './adapters/tarot-grounding.adapter';

@Injectable()
export class DrawsTarotService {
  private readonly logger = new Logger(DrawsTarotService.name);

  constructor(
    private readonly orchestrator: AiFeatureExecutionOrchestrator,
    private readonly tarotGroundingAdapter: TarotGroundingAdapter,
  ) {}

  async drawTarot(
    user: AuthenticatedUser,
    ipAddress: string,
    question: string,
    spread: TarotSpread,
    seed?: string,
  ): Promise<TarotDraw> {
    if (!apiEnv.EXTENDED_SYSTEM_TAROT_ENABLED) {
      // Cờ tắt = từ chối có chủ đích (feature tồn tại nhưng chưa bật) → 403 FORBIDDEN,
      // KHÔNG dùng 404 (lệch nghĩa "không có resource") cho đồng bộ với IDENTITY_REQUIRED.
      throw new ApiErrorHttpException(
        HttpStatus.FORBIDDEN,
        'FEATURE_DISABLED',
        'Tính năng Tarot hiện chưa được bật.',
      );
    }

    const normalizedQuestion = question.trim();
    if (!normalizedQuestion) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        'Câu hỏi Tarot không được để trống.',
      );
    }

    const count = TAROT_SPREAD_CARD_COUNTS[spread];
    const cards = drawDeterministic(seed, count).map((card, index) => ({ ...card, position: index }));

    const promptOverride = await this.tarotGroundingAdapter.getGroundingContext({
      question: normalizedQuestion,
      spread,
      cards,
    });

    const narrative = await this.orchestrator.executeFeature({
      userId: user.userId,
      ipAddress,
      isAnonymous: !user.email,
      quotaFeatureKey: 'tarot-draw',
      quotaErrorMessage: 'Đã vượt hạn mức rút Tarot.',
      explanationKind: 'tarot-reading',
      cost: FEATURE_PRICING.TAROT_LENORMAND,
      paymentErrorMessage: 'Tính năng gieo quẻ Tarot yêu cầu đăng nhập và có XU. Vui lòng đăng nhập hoặc nạp XU.',
      paymentInsufficientFundsMessage: `Tính năng rút Tarot yêu cầu ${FEATURE_PRICING.TAROT_LENORMAND} XU. Số dư XU của bạn không đủ, vui lòng nạp thêm XU.`,
      promptOverride,
      generateFallback: () => this.generateDeterministicNarrative(normalizedQuestion, cards, spread),
      tier: 'light',
    });

    return tarotDrawSchema.parse({
      question: normalizedQuestion,
      spread,
      cards,
      narrative,
      seed,
    });
  }

  private generateDeterministicNarrative(
    question: string,
    cards: ReadonlyArray<TarotCardDraw & { position: number }>,
    spread: TarotSpread,
  ): string {
    const spreadLabel = SPREAD_LABELS_VI[spread];
    const cardSummary = cards
      .map((card) => `${card.position + 1}. ${card.name}${card.reversed ? ' (ngược)' : ''}`)
      .join('; ');

    return `Câu hỏi: ${question.trim()}. Với ${spreadLabel}, các lá xuất hiện là: ${cardSummary}. Hãy xem đây là gợi ý chiêm nghiệm ban đầu: tập trung vào chủ đề chính của câu hỏi, quan sát lá đang ngược như lời nhắc cần điều chỉnh, và chọn một hành động nhỏ, rõ ràng trong ngày hôm nay.`;
  }
}
