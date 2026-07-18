import {
  type LlmChatAdapter,
  type LlmChatAdapterBuildParams,
  type LlmChatRequest,
  type LlmParsedResult,
  type LlmUsage,
} from './llm-chat-adapter';
import { ProviderUnavailableError } from './provider-errors';
import { buildImageDataUrl } from './vision-prompt';

// REFACTOR-007 (decision 0030): user message OpenAI-style là string (text) HOẶC mảng content part
// (text + ảnh). Khi có imageInput, gửi [{type:text}, {type:image_url, image_url:{url:<data URL>}}].
type OpenAiStyleContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

type OpenAiStyleResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error?: { message?: string };
};

/**
 * Cấu hình một upstream theo chuẩn OpenAI `/v1/chat/completions`. DeepSeek và OpenAI-compatible đều
 * đi qua shape này; điểm khác chỉ là endpoint/auth/model, `extraBody` (DeepSeek tắt thinking) và cách
 * dựng thông điệp lỗi khi !response.ok (DeepSeek cố định; OpenAI-compat trích lỗi upstream/HTTP).
 */
export interface OpenAiStyleAdapterConfig {
  providerName: string;
  visionCapable: boolean;
  notConfiguredMessage: string;
  timeoutMessage: string;
  unavailableMessage: string;
  systemPrompt: string;
  isAvailable: () => boolean;
  resolveModel: (modelOverride?: string) => string;
  buildEndpoint: () => string;
  apiKey: () => string;
  // Body bổ sung gắn cùng payload chat completions (vd DeepSeek: { thinking: { type: 'disabled' } }).
  extraBody?: Record<string, unknown>;
  // Dựng thông điệp lỗi khi upstream trả non-2xx. `upstreamError` là body.error?.message (đã trim) nếu có.
  buildErrorMessage: (params: { status: number; statusText: string; upstreamError: string | null }) => string;
}

export class OpenAiStyleChatAdapter implements LlmChatAdapter {
  constructor(private readonly config: OpenAiStyleAdapterConfig) {}

  get providerName(): string {
    return this.config.providerName;
  }

  get visionCapable(): boolean {
    return this.config.visionCapable;
  }

  get notConfiguredMessage(): string {
    return this.config.notConfiguredMessage;
  }

  get timeoutMessage(): string {
    return this.config.timeoutMessage;
  }

  get unavailableMessage(): string {
    return this.config.unavailableMessage;
  }

  isAvailable(): boolean {
    return this.config.isAvailable();
  }

  resolveModel(modelOverride?: string): string {
    return this.config.resolveModel(modelOverride);
  }

  buildRequest(params: LlmChatAdapterBuildParams): LlmChatRequest {
    const userContent: string | OpenAiStyleContentPart[] = params.imageInput
      ? [
          { type: 'text', text: params.prompt },
          {
            type: 'image_url',
            image_url: { url: buildImageDataUrl(params.imageInput.mimeType, params.imageInput.base64) },
          },
        ]
      : params.prompt;

    return {
      url: this.config.buildEndpoint(),
      init: {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: params.model,
          messages: [
            { role: 'system', content: this.config.systemPrompt },
            { role: 'user', content: userContent },
          ],
          stream: false,
          temperature: 0.7,
          max_tokens: 2048,
          ...(this.config.extraBody ?? {}),
        }),
        signal: params.signal,
      },
    };
  }

  async parseResult(response: Response): Promise<LlmParsedResult> {
    // Đọc raw text trước rồi mới thử parse JSON: upstream có thể trả non-JSON (vd trang lỗi HTML
    // 502/504) khiến response.json() ném SyntaxError và che mất HTTP status thật. Giữ lại status để chẩn đoán.
    let body: OpenAiStyleResponse = {};
    const rawBody = await response.text();
    if (rawBody.trim().length > 0) {
      try {
        body = JSON.parse(rawBody) as OpenAiStyleResponse;
      } catch {
        // Bỏ qua khi phản hồi không phải JSON; giữ body rỗng và dùng HTTP status bên dưới.
      }
    }

    if (!response.ok) {
      const upstreamError =
        typeof body.error?.message === 'string' && body.error.message.trim().length > 0
          ? body.error.message.trim()
          : null;
      throw new ProviderUnavailableError(
        this.config.buildErrorMessage({
          status: response.status,
          statusText: response.statusText,
          upstreamError,
        }),
      );
    }

    const usage: LlmUsage = {
      promptTokens: body.usage?.prompt_tokens,
      completionTokens: body.usage?.completion_tokens,
      totalTokens: body.usage?.total_tokens,
    };
    return { text: body.choices?.[0]?.message?.content ?? '', usage };
  }
}
