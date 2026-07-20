import { Injectable } from '@nestjs/common';
import { type ProviderPreference } from '@ziweiai/contracts';
import type {
  AiExplanationProvider,
  ExplanationPromptPayload,
  ExplanationProviderResult,
} from './ai-explanation-provider';
import { DeepseekExplanationProvider } from './deepseek-explanation-provider';
import { GeminiExplanationProvider } from './gemini-explanation-provider';
import { OpenAiCompatibleExplanationProvider } from './openai-compatible-explanation-provider';
import { ProviderUnavailableError } from './provider-errors';
import { ProviderRouterBase } from './provider-router-base';
import { LangfuseAiProviderWrapper } from './langfuse-ai-provider-wrapper';

@Injectable()
export class ExplanationProviderRouter extends ProviderRouterBase<AiExplanationProvider> {
  constructor(
    deepseekProvider: DeepseekExplanationProvider,
    openAiCompatProvider: OpenAiCompatibleExplanationProvider,
    geminiProvider: GeminiExplanationProvider,
  ) {
    super(
      new LangfuseAiProviderWrapper(deepseekProvider),
      new LangfuseAiProviderWrapper(openAiCompatProvider),
      new LangfuseAiProviderWrapper(geminiProvider)
    );
  }

  async generate(preference: ProviderPreference, payload: ExplanationPromptPayload): Promise<ExplanationProviderResult> {
    // US-017e: khi có ảnh, lọc chain chỉ còn provider+model thật sự đọc được ảnh (isVisionCapable).
    // Nếu không lọc, failover có thể rơi vào provider text-only (vd deepseek-v4-flash) → ảnh bị bỏ
    // thầm lặng và LLM "ảo" mô tả ảnh không đọc được. Chain rỗng sau lọc → ProviderUnavailableError.
    let providers = payload.imageInput
      ? this.getProviderChain(preference).filter((provider) => provider.isVisionCapable(payload.modelOverride))
      : this.getProviderChain(preference);

    // Tối ưu chi phí: Luôn ưu tiên Gemini (nếu khả dụng) cho tính năng Vision thay vì OpenAI/gpt-4o-mini
    if (payload.imageInput && preference === 'auto') {
      const gemini = providers.find((p) => p.providerName === 'gemini');
      if (gemini) {
        providers = [gemini, ...providers.filter((p) => p !== gemini)];
      }
    }

    if (payload.imageInput && providers.length === 0) {
      throw new ProviderUnavailableError('Chưa cấu hình nhà cung cấp AI có khả năng đọc ảnh.');
    }

    return this.runFailoverChain(providers, (provider) => provider.generateExplanation(payload));
  }
}
