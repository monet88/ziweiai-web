import { apiEnv } from '../../config/env';
import { EXPLANATION_SYSTEM_PROMPT } from './ai-explanation-provider';
import {
  type LlmChatAdapter,
  type LlmChatAdapterBuildParams,
  type LlmChatRequest,
  type LlmParsedResult,
  type LlmUsage,
} from './llm-chat-adapter';
import { ProviderUnavailableError } from './provider-errors';

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

  // Đọc raw text rồi mới thử parse JSON: upstream/proxy có thể trả non-JSON (trang lỗi HTML 502/504)
  // khiến JSON.parse ném SyntaxError TRƯỚC khi parseResult kiểm tra !response.ok → mất HTTP status thật
  // và lỗi bị map thành unavailableMessage chung. Trả null khi parse hỏng để parseResult vẫn vào nhánh
  // !response.ok và surface đúng "HTTP <status> <statusText>" (khớp pattern phòng thủ của OpenAi-style).
  try {
    return JSON.parse(rawBody) as GeminiNativeResponse;
  } catch {
    return null;
  }
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

/**
 * REFACTOR-007 (decision 0030): adapter cho Gemini native generateContent. Shape RIÊNG so với
 * OpenAI-style — ảnh là một part inlineData {mimeType, data:<base64>} cùng mảng parts với text, system
 * prompt qua systemInstruction, auth qua x-goog-api-key (hoặc Bearer khi có base URL tùy biến).
 */
export class GeminiChatAdapter implements LlmChatAdapter {
  readonly providerName = 'gemini';
  // US-017e: Gemini hỗ trợ đa thể thức (đọc ảnh). Coi như đọc được ảnh khi key có sẵn.
  readonly visionCapable = true;
  readonly notConfiguredMessage = 'Chưa cấu hình Gemini.';
  readonly timeoutMessage = 'Gemini phản hồi quá thời gian chờ.';
  readonly unavailableMessage = 'Yêu cầu Gemini thất bại.';

  isAvailable(): boolean {
    return apiEnv.GEMINI_API_KEY.length > 0;
  }

  resolveModel(modelOverride?: string): string {
    return modelOverride ?? apiEnv.GEMINI_MODEL;
  }

  buildRequest(params: LlmChatAdapterBuildParams): LlmChatRequest {
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
    // inlineData {mimeType, data:<base64>} nằm cùng mảng parts với text.
    const textPart = { text: params.prompt };
    const parts = params.imageInput
      ? [textPart, { inlineData: { mimeType: params.imageInput.mimeType, data: params.imageInput.base64 } }]
      : [textPart];

    return {
      url: buildGeminiSdkEndpoint(params.model),
      init: {
        method: 'POST',
        headers,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: EXPLANATION_SYSTEM_PROMPT }],
          },
          contents: [{ parts }],
        }),
        signal: params.signal,
      },
    };
  }

  async parseResult(response: Response): Promise<LlmParsedResult> {
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

    const text = (body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '') ?? []).join('');
    const usage: LlmUsage = {
      promptTokens: body.usageMetadata?.promptTokenCount,
      completionTokens: body.usageMetadata?.candidatesTokenCount,
      totalTokens: body.usageMetadata?.totalTokenCount,
    };
    return { text, usage };
  }
}
