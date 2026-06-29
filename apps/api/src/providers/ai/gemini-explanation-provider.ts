import { Injectable } from '@nestjs/common';
import { type ProviderPreference } from '@ziweiai/contracts';
import {
  buildExplanationPrompt,
  type AiConversationProvider,
  type ConversationPromptPayload,
  type ConversationProviderResult,
  type ExplanationPromptPayload,
  type ExplanationProviderResult,
} from './ai-explanation-provider';
import { buildConversationPrompt } from './build-conversation-prompt';
import { GeminiChatAdapter } from './gemini-chat-adapter';
import { LlmExchange } from './llm-exchange';

/**
 * REFACTOR-007 (decision 0030): vỏ mỏng cho Gemini. Toàn bộ glue (timeout/fetch/parse/CJK/metadata/
 * map lỗi) sống trong LlmExchange; shape request + parse đặc thù Gemini sống trong GeminiChatAdapter.
 * Giữ nguyên tên lớp + DI + chữ ký public để router/module không đổi.
 */
@Injectable()
export class GeminiExplanationProvider implements AiConversationProvider {
  private readonly adapter = new GeminiChatAdapter();
  private readonly exchange = new LlmExchange();

  readonly providerName = this.adapter.providerName;

  isAvailable(): boolean {
    return this.adapter.isAvailable();
  }

  // US-017e: model Gemini (gemini-3.5-flash mặc định) hỗ trợ đa thể thức (đọc ảnh). Coi như đọc được
  // ảnh khi key có sẵn.
  isVisionCapable(): boolean {
    return this.adapter.isAvailable() && this.adapter.visionCapable;
  }

  async generateConversation(payload: ConversationPromptPayload): Promise<ConversationProviderResult> {
    return this.exchange.run({
      adapter: this.adapter,
      prompt: buildConversationPrompt(payload),
      emptyMessage: 'Gemini không trả về nội dung hội thoại.',
      modelOverride: payload.modelOverride,
      kind: 'conversation',
    });
  }

  async generateExplanation(payload: ExplanationPromptPayload): Promise<ExplanationProviderResult> {
    return this.exchange.run({
      adapter: this.adapter,
      prompt: payload.promptOverride ?? buildExplanationPrompt(payload),
      emptyMessage: 'Gemini không trả về nội dung luận giải.',
      modelOverride: payload.modelOverride,
      imageInput: payload.imageInput,
      timeoutMsOverride: payload.timeoutMsOverride,
      kind: 'explanation',
    });
  }

  supportsPreference(preference: ProviderPreference): boolean {
    return preference === 'auto' || preference === 'gemini';
  }
}
