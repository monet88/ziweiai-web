import { Injectable, Logger } from '@nestjs/common';
import { type ProviderPreference } from '@ziweiai/contracts';
import { containsCjkText } from '@ziweiai/core';
import { apiEnv } from '../../config/env';
import {
  buildExplanationPrompt,
  type AiConversationProvider,
  type ConversationPromptPayload,
  type ConversationProviderResult,
  type ExplanationPromptPayload,
  type ExplanationProviderResult,
} from './ai-explanation-provider';
import { buildConversationPrompt } from './build-conversation-prompt';
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

function buildGeminiSdkRequest(params: {
  prompt: string;
  imageInput?: { base64: string; mimeType: string };
  timeoutMsOverride?: number;
}): RequestInit {
  const headers: Record<string, string> = apiEnv.GEMINI_SDK_BASE_URL
    ? {
        Authorization: `Bearer ${apiEnv.GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      }
    : {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiEnv.GEMINI_API_KEY,
      };

  // US-017e: Gemini dùng shape RIÊNG cho ảnh — KHÔNG phải image_url như OpenAI-style. Ảnh là một part
  // inlineData {mimeType, data:<base64>} nằm cùng mảng parts với text. Khi có imageInput, thêm part này.
  const textPart = { text: params.prompt };
  const parts = params.imageInput
    ? [textPart, { inlineData: { mimeType: params.imageInput.mimeType, data: params.imageInput.base64 } }]
    : [textPart];

  return {
    method: 'POST',
    headers,
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: EXPLANATION_SYSTEM_PROMPT }],
      },
      contents: [
        {
          parts,
        },
      ],
    }),
    signal: AbortSignal.timeout(params.timeoutMsOverride ?? apiEnv.AI_PROVIDER_TIMEOUT_MS),
  };
}

@Injectable()
export class GeminiExplanationProvider implements AiConversationProvider {
  private readonly logger = new Logger(GeminiExplanationProvider.name);
  readonly providerName = 'gemini';

  isAvailable(): boolean {
    return apiEnv.GEMINI_API_KEY.length > 0;
  }

  async generateConversation(payload: ConversationPromptPayload): Promise<ConversationProviderResult> {
    return this.generateContent({
      prompt: buildConversationPrompt(payload),
      emptyMessage: 'Gemini không trả về nội dung hội thoại.',
      metadataKind: 'conversation',
      modelOverride: payload.modelOverride,
    });
  }

  // US-017e: model Gemini (gemini-3.5-flash mặc định) hỗ trợ đa thể thức (đọc ảnh). Coi như đọc được
  // ảnh khi key có sẵn.
  isVisionCapable(): boolean {
    return this.isAvailable();
  }

  async generateExplanation(payload: ExplanationPromptPayload): Promise<ExplanationProviderResult> {
    return this.generateContent({
      prompt: payload.promptOverride ?? buildExplanationPrompt(payload),
      emptyMessage: 'Gemini không trả về nội dung luận giải.',
      metadataKind: 'explanation',
      modelOverride: payload.modelOverride,
      imageInput: payload.imageInput,
      timeoutMsOverride: payload.timeoutMsOverride,
    });
  }

  private async generateContent(params: {
    prompt: string;
    emptyMessage: string;
    metadataKind: 'explanation' | 'conversation';
    modelOverride?: string;
    imageInput?: { base64: string; mimeType: string };
    timeoutMsOverride?: number;
  }): Promise<ExplanationProviderResult> {
    if (!this.isAvailable()) {
      throw new ProviderUnavailableError('Chưa cấu hình Gemini.');
    }

    try {
      const model = params.modelOverride ?? apiEnv.GEMINI_MODEL;
      const response = await fetch(
        buildGeminiSdkEndpoint(model),
        buildGeminiSdkRequest({
          prompt: params.prompt,
          imageInput: params.imageInput,
          timeoutMsOverride: params.timeoutMsOverride,
        }),
      );

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
        throw new ProviderUnavailableError(params.emptyMessage);
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
          kind: params.metadataKind,
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
