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

    const order: AiConversationProvider[] = [this.deepseekProvider, this.openAiCompatProvider, this.geminiProvider];
    const head = apiEnv.AI_DEFAULT_PROVIDER;
    if (head === 'auto') {
      return order;
    }

    const preferred = order.find((provider) => provider.providerName === head);
    return preferred ? [preferred, ...order.filter((provider) => provider !== preferred)] : order;
  }
}
