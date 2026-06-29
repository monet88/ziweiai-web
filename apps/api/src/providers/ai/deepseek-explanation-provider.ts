import { Injectable } from '@nestjs/common';
import { type ProviderPreference } from '@ziweiai/contracts';
import { apiEnv } from '../../config/env';
import {
  buildExplanationPrompt,
  EXPLANATION_SYSTEM_PROMPT,
  type AiConversationProvider,
  type ExplanationPromptPayload,
  type ConversationPromptPayload,
  type ConversationProviderResult,
  type ExplanationProviderResult,
} from './ai-explanation-provider';
import { buildConversationPrompt } from './build-conversation-prompt';
import { LlmExchange } from './llm-exchange';
import { OpenAiStyleChatAdapter } from './openai-style-chat-adapter';

/**
 * REFACTOR-007 (decision 0030): vỏ mỏng dựng OpenAiStyleChatAdapter (DeepSeek đi qua chuẩn OpenAI
 * `/v1/chat/completions` + tắt thinking) rồi giao toàn bộ vòng glue (timeout/fetch/CJK/metadata/
 * error-map) cho LlmExchange. DI giữ nguyên: shell tự dựng LlmExchange để module không phải đổi.
 */
@Injectable()
export class DeepseekExplanationProvider implements AiConversationProvider {
  private readonly exchange = new LlmExchange();

  // US-017e: DeepSeek API hiện CHƯA hỗ trợ vision (docs chính thức + probe 400 trên cả v4-pro lẫn
  // v4-flash). visionCapable=false cứng nên router luôn loại DeepSeek khỏi chain vision.
  private readonly adapter = new OpenAiStyleChatAdapter({
    providerName: 'deepseek',
    visionCapable: false,
    notConfiguredMessage: 'Chưa cấu hình DeepSeek.',
    timeoutMessage: 'DeepSeek phản hồi quá thời gian chờ.',
    unavailableMessage: 'Yêu cầu DeepSeek thất bại.',
    systemPrompt: EXPLANATION_SYSTEM_PROMPT,
    isAvailable: () => apiEnv.DEEPSEEK_API_KEY.length > 0,
    resolveModel: (modelOverride) => modelOverride ?? apiEnv.DEEPSEEK_MODEL,
    buildEndpoint: () => 'https://api.deepseek.com/v1/chat/completions',
    apiKey: () => apiEnv.DEEPSEEK_API_KEY,
    extraBody: { thinking: { type: 'disabled' } },
    buildErrorMessage: () => 'Yêu cầu DeepSeek thất bại.',
  });

  readonly providerName = this.adapter.providerName;

  isAvailable(): boolean {
    return this.adapter.isAvailable();
  }

  isVisionCapable(): boolean {
    return this.isAvailable() && this.adapter.visionCapable;
  }

  async generateConversation(payload: ConversationPromptPayload): Promise<ConversationProviderResult> {
    return this.exchange.run({
      adapter: this.adapter,
      prompt: buildConversationPrompt(payload),
      emptyMessage: 'DeepSeek không trả về nội dung hội thoại.',
      kind: 'conversation',
      modelOverride: payload.modelOverride,
    });
  }

  async generateExplanation(payload: ExplanationPromptPayload): Promise<ExplanationProviderResult> {
    return this.exchange.run({
      adapter: this.adapter,
      prompt: payload.promptOverride ?? buildExplanationPrompt(payload),
      emptyMessage: 'DeepSeek không trả về nội dung luận giải.',
      kind: 'explanation',
      modelOverride: payload.modelOverride,
      imageInput: payload.imageInput,
      timeoutMsOverride: payload.timeoutMsOverride,
    });
  }

  supportsPreference(preference: ProviderPreference): boolean {
    return preference === 'auto' || preference === 'deepseek';
  }
}
