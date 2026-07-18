import { Injectable } from '@nestjs/common';
import { type ProviderPreference } from '@ziweiai/contracts';
import type {
  AiConversationProvider,
  ConversationPromptPayload,
  ConversationProviderResult,
} from './ai-explanation-provider';
import { DeepseekExplanationProvider } from './deepseek-explanation-provider';
import { GeminiExplanationProvider } from './gemini-explanation-provider';
import { OpenAiCompatibleExplanationProvider } from './openai-compatible-explanation-provider';
import { ProviderRouterBase } from './provider-router-base';

// US-027 (decision 0026): a conversation provider that implements REAL token streaming. The base
// AiConversationProvider keeps generateConversationStream optional so deepseek/gemini still build;
// this narrowed type marks the method as present so callers can use it without a non-null assert.
export type StreamingConversationProvider = AiConversationProvider &
  Required<Pick<AiConversationProvider, 'generateConversationStream'>>;

@Injectable()
export class ConversationProviderRouter extends ProviderRouterBase<AiConversationProvider> {
  constructor(
    deepseekProvider: DeepseekExplanationProvider,
    openAiCompatProvider: OpenAiCompatibleExplanationProvider,
    geminiProvider: GeminiExplanationProvider,
  ) {
    super(deepseekProvider, openAiCompatProvider, geminiProvider);
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
    return this.runFailoverChain(this.getProviderChain(preference), (provider) =>
      provider.generateConversation(payload),
    );
  }
}
