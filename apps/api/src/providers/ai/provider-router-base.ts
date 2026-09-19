import { type ProviderPreference } from '@ziweiai/contracts';
import { apiEnv } from '../../config/env';
import { reportOpsAlert } from '../../observability/ops-alert';
import type { AiExplanationProvider } from './ai-explanation-provider';
import { ProviderTimeoutError, ProviderUnavailableError } from './provider-errors';

// CJK guard (nội dung không hợp lệ) KHÔNG được failover: nếu một provider đã trả chữ Hán thì
// thử provider kế cũng dễ tốn quota kép cho cùng lỗi. Rethrow ngay (fix suggestion review PR #5).
const CJK_GUARD_PATTERN = /chữ Hán|nội dung không hợp lệ/i;

/**
 * Phần chung của hai router AI (luận giải + hội thoại): dựng chain provider theo preference, chọn
 * tên provider sẽ dùng, và vòng failover (bỏ provider không khả dụng, rethrow ngay khi gặp CJK guard).
 * Hai router con chỉ khác ở điểm thật sự riêng: lọc vision-capable (luận giải) và chọn provider
 * streaming (hội thoại). Generic theo loại provider để router hội thoại giữ được AiConversationProvider.
 */
export abstract class ProviderRouterBase<P extends AiExplanationProvider> {
  protected constructor(
    protected readonly deepseekProvider: P,
    protected readonly openAiCompatProvider: P,
    protected readonly geminiProvider: P,
  ) {}

  resolveProviderName(preference: ProviderPreference): string {
    const chain = this.getProviderChain(preference);
    const availableProvider = chain.find((provider) => provider.isAvailable());
    return (availableProvider ?? chain[0]).providerName;
  }

  protected getProviderChain(preference: ProviderPreference): P[] {
    const defaultOrder: P[] = [this.geminiProvider, this.openAiCompatProvider, this.deepseekProvider];

    if (preference === 'deepseek') {
      return [this.deepseekProvider, ...defaultOrder.filter((p) => p !== this.deepseekProvider)];
    }

    if (preference === 'openai-compat') {
      return [this.openAiCompatProvider, ...defaultOrder.filter((p) => p !== this.openAiCompatProvider)];
    }

    if (preference === 'gemini') {
      return [this.geminiProvider, ...defaultOrder.filter((p) => p !== this.geminiProvider)];
    }

    // preference === 'auto': chain mặc định gemini → openai-compat → deepseek (gemini siêu tốc độ
    // làm provider mặc định để tránh 504 Vercel, openai-compat fallback kế). AI_DEFAULT_PROVIDER 
    // (nếu khác 'auto') vẫn được đưa lên đầu chain, phần còn lại giữ nguyên làm fallback.
    const head = apiEnv.AI_DEFAULT_PROVIDER;
    if (head === 'auto') {
      return defaultOrder;
    }

    const preferred = defaultOrder.find((provider) => provider.providerName === head);
    return preferred ? [preferred, ...defaultOrder.filter((provider) => provider !== preferred)] : defaultOrder;
  }

  // Vòng failover dùng chung: thử lần lượt các provider khả dụng, trả kết quả đầu tiên thành công.
  // CJK guard rethrow ngay; các lỗi khác giữ lại để ném cuối nếu cả chain thất bại.
  protected async runFailoverChain<R>(providers: P[], call: (provider: P) => Promise<R>): Promise<R> {
    let lastError: Error | null = null;

    for (let i = 0; i < providers.length; i += 1) {
      const provider = providers[i];
      if (!provider.isAvailable()) {
        continue;
      }

      try {
        return await call(provider);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Provider call failed.');
        if (error instanceof ProviderUnavailableError && CJK_GUARD_PATTERN.test(error.message)) {
          throw error;
        }

        // Kiểm tra xem có provider dự phòng kế tiếp trong chain không
        const nextProvider = providers.slice(i + 1).find((p) => p.isAvailable());
        if (nextProvider) {
          const errMsg = error instanceof Error ? error.message : String(error);
          const is429 = /429|quota|rate limit|resource has been exhausted|resource_exhausted/i.test(errMsg);
          const isTimeout =
            error instanceof ProviderTimeoutError ||
            /timeout|timed out|abort/i.test(errMsg) ||
            (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError'));

          void reportOpsAlert({
            level: 'warning',
            code: 'AI_FALLBACK_ALERT',
            message: `AI Provider [${provider.providerName}] gặp sự cố (${is429 ? '429/Quota' : isTimeout ? 'Timeout' : 'Lỗi'}), tự động fallback sang [${nextProvider.providerName}].`,
            status: is429 ? 429 : isTimeout ? 504 : 502,
            tags: {
              from_provider: provider.providerName,
              to_provider: nextProvider.providerName,
              error_type: is429 ? 'RATE_LIMIT_429' : isTimeout ? 'TIMEOUT' : 'UNAVAILABLE',
              reason: errMsg.slice(0, 150),
            },
            cause: error,
          });
        }
      }
    }

    throw lastError ?? new ProviderUnavailableError('Chưa cấu hình nhà cung cấp AI.');
  }
}
