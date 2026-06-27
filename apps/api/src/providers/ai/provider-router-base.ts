import { type ProviderPreference } from '@ziweiai/contracts';
import { apiEnv } from '../../config/env';
import type { AiExplanationProvider } from './ai-explanation-provider';
import { ProviderUnavailableError } from './provider-errors';

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
    if (preference === 'deepseek') {
      return [this.deepseekProvider];
    }

    if (preference === 'openai-compat') {
      return [this.openAiCompatProvider];
    }

    if (preference === 'gemini') {
      return [this.geminiProvider];
    }

    // preference === 'auto': chain mặc định openai-compat → deepseek → gemini (openai-compat làm
    // provider mặc định, deepseek là fallback kế). AI_DEFAULT_PROVIDER (nếu khác 'auto') vẫn được
    // đưa lên đầu chain, phần còn lại giữ nguyên làm fallback.
    const order: P[] = [this.openAiCompatProvider, this.deepseekProvider, this.geminiProvider];
    const head = apiEnv.AI_DEFAULT_PROVIDER;
    if (head === 'auto') {
      return order;
    }

    const preferred = order.find((provider) => provider.providerName === head);
    return preferred ? [preferred, ...order.filter((provider) => provider !== preferred)] : order;
  }

  // Vòng failover dùng chung: thử lần lượt các provider khả dụng, trả kết quả đầu tiên thành công.
  // CJK guard rethrow ngay; các lỗi khác giữ lại để ném cuối nếu cả chain thất bại.
  protected async runFailoverChain<R>(providers: P[], call: (provider: P) => Promise<R>): Promise<R> {
    let lastError: Error | null = null;

    for (const provider of providers) {
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
      }
    }

    throw lastError ?? new ProviderUnavailableError('Chưa cấu hình nhà cung cấp AI.');
  }
}
