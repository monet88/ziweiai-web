import { Injectable, Logger } from '@nestjs/common';
import { type ProviderPreference } from '@ziweiai/contracts';
import { containsCjkText } from '@ziweiai/core';
import { apiEnv } from '../../config/env';
import {
  buildExplanationPrompt,
  type AiConversationProvider,
  type ExplanationPromptPayload,
  type ConversationPromptPayload,
  type ConversationProviderResult,
  type ExplanationProviderResult,
} from './ai-explanation-provider';
import { buildConversationPrompt } from './build-conversation-prompt';
import { EXPLANATION_SYSTEM_PROMPT } from './ai-explanation-provider';
import { ProviderTimeoutError, ProviderUnavailableError } from './provider-errors';
import { buildImageDataUrl, isDeepseekModelVisionCapable } from './vision-prompt';

// US-017e: user message của OpenAI-style là string (text) HOẶC mảng content part (text + ảnh). Khi có
// imageInput, gửi mảng [{type:text}, {type:image_url, image_url:{url:<data URL>}}].
type OpenAiStyleContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

@Injectable()
export class DeepseekExplanationProvider implements AiConversationProvider {
  private readonly logger = new Logger(DeepseekExplanationProvider.name);
  readonly providerName = 'deepseek';

  isAvailable(): boolean {
    return apiEnv.DEEPSEEK_API_KEY.length > 0;
  }

  async generateConversation(payload: ConversationPromptPayload): Promise<ConversationProviderResult> {
    const result = await this.generateChatCompletion({
      prompt: buildConversationPrompt(payload),
      emptyMessage: 'DeepSeek không trả về nội dung hội thoại.',
      metadataKind: 'conversation',
      modelOverride: payload.modelOverride,
    });
    return result;
  }

  // US-017e: DeepSeek API hiện CHƯA hỗ trợ vision (docs chính thức + probe 400 trên cả v4-pro lẫn
  // v4-flash). Allowlist DEEPSEEK_VISION_CAPABLE_MODELS rỗng nên hàm này luôn trả false → router loại
  // DeepSeek khỏi chain vision. Khi DeepSeek mở vision, thêm model vào allowlist là đủ (không sửa đây).
  isVisionCapable(modelOverride?: string): boolean {
    return this.isAvailable() && isDeepseekModelVisionCapable(modelOverride ?? apiEnv.DEEPSEEK_MODEL);
  }

  async generateExplanation(payload: ExplanationPromptPayload): Promise<ExplanationProviderResult> {
    return this.generateChatCompletion({
      prompt: payload.promptOverride ?? buildExplanationPrompt(payload),
      emptyMessage: 'DeepSeek không trả về nội dung luận giải.',
      metadataKind: 'explanation',
      modelOverride: payload.modelOverride,
      imageInput: payload.imageInput,
      timeoutMsOverride: payload.timeoutMsOverride,
    });
  }

  private async generateChatCompletion(params: {
    prompt: string;
    emptyMessage: string;
    metadataKind: 'explanation' | 'conversation';
    modelOverride?: string;
    imageInput?: { base64: string; mimeType: string };
    timeoutMsOverride?: number;
  }): Promise<ExplanationProviderResult> {
    if (!this.isAvailable()) {
      throw new ProviderUnavailableError('Chưa cấu hình DeepSeek.');
    }

    try {
      const model = params.modelOverride ?? apiEnv.DEEPSEEK_MODEL;
      const timeoutMs = params.timeoutMsOverride ?? apiEnv.AI_PROVIDER_TIMEOUT_MS;
      // Khi có ảnh: dựng mảng content part (text + image_url). DeepSeek đi qua /v1/chat/completions
      // theo chuẩn OpenAI nên dùng cùng shape image_url với openai-compat.
      const userContent: string | OpenAiStyleContentPart[] = params.imageInput
        ? [
            { type: 'text', text: params.prompt },
            { type: 'image_url', image_url: { url: buildImageDataUrl(params.imageInput.mimeType, params.imageInput.base64) } },
          ]
        : params.prompt;
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
            { role: 'user', content: userContent },
          ],
          stream: false,
          temperature: 0.7,
          max_tokens: 2048,
          thinking: { type: 'disabled' },
        }),
        signal: AbortSignal.timeout(timeoutMs),
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
        throw new ProviderUnavailableError(params.emptyMessage);
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
          kind: params.metadataKind,
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
