import { HttpStatus, Injectable } from '@nestjs/common';
import {
  FEATURE_PRICING,
  lenormandDrawSchema,
  LENORMAND_SPREAD_CARD_COUNTS,
  type AuthenticatedUser,
  type LenormandDraw,
  type LenormandSpread,
} from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { apiEnv } from '../../config/env';
import { AiFeatureExecutionOrchestrator } from '../../providers/ai/ai-feature-execution.orchestrator';
import {
  drawLenormandDeterministic,
  getLenormandSpread,
  type LenormandCardDraw,
} from './lenormand-deck';
import { buildLenormandReadingPrompt } from './lenormand-prompts';

type DrawnCardWithPosition = LenormandCardDraw & { position: number; positionLabel: string };

@Injectable()
export class DrawsLenormandService {
  constructor(
    private readonly orchestrator: AiFeatureExecutionOrchestrator,
  ) {}

  async drawLenormand(
    user: AuthenticatedUser,
    ipAddress: string,
    question: string,
    spread: LenormandSpread,
    seed?: string,
  ): Promise<LenormandDraw> {
    if (!apiEnv.EXTENDED_SYSTEM_LENORMAND_ENABLED) {
      // Cờ tắt = từ chối có chủ đích (feature tồn tại nhưng chưa bật) → 403 FORBIDDEN, đồng bộ tarot.
      throw new ApiErrorHttpException(
        HttpStatus.FORBIDDEN,
        'FEATURE_DISABLED',
        'Tính năng Lenormand hiện chưa được bật.',
      );
    }

    const normalizedQuestion = question.trim();
    if (!normalizedQuestion) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        'Câu hỏi Lenormand không được để trống.',
      );
    }

    const spreadDef = getLenormandSpread(spread);
    const count = LENORMAND_SPREAD_CARD_COUNTS[spread];
    const cards: DrawnCardWithPosition[] = drawLenormandDeterministic(seed, count).map((card, index) => ({
      ...card,
      position: index,
      positionLabel: spreadDef.positions[index] ?? `Vị trí ${index + 1}`,
    }));

    const narrative = await this.orchestrator.executeFeature({
      userId: user.userId,
      ipAddress,
      isAnonymous: !user.email,
      quotaFeatureKey: 'lenormand-draw',
      quotaErrorMessage: 'Đã vượt hạn mức rút Lenormand.',
      explanationKind: 'lenormand-reading',
      cost: FEATURE_PRICING.TAROT_LENORMAND,
      paymentErrorMessage: 'Tính năng rút Lenormand yêu cầu đăng nhập và có XU. Vui lòng đăng nhập hoặc nạp XU.',
      paymentInsufficientFundsMessage: `Tính năng rút Lenormand yêu cầu ${FEATURE_PRICING.TAROT_LENORMAND} XU. Số dư XU của bạn không đủ, vui lòng nạp thêm XU.`,
      promptOverride: buildLenormandReadingPrompt(normalizedQuestion, spread, cards),
      generateFallback: () => this.generateDeterministicNarrative(normalizedQuestion, cards, spreadDef.name),
      tier: 'light',
    });

    return lenormandDrawSchema.parse({
      question: normalizedQuestion,
      spread,
      spreadName: spreadDef.name,
      cards: cards.map((card) => ({
        id: card.id,
        name: card.name,
        keywords: card.keywords,
        meaning: card.meaning,
        position: card.position,
        positionLabel: card.positionLabel,
        reversed: card.reversed,
      })),
      narrative,
      seed,
    });
  }

  private generateDeterministicNarrative(
    question: string,
    cards: ReadonlyArray<DrawnCardWithPosition>,
    spreadName: string,
  ): string {
    const cardSummary = cards
      .map((card) => `${card.position + 1}. [${card.positionLabel}] ${card.name}${card.reversed ? ' (ngược)' : ''}`)
      .join('; ');

    return `Câu hỏi: ${question.trim()}. Với ${spreadName}, các lá xuất hiện là: ${cardSummary}. Hãy xem đây là gợi ý chiêm nghiệm ban đầu: bám vào từ khóa của từng lá theo vị trí của nó, nối chúng thành một mạch ý, và chọn một hành động nhỏ, rõ ràng cho hôm nay.`;
  }
}
