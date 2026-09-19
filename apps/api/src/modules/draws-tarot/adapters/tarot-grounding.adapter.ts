import { Injectable } from '@nestjs/common';
import type { TarotSpread } from '@ziweiai/contracts';
import { buildTarotReadingPrompt } from '../tarot-prompts';
import type { TarotCardDraw } from '../tarot-deck';

export interface TarotGroundingContextParams {
  question: string;
  spread: TarotSpread;
  cards: ReadonlyArray<TarotCardDraw & { position: number }>;
}

@Injectable()
export class TarotGroundingAdapter {
  /**
   * Lấy context (prompt) để gửi cho LLM.
   * Tương lai: Có thể gọi Database Supabase để lấy mô tả lá bài từ Admin.
   * Hiện tại: Đọc từ file tĩnh qua buildTarotReadingPrompt.
   */
  async getGroundingContext(params: TarotGroundingContextParams): Promise<string> {
    // Trả về Promise để tuân thủ interface async (chuẩn bị cho tương lai gọi DB)
    return Promise.resolve(
      buildTarotReadingPrompt(params.question, params.spread, params.cards)
    );
  }
}
