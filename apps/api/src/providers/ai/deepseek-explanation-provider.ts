import { Injectable, Logger } from '@nestjs/common';
import { type ProviderPreference } from '@ziweiai/contracts';
import { containsCjkText } from '@ziweiai/core';
import { apiEnv } from '../../config/env';
import {
  buildExplanationPrompt,
  type AiExplanationProvider,
  type ExplanationPromptPayload,
  type ExplanationProviderResult,
} from './ai-explanation-provider';
import { EXPLANATION_SYSTEM_PROMPT } from './ai-explanation-provider';
import { ProviderTimeoutError, ProviderUnavailableError } from './provider-errors';

@Injectable()
export class DeepseekExplanationProvider implements AiExplanationProvider {
  private readonly logger = new Logger(DeepseekExplanationProvider.name);
  readonly providerName = 'deepseek';

  isAvailable(): boolean {
    return apiEnv.DEEPSEEK_API_KEY.length > 0;
  }

  async generateExplanation(payload: ExplanationPromptPayload): Promise<ExplanationProviderResult> {
    if (!this.isAvailable()) {
      throw new ProviderUnavailableError('Chưa cấu hình DeepSeek.');
    }

    try {
      const model = payload.modelOverride ?? apiEnv.DEEPSEEK_MODEL;
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiEnv.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: EXPLANATION_SYSTEM_PROMPT },
            { role: 'user', content: payload.promptOverride ?? buildExplanationPrompt(payload) },
          ],
          stream: false,
          temperature: 0.7,
          max_tokens: 2048,
          thinking: { type: 'disabled' },
        }),
        signal: AbortSignal.timeout(apiEnv.AI_PROVIDER_TIMEOUT_MS),
      });

      const body = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };

      if (!response.ok) {
        throw new ProviderUnavailableError('Yêu cầu DeepSeek thất bại.');
      }

      const renderedMarkdown = body.choices?.[0]?.message?.content?.trim();
      if (!renderedMarkdown) {
        throw new ProviderUnavailableError('DeepSeek không trả về nội dung luận giải.');
      }

      if (containsCjkText(renderedMarkdown)) {
        this.logger.warn('DeepSeek trả về nội dung chứa chữ Hán, từ chối.');
        throw new ProviderUnavailableError('Nhà cung cấp trả về nội dung không hợp lệ (chứa chữ Hán).');
      }

      return {
        renderedMarkdown,
        providerMetadata: {
          provider: this.providerName,
          model,
          totalTokens: String(body.usage?.total_tokens ?? 0),
          promptTokens: String(body.usage?.prompt_tokens ?? 0),
          completionTokens: String(body.usage?.completion_tokens ?? 0),
        },
      };
    } catch (error) {
      if (error instanceof ProviderUnavailableError) {
        this.logger.warn(error.message);
        throw error;
      }
      this.logger.error('Yêu cầu DeepSeek thất bại.', error instanceof Error ? error.stack : String(error));
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        throw new ProviderTimeoutError('DeepSeek phản hồi quá thời gian chờ.');
      }
      throw new ProviderUnavailableError('Yêu cầu DeepSeek thất bại.');
    }
  }

  supportsPreference(preference: ProviderPreference): boolean {
    return preference === 'auto' || preference === 'deepseek';
  }
}
