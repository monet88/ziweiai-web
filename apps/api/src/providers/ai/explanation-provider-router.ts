import { Injectable } from '@nestjs/common';
import { type ProviderPreference } from '@ziweiai/contracts';
import { apiEnv } from '../../config/env';
import type {
  AiExplanationProvider,
  ExplanationPromptPayload,
  ExplanationProviderResult,
} from './ai-explanation-provider';
import { DeepseekExplanationProvider } from './deepseek-explanation-provider';
import { GeminiExplanationProvider } from './gemini-explanation-provider';
import { OpenAiCompatibleExplanationProvider } from './openai-compatible-explanation-provider';
import { ProviderUnavailableError } from './provider-errors';

@Injectable()
export class ExplanationProviderRouter {
  constructor(
    private readonly deepseekProvider: DeepseekExplanationProvider,
    private readonly openAiCompatProvider: OpenAiCompatibleExplanationProvider,
    private readonly geminiProvider: GeminiExplanationProvider,
  ) {}

  resolveProviderName(preference: ProviderPreference): string {
    const availableProvider = this.getProviderChain(preference).find((provider) => provider.isAvailable());
    return (availableProvider ?? this.getProviderChain(preference)[0]).providerName;
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

    let lastError: Error | null = null;

    for (const provider of providers) {
      if (!provider.isAvailable()) {
        continue;
      }

      try {
        return await provider.generateExplanation(payload);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Provider call failed.');
        // Fix suggestion từ review PR #5: CJK guard (nội dung không hợp lệ) không nên failover
        // (tránh tốn quota kép khi cả provider đều trả CJK). Rethrow ngay.
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

  private getProviderChain(preference: ProviderPreference): AiExplanationProvider[] {
    if (preference === 'deepseek') {
      return [this.deepseekProvider];
    }

    if (preference === 'openai-compat') {
      return [this.openAiCompatProvider];
    }

    if (preference === 'gemini') {
      return [this.geminiProvider];
    }

    // preference === 'auto': chain mặc định, nhưng đưa provider được chọn qua
    // AI_DEFAULT_PROVIDER lên đầu (vẫn giữ các provider còn lại làm fallback).
    const order: AiExplanationProvider[] = [this.deepseekProvider, this.openAiCompatProvider, this.geminiProvider];
    const head = apiEnv.AI_DEFAULT_PROVIDER;
    if (head === 'auto') {
      return order;
    }

    const preferred = order.find((provider) => provider.providerName === head);
    return preferred ? [preferred, ...order.filter((provider) => provider !== preferred)] : order;
  }
}
