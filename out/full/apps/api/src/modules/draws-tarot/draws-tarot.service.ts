import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  tarotDrawSchema,
  TAROT_SPREAD_CARD_COUNTS,
  type AuthenticatedUser,
  type TarotDraw,
  type TarotSpread,
} from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { throwQuotaRateLimited } from '../quotas/quota-http';
import { apiEnv } from '../../config/env';
import { ExplanationProviderRouter } from '../../providers/ai/explanation-provider-router';
import { ProviderTimeoutError, ProviderUnavailableError } from '../../providers/ai/provider-errors';
import { QuotasService } from '../quotas/quotas.service';
import { drawDeterministic, type TarotCardDraw } from './tarot-deck';
import { buildTarotReadingPrompt, SPREAD_LABELS_VI } from './tarot-prompts';

@Injectable()
export class DrawsTarotService {
  private readonly logger = new Logger(DrawsTarotService.name);

  constructor(
    private readonly quotasService: QuotasService,
    private readonly providerRouter: ExplanationProviderRouter,
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

    // Gate AI (premium) TRƯỚC quota: nếu không free-for-all thì chặn 402 ngay, không để
    // user non-premium "tiêu" lần kiểm tra quota cho thao tác chắc chắn bị từ chối.
    this.assertPremiumEntitlement();
    // email rỗng/null ⟺ phiên ẩn danh (decision 0009): anon JWT có thể mang email="" (không chỉ
    // null), nên dùng !user.email để không bỏ lọt nhánh anon. Đồng bộ với assertEmailIdentityRequired.
    await this.assertCanCreateTarotDraw(user.userId, ipAddress, !user.email);

    const count = TAROT_SPREAD_CARD_COUNTS[spread];
    const cards = drawDeterministic(seed, count).map((card, index) => ({ ...card, position: index }));
    const narrative = await this.generateNarrative(normalizedQuestion, cards, spread);

    return tarotDrawSchema.parse({
      question: normalizedQuestion,
      spread,
      cards,
      narrative,
      seed,
    });
  }

  private assertPremiumEntitlement(): void {
    if (apiEnv.AI_EXPLANATION_FREE_FOR_ALL) {
      this.logger.warn('AI_EXPLANATION_FREE_FOR_ALL=true — Tarot AI gate bypassed (free for all). Set false in production.');
      return;
    }

    throw new ApiErrorHttpException(
      HttpStatus.PAYMENT_REQUIRED,
      'PAYMENT_REQUIRED',
      'Tính năng luận giải AI yêu cầu gói trả phí. Vui lòng nâng cấp để tiếp tục.',
    );
  }

  // Bọc lỗi quota (raw Error từ QuotasService) thành 429 RATE_LIMITED cho đồng bộ với /charts và
  // /explanations; nếu không bọc, raw Error sẽ rơi xuống ApiErrorFilter và trả 500 INTERNAL_ERROR.
  private async assertCanCreateTarotDraw(userId: string, ipAddress: string, isAnonymous: boolean): Promise<void> {
    try {
      await this.quotasService.assertCanCreateTarotDraw(userId, ipAddress, isAnonymous);
    } catch (error) {
      throwQuotaRateLimited(error, 'Đã vượt hạn mức rút Tarot.');
    }
  }

  // US-017i: diễn giải Tarot do LLM sinh. Rút lá vẫn deterministic (seed + cards không đổi); chỉ
  // phần narrative dùng provider chain (tái dùng ExplanationProviderRouter như vision/annual-report).
  // Nếu provider chưa cấu hình / timeout / 5xx → rơi về diễn giải template tiếng Việt để lượt rút
  // KHÔNG bị 500 (lá bài đã rút xong là kết quả chính). Lỗi CJK guard cũng rơi về fallback an toàn.
  private async generateNarrative(
    question: string,
    cards: ReadonlyArray<TarotCardDraw & { position: number }>,
    spread: TarotSpread,
  ): Promise<string> {
    try {
      const providerResult = await this.providerRouter.generate('auto', {
        explanationKind: 'tarot-reading',
        promptOverride: buildTarotReadingPrompt(question, spread, cards),
      });
      // Chốt sớm payload provider: nếu null/thiếu renderedMarkdown hợp lệ → ném
      // ProviderUnavailableError để rơi về template tiếng Việt, tránh trả narrative
      // rỗng/undefined xuống tarotDrawSchema.parse (sẽ 500 khó truy nguyên).
      if (!providerResult || typeof providerResult.renderedMarkdown !== 'string') {
        throw new ProviderUnavailableError('LLM provider returned an empty or invalid narrative response.');
      }
      this.logger.log(
        `[tarot] outcome=generated provider=${providerResult.providerMetadata.provider ?? 'unknown'} cards=${cards.length} spread=${spread}`,
      );
      return providerResult.renderedMarkdown;
    } catch (error) {
      if (error instanceof ProviderTimeoutError || error instanceof ProviderUnavailableError) {
        this.logger.warn(
          `[tarot] outcome=fallback reason=${error.constructor.name} message=${error.message}`,
        );
        return this.generateDeterministicNarrative(question, cards, spread);
      }
      throw error;
    }
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
