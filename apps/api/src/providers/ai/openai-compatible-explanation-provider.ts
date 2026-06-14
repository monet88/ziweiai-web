import { Injectable, Logger } from '@nestjs/common';
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

type OpenAiCompatibleResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error?: { message?: string };
};

// Chuẩn hóa base URL về dạng không có dấu `/` cuối và không có hậu tố `/v1`,
// rồi nối `/v1/chat/completions`. Tránh lặp `/v1/v1/...` khi operator cấu hình base
// đã chứa `/v1` (ví dụ proxy cũ). Không đưa `/chat/completions` vào base.
function buildChatCompletionsEndpoint(): string {
  const normalized = apiEnv.OPENAI_COMPAT_BASE_URL.replace(/\/+$/, '').replace(/\/v1$/i, '');
  return `${normalized}/v1/chat/completions`;
}

@Injectable()
export class OpenAiCompatibleExplanationProvider implements AiExplanationProvider {
  private readonly logger = new Logger(OpenAiCompatibleExplanationProvider.name);
  readonly providerName = 'openai-compat';

  isAvailable(): boolean {
    return apiEnv.OPENAI_COMPAT_API_KEY.length > 0;
  }

  async generateExplanation(payload: ExplanationPromptPayload): Promise<ExplanationProviderResult> {
    if (!this.isAvailable()) {
      throw new ProviderUnavailableError('Chưa cấu hình nhà cung cấp OpenAI-compatible.');
    }

    try {
      const model = payload.modelOverride ?? apiEnv.OPENAI_COMPAT_MODEL;
      const response = await fetch(buildChatCompletionsEndpoint(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiEnv.OPENAI_COMPAT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: EXPLANATION_SYSTEM_PROMPT },
            { role: 'user', content: buildExplanationPrompt(payload) },
          ],
          stream: false,
          temperature: 0.7,
          max_tokens: 2048,
        }),
        signal: AbortSignal.timeout(apiEnv.AI_PROVIDER_TIMEOUT_MS),
      });

      // Đọc raw text trước rồi mới thử parse JSON: upstream có thể trả non-JSON
      // (vd trang lỗi HTML 502/504) khiến response.json() ném SyntaxError và che mất
      // HTTP status thật. Cách này giữ lại được mã lỗi để chẩn đoán.
      let body: OpenAiCompatibleResponse = {};
      const rawBody = await response.text();
      if (rawBody.trim().length > 0) {
        try {
          body = JSON.parse(rawBody) as OpenAiCompatibleResponse;
        } catch {
          // Bỏ qua khi phản hồi không phải JSON; giữ body rỗng và dùng HTTP status bên dưới.
        }
      }

      if (!response.ok) {
        const upstreamError =
          typeof body.error?.message === 'string' && body.error.message.trim().length > 0 ? body.error.message.trim() : null;
        throw new ProviderUnavailableError(
          upstreamError
            ? `Yêu cầu nhà cung cấp OpenAI-compatible thất bại: ${upstreamError}`
            : `Yêu cầu nhà cung cấp OpenAI-compatible thất bại: HTTP ${response.status} ${response.statusText}.`,
        );
      }

      const renderedMarkdown = body.choices?.[0]?.message?.content?.trim();
      if (!renderedMarkdown) {
        throw new ProviderUnavailableError('Nhà cung cấp OpenAI-compatible không trả về nội dung luận giải.');
      }

      if (containsCjkText(renderedMarkdown)) {
        this.logger.warn('Nhà cung cấp OpenAI-compatible trả về nội dung chứa chữ Hán, từ chối.');
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
      this.logger.error(
        'Yêu cầu nhà cung cấp OpenAI-compatible thất bại.',
        error instanceof Error ? error.stack : String(error),
      );
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        throw new ProviderTimeoutError('Nhà cung cấp OpenAI-compatible phản hồi quá thời gian chờ.');
      }
      throw new ProviderUnavailableError('Yêu cầu nhà cung cấp OpenAI-compatible thất bại.');
    }
  }
}
