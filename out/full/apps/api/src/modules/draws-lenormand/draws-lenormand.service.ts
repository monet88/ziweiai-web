import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  lenormandDrawSchema,
  LENORMAND_SPREAD_CARD_COUNTS,
  type AuthenticatedUser,
  type LenormandDraw,
  type LenormandSpread,
} from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { throwQuotaRateLimited } from '../quotas/quota-http';
import { apiEnv } from '../../config/env';
import { ExplanationProviderRouter } from '../../providers/ai/explanation-provider-router';
import { ProviderTimeoutError, ProviderUnavailableError } from '../../providers/ai/provider-errors';
import { QuotasService } from '../quotas/quotas.service';
import {
  drawLenormandDeterministic,
  getLenormandSpread,
  type LenormandCardDraw,
} from './lenormand-deck';
import { buildLenormandReadingPrompt } from './lenormand-prompts';

type DrawnCardWithPosition = LenormandCardDraw & { position: number; positionLabel: string };

@Injectable()
export class DrawsLenormandService {
  private readonly logger = new Logger(DrawsLenormandService.name);

  constructor(
    private readonly quotasService: QuotasService,
    private readonly providerRouter: ExplanationProviderRouter,
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

    // Gate AI (premium) TRƯỚC quota: đồng bộ tarot — chặn 402 ngay nếu không free-for-all.
    this.assertPremiumEntitlement();
    // email rỗng/null ⟺ phiên ẩn danh (decision 0009); !user.email bắt cả email="".
    await this.assertCanCreate(user.userId, ipAddress, !user.email);

    const spreadDef = getLenormandSpread(spread);
    const count = LENORMAND_SPREAD_CARD_COUNTS[spread];
    const cards: DrawnCardWithPosition[] = drawLenormandDeterministic(seed, count).map((card, index) => ({
      ...card,
      position: index,
      positionLabel: spreadDef.positions[index] ?? `Vị trí ${index + 1}`,
    }));
    const narrative = await this.generateNarrative(normalizedQuestion, cards, spread, spreadDef.name);

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

  private assertPremiumEntitlement(): void {
    if (apiEnv.AI_EXPLANATION_FREE_FOR_ALL) {
      this.logger.warn(
        'AI_EXPLANATION_FREE_FOR_ALL=true — Lenormand AI gate bypassed (free for all). Set false in production.',
      );
      return;
    }

    throw new ApiErrorHttpException(
      HttpStatus.PAYMENT_REQUIRED,
      'PAYMENT_REQUIRED',
      'Tính năng luận giải AI yêu cầu gói trả phí. Vui lòng nâng cấp để tiếp tục.',
    );
  }

  private async assertCanCreate(userId: string, ipAddress: string, isAnonymous: boolean): Promise<void> {
    try {
      await this.quotasService.assertCanCreateLenormandDraw(userId, ipAddress, isAnonymous);
    } catch (error) {
      throwQuotaRateLimited(error, 'Đã vượt hạn mức rút Lenormand.');
    }
  }

  // Bài đọc do LLM sinh; rút lá vẫn deterministic. Provider lỗi/timeout/CJK → rơi về template Việt
  // để lượt rút KHÔNG bị 500 (lá đã rút là kết quả chính). Đồng bộ tarot.
  private async generateNarrative(
    question: string,
    cards: ReadonlyArray<DrawnCardWithPosition>,
    spread: LenormandSpread,
    spreadName: string,
  ): Promise<string> {
    try {
      const providerResult = await this.providerRouter.generate('auto', {
        explanationKind: 'lenormand-reading',
        promptOverride: buildLenormandReadingPrompt(question, spread, cards),
      });
      if (!providerResult || typeof providerResult.renderedMarkdown !== 'string') {
        throw new ProviderUnavailableError('LLM provider returned an empty or invalid narrative response.');
      }
      this.logger.log(
        `[lenormand] outcome=generated provider=${providerResult.providerMetadata.provider ?? 'unknown'} cards=${cards.length} spread=${spread}`,
      );
      return providerResult.renderedMarkdown;
    } catch (error) {
      if (error instanceof ProviderTimeoutError || error instanceof ProviderUnavailableError) {
        this.logger.warn(`[lenormand] outcome=fallback reason=${error.constructor.name} message=${error.message}`);
        return this.generateDeterministicNarrative(question, cards, spreadName);
      }
      throw error;
    }
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
