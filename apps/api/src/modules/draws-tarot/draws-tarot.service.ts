import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { tarotDrawSchema, type AuthenticatedUser, type TarotDraw, type TarotSpread } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { apiEnv } from '../../config/env';
import { QuotasService } from '../quotas/quotas.service';
import { drawDeterministic, type TarotCardDraw } from './tarot-deck';

@Injectable()
export class DrawsTarotService {
  private readonly logger = new Logger(DrawsTarotService.name);

  constructor(private readonly quotasService: QuotasService) {}

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
    await this.quotasService.assertCanCreateExplanation(user.userId, ipAddress, user.email === null);

    const count = spread === 'celtic-cross' ? 10 : 3;
    const cards = drawDeterministic(seed, count).map((card, index) => ({ ...card, position: index }));
    const narrative = this.generateDeterministicNarrative(normalizedQuestion, cards, spread);

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

  private generateDeterministicNarrative(
    question: string,
    cards: ReadonlyArray<TarotCardDraw & { position: number }>,
    spread: TarotSpread,
  ): string {
    const spreadLabel = spread === 'celtic-cross' ? 'trải bài Celtic Cross' : 'trải bài ba lá';
    const cardSummary = cards
      .map((card) => `${card.position + 1}. ${card.name}${card.reversed ? ' (ngược)' : ''}`)
      .join('; ');

    return `Câu hỏi: ${question.trim()}. Với ${spreadLabel}, các lá xuất hiện là: ${cardSummary}. Hãy xem đây là gợi ý chiêm nghiệm ban đầu: tập trung vào chủ đề chính của câu hỏi, quan sát lá đang ngược như lời nhắc cần điều chỉnh, và chọn một hành động nhỏ, rõ ràng trong ngày hôm nay.`;
  }
}
