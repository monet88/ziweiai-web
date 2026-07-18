import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  stickDrawSchema,
  type AuthenticatedUser,
  type DivinationStick,
  type StickDraw,
} from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { throwQuotaRateLimited } from '../quotas/quota-http';
import { apiEnv } from '../../config/env';
import { ExplanationProviderRouter } from '../../providers/ai/explanation-provider-router';
import { ProviderTimeoutError, ProviderUnavailableError } from '../../providers/ai/provider-errors';
import { QuotasService } from '../quotas/quotas.service';
import { drawStickDeterministic } from './stick-deck';
import { buildStickReadingPrompt } from './stick-prompts';

@Injectable()
export class DrawsSticksService {
  private readonly logger = new Logger(DrawsSticksService.name);

  constructor(
    private readonly quotasService: QuotasService,
    private readonly providerRouter: ExplanationProviderRouter,
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

    // Gate AI (premium) TRƯỚC quota: đồng bộ tarot — chặn 402 ngay nếu không free-for-all.
    this.assertPremiumEntitlement();
    // email rỗng/null ⟺ phiên ẩn danh (decision 0009); !user.email bắt cả email="".
    await this.assertCanCreate(user.userId, ipAddress, !user.email);

    const stick = drawStickDeterministic(seed);
    const narrative = await this.generateNarrative(normalizedQuestion, stick);

    return stickDrawSchema.parse({
      question: normalizedQuestion,
      stick,
      narrative,
      seed,
    });
  }

  private assertPremiumEntitlement(): void {
    if (apiEnv.AI_EXPLANATION_FREE_FOR_ALL) {
      this.logger.warn(
        'AI_EXPLANATION_FREE_FOR_ALL=true — Stick AI gate bypassed (free for all). Set false in production.',
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
      await this.quotasService.assertCanCreateStickDraw(userId, ipAddress, isAnonymous);
    } catch (error) {
      throwQuotaRateLimited(error, 'Đã vượt hạn mức xin xăm.');
    }
  }

  // Bài luận do LLM sinh; rút quẻ vẫn deterministic. Provider lỗi/timeout/CJK → rơi về template Việt
  // để lượt xin xăm KHÔNG bị 500 (quẻ đã rút là kết quả chính). Đồng bộ tarot.
  private async generateNarrative(question: string, stick: DivinationStick): Promise<string> {
    try {
      const providerResult = await this.providerRouter.generate('auto', {
        explanationKind: 'stick-reading',
        promptOverride: buildStickReadingPrompt(question, stick),
      });
      if (!providerResult || typeof providerResult.renderedMarkdown !== 'string') {
        throw new ProviderUnavailableError('LLM provider returned an empty or invalid narrative response.');
      }
      this.logger.log(
        `[stick] outcome=generated provider=${providerResult.providerMetadata.provider ?? 'unknown'} stick=${stick.id} level=${stick.level}`,
      );
      return providerResult.renderedMarkdown;
    } catch (error) {
      if (error instanceof ProviderTimeoutError || error instanceof ProviderUnavailableError) {
        this.logger.warn(`[stick] outcome=fallback reason=${error.constructor.name} message=${error.message}`);
        return this.generateDeterministicNarrative(question, stick);
      }
      throw error;
    }
  }

  private generateDeterministicNarrative(question: string, stick: DivinationStick): string {
    return `Câu hỏi: ${question.trim()}. Bạn rút được quẻ số ${stick.id} — ${stick.title} (mức ${stick.level}). Thơ quẻ: ${stick.poem} Nghĩa nền: ${stick.interpretation} Hãy xem đây là gợi ý chiêm nghiệm: soi lời quẻ vào câu hỏi của bạn, rồi chọn một hành động nhỏ, rõ ràng cho hôm nay.`;
  }
}
