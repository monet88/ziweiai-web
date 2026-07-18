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

@Injectable()
export class ExplanationProviderRouter extends ProviderRouterBase<AiExplanationProvider> {
  constructor(
    deepseekProvider: DeepseekExplanationProvider,
    openAiCompatProvider: OpenAiCompatibleExplanationProvider,
    geminiProvider: GeminiExplanationProvider,
  ) {
    super(deepseekProvider, openAiCompatProvider, geminiProvider);
  }

  async generate(preference: ProviderPreference, payload: ExplanationPromptPayload): Promise<ExplanationProviderResult> {
    // US-017e: khi có ảnh, lọc chain chỉ còn provider+model thật sự đọc được ảnh (isVisionCapable).
    // Nếu không lọc, failover có thể rơi vào provider text-only (vd deepseek-v4-flash) → ảnh bị bỏ
    // thầm lặng và LLM "ảo" mô tả ảnh không đọc được. Chain rỗng sau lọc → ProviderUnavailableError.
    const providers = payload.imageInput
      ? this.getProviderChain(preference).filter((provider) => provider.isVisionCapable(payload.modelOverride))
      : this.getProviderChain(preference);

    if (payload.imageInput && providers.length === 0) {
      throw new ProviderUnavailableError('Chưa cấu hình nhà cung cấp AI có khả năng đọc ảnh.');
    }

    return this.runFailoverChain(providers, (provider) => provider.generateExplanation(payload));
  }
}
