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

type GeminiNativeResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
  error?: { message?: string; code?: number | string; status?: string };
};

async function readGeminiResponseBody(response: Response): Promise<GeminiNativeResponse | null> {
  const rawBody = await response.text();
  if (rawBody.trim().length === 0) {
    return null;
  }

  return JSON.parse(rawBody) as GeminiNativeResponse;
}

function extractGeminiErrorMessage(body: GeminiNativeResponse): string | null {
  if (body.error && typeof body.error === 'object') {
    if ('message' in body.error && typeof body.error.message === 'string' && body.error.message.trim().length > 0) {
      return body.error.message.trim();
    }
  }

  return null;
}

function buildGeminiSdkEndpoint(model: string): string {
  const normalizedBaseUrl = apiEnv.GEMINI_SDK_BASE_URL?.replace(/\/+$/, '');
  if (normalizedBaseUrl) {
    return `${normalizedBaseUrl}/v1beta/models/${model}:generateContent`;
  }

  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

function buildGeminiSdkRequest(payload: ExplanationPromptPayload): RequestInit {
  const headers: Record<string, string> = apiEnv.GEMINI_SDK_BASE_URL
    ? {
        Authorization: `Bearer ${apiEnv.GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      }
    : {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiEnv.GEMINI_API_KEY,
      };

  return {
    method: 'POST',
    headers,
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: EXPLANATION_SYSTEM_PROMPT }],
      },
      contents: [
        {
          parts: [{ text: buildExplanationPrompt(payload) }],
        },
      ],
    }),
    signal: AbortSignal.timeout(apiEnv.AI_PROVIDER_TIMEOUT_MS),
  };
}

@Injectable()
export class GeminiExplanationProvider implements AiExplanationProvider {
  private readonly logger = new Logger(GeminiExplanationProvider.name);
  readonly providerName = 'gemini';

  isAvailable(): boolean {
    return apiEnv.GEMINI_API_KEY.length > 0;
  }

  async generateExplanation(payload: ExplanationPromptPayload): Promise<ExplanationProviderResult> {
    if (!this.isAvailable()) {
      throw new ProviderUnavailableError('Chưa cấu hình Gemini.');
    }

    try {
      const model = payload.modelOverride ?? apiEnv.GEMINI_MODEL;
      const response = await fetch(buildGeminiSdkEndpoint(model), buildGeminiSdkRequest(payload));

      const body = await readGeminiResponseBody(response);

      if (!response.ok) {
        const upstreamError = body ? extractGeminiErrorMessage(body) : null;
        const fallbackMessage = body
          ? 'Yêu cầu Gemini thất bại.'
          : `Yêu cầu Gemini thất bại: HTTP ${response.status} ${response.statusText}.`;
        throw new ProviderUnavailableError(upstreamError ? `Yêu cầu Gemini thất bại: ${upstreamError}` : fallbackMessage);
      }

      if (!body) {
        throw new ProviderUnavailableError('Gemini trả về phản hồi rỗng.');
      }

      const renderedMarkdown = (body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '') ?? [])
        .join('')
        .trim();
      if (!renderedMarkdown) {
        throw new ProviderUnavailableError('Gemini không trả về nội dung luận giải.');
      }

      if (containsCjkText(renderedMarkdown)) {
        this.logger.warn('Gemini trả về nội dung chứa chữ Hán, từ chối.');
        throw new ProviderUnavailableError('Nhà cung cấp trả về nội dung không hợp lệ (chứa chữ Hán).');
      }

      return {
        renderedMarkdown,
        providerMetadata: {
          provider: this.providerName,
          model,
          totalTokens: String(body.usageMetadata?.totalTokenCount ?? 0),
          promptTokens: String(body.usageMetadata?.promptTokenCount ?? 0),
          completionTokens: String(body.usageMetadata?.candidatesTokenCount ?? 0),
        },
      };
    } catch (error) {
      if (error instanceof ProviderUnavailableError) {
        this.logger.warn(error.message);
        throw error;
      }
      this.logger.error('Yêu cầu Gemini thất bại.', error instanceof Error ? error.stack : String(error));
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        throw new ProviderTimeoutError('Gemini phản hồi quá thời gian chờ.');
      }
      throw new ProviderUnavailableError('Yêu cầu Gemini thất bại.');
    }
  }

  supportsPreference(preference: ProviderPreference): boolean {
    return preference === 'auto' || preference === 'gemini';
  }
}
