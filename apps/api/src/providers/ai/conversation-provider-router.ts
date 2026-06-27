import { Injectable } from '@nestjs/common';
import { type ProviderPreference } from '@ziweiai/contracts';
import { apiEnv } from '../../config/env';
import type {
  AiConversationProvider,
  ConversationPromptPayload,
  ConversationProviderResult,
} from './ai-explanation-provider';
import { DeepseekExplanationProvider } from './deepseek-explanation-provider';
import { GeminiExplanationProvider } from './gemini-explanation-provider';
import { OpenAiCompatibleExplanationProvider } from './openai-compatible-explanation-provider';
import { ProviderUnavailableError } from './provider-errors';

// US-027 (decision 0026): a conversation provider that implements REAL token streaming. The base
// AiConversationProvider keeps generateConversationStream optional so deepseek/gemini still build;
// this narrowed type marks the method as present so callers can use it without a non-null assert.
export type StreamingConversationProvider = AiConversationProvider &
  Required<Pick<AiConversationProvider, 'generateConversationStream'>>;

@Injectable()
export class ConversationProviderRouter {
  constructor(
    private readonly deepseekProvider: DeepseekExplanationProvider,
    private readonly openAiCompatProvider: OpenAiCompatibleExplanationProvider,
    private readonly geminiProvider: GeminiExplanationProvider,
  ) {}

  resolveProviderName(preference: ProviderPreference): string {
    const availableProvider = this.getProviderChain(preference).find((provider) => provider.isAvailable());
    return (availableProvider ?? this.getProviderChain(preference)[0]).providerName;
  }

  // US-027 (decision 0026): pick the provider the controller would actually use (first available in
  // the preference chain) and only return it when it supports REAL token streaming. Returning null
  // tells the controller to fall back to the non-streaming single-shot path. We intentionally do NOT
  // skip a non-streaming first provider to reach a streaming one further down the chain: that would
  // diverge from the non-stream router's provider choice and surprise the operator's preference.
  resolveStreamingProvider(preference: ProviderPreference): StreamingConversationProvider | null {
    const firstAvailable = this.getProviderChain(preference).find((provider) => provider.isAvailable());
    if (firstAvailable && typeof firstAvailable.generateConversationStream === 'function') {
      return firstAvailable as StreamingConversationProvider;
    }
    return null;
  }

  async generate(preference: ProviderPreference, payload: ConversationPromptPayload): Promise<ConversationProviderResult> {
    const providers = this.getProviderChain(preference);
    let lastError: Error | null = null;

    for (const provider of providers) {
      if (!provider.isAvailable()) {
        continue;
      }

      try {
        return await provider.generateConversation(payload);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Provider call failed.');
        if (
          error instanceof ProviderUnavailableError &&
          /chữ Hán|nội dung không hợp lệ/i.test(error.message)
        ) {
          throw error;
        }
      }
    }

    throw lastError ?? new ProviderUnavailableError('Chưa cấu hình nhà cung cấp AI.');
  }

  private getProviderChain(preference: ProviderPreference): AiConversationProvider[] {
    if (preference === 'deepseek') {
      return [this.deepseekProvider];
    }

    if (preference === 'openai-compat') {
      return [this.openAiCompatProvider];
    }

    if (preference === 'gemini') {
      return [this.geminiProvider];
    }

    // Chain mặc định openai-compat → deepseek → gemini (khớp ExplanationProviderRouter):
    // openai-compat là provider mặc định, deepseek là fallback kế. AI_DEFAULT_PROVIDER (nếu
    // khác 'auto') vẫn được đưa lên đầu chain, phần còn lại giữ nguyên làm fallback.
    const order: AiConversationProvider[] = [this.openAiCompatProvider, this.deepseekProvider, this.geminiProvider];
    const head = apiEnv.AI_DEFAULT_PROVIDER;
    if (head === 'auto') {
      return order;
    }

    const preferred = order.find((provider) => provider.providerName === head);
    return preferred ? [preferred, ...order.filter((provider) => provider !== preferred)] : order;
  }
}
