import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  dreamInterpretationSchema,
  type AuthenticatedUser,
  type DreamInterpretation,
} from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { throwQuotaRateLimited } from '../quotas/quota-http';
import { apiEnv } from '../../config/env';
import { ExplanationProviderRouter } from '../../providers/ai/explanation-provider-router';
import { ProviderTimeoutError, ProviderUnavailableError } from '../../providers/ai/provider-errors';
import { QuotasService } from '../quotas/quotas.service';
import { matchDreamSymbols, type DreamSymbolData } from './dream-symbol-matcher';
import { buildDreamInterpretationPrompt } from './dream-prompts';

@Injectable()
export class DreamsService {
  private readonly logger = new Logger(DreamsService.name);

  constructor(
    private readonly quotasService: QuotasService,
    private readonly providerRouter: ExplanationProviderRouter,
  ) {}

  async interpretDream(
    user: AuthenticatedUser,
    ipAddress: string,
    dream: string,
  ): Promise<DreamInterpretation> {
    if (!apiEnv.EXTENDED_SYSTEM_DREAM_ENABLED) {
      // Cờ tắt = từ chối có chủ đích (feature tồn tại nhưng chưa bật) → 403 FORBIDDEN, đồng bộ tarot.
      throw new ApiErrorHttpException(
        HttpStatus.FORBIDDEN,
        'FEATURE_DISABLED',
        'Tính năng Giải mộng hiện chưa được bật.',
      );
    }

    const normalizedDream = dream.trim();
    if (!normalizedDream) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        'Mô tả giấc mơ không được để trống.',
      );
    }

    // Gate AI (premium) TRƯỚC quota: đồng bộ tarot — chặn 402 ngay nếu không free-for-all.
    this.assertPremiumEntitlement();
    // email rỗng/null ⟺ phiên ẩn danh (decision 0009); !user.email bắt cả email="".
    await this.assertCanCreate(user.userId, ipAddress, !user.email);

    const symbols = matchDreamSymbols(normalizedDream);
    const narrative = await this.generateNarrative(normalizedDream, symbols);

    return dreamInterpretationSchema.parse({
      dream: normalizedDream,
      symbols,
      narrative,
    });
  }

  private assertPremiumEntitlement(): void {
    if (apiEnv.AI_EXPLANATION_FREE_FOR_ALL) {
      this.logger.warn(
        'AI_EXPLANATION_FREE_FOR_ALL=true — Dream AI gate bypassed (free for all). Set false in production.',
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
      await this.quotasService.assertCanCreateDreamReading(userId, ipAddress, isAnonymous);
    } catch (error) {
      throwQuotaRateLimited(error, 'Đã vượt hạn mức giải mộng.');
    }
  }

  // Luận giải do LLM sinh; biểu tượng khớp deterministic. Provider lỗi/timeout/CJK → rơi về template
  // Việt để lượt giải KHÔNG bị 500 (biểu tượng khớp được là kết quả nền). Đồng bộ tarot/lenormand.
  private async generateNarrative(
    dream: string,
    symbols: ReadonlyArray<DreamSymbolData>,
  ): Promise<string> {
    try {
      const providerResult = await this.providerRouter.generate('auto', {
        explanationKind: 'dream-interpretation',
        promptOverride: buildDreamInterpretationPrompt(dream, symbols),
      });
      if (!providerResult || typeof providerResult.renderedMarkdown !== 'string') {
        throw new ProviderUnavailableError('LLM provider returned an empty or invalid narrative response.');
      }
      this.logger.log(
        `[dream] outcome=generated provider=${providerResult.providerMetadata.provider ?? 'unknown'} symbols=${symbols.length}`,
      );
      return providerResult.renderedMarkdown;
    } catch (error) {
      if (error instanceof ProviderTimeoutError || error instanceof ProviderUnavailableError) {
        this.logger.warn(`[dream] outcome=fallback reason=${error.constructor.name} message=${error.message}`);
        return this.generateDeterministicNarrative(dream, symbols);
      }
      throw error;
    }
  }

  private generateDeterministicNarrative(
    dream: string,
    symbols: ReadonlyArray<DreamSymbolData>,
  ): string {
    if (symbols.length === 0) {
      return `Giấc mơ bạn kể: "${dream.trim()}". Hệ thống chưa nhận diện được biểu tượng quen thuộc nào, nhưng giấc mơ thường phản ánh cảm xúc và suy nghĩ tiềm ẩn. Hãy chú ý cảm giác bạn trải qua trong mơ, ghi lại và chiêm nghiệm dần — đó mới là chỉ dấu quan trọng hơn nội dung cụ thể.`;
    }
    const symbolSummary = symbols
      .map((symbol) => `${symbol.keywords[0]} (${symbol.category}): ${symbol.meaning}`)
      .join('; ');
    return `Giấc mơ bạn kể: "${dream.trim()}". Các biểu tượng nhận ra: ${symbolSummary}. Hãy xem đây là gợi ý chiêm nghiệm ban đầu: nối ý nghĩa biểu tượng với cảm xúc thật của bạn trong giấc mơ, và chọn một điều nhỏ để quan sát hoặc điều chỉnh trong đời sống hôm nay.`;
  }
}
