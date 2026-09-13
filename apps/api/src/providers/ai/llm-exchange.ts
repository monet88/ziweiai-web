import { Injectable, Logger } from '@nestjs/common';
import { apiEnv } from '../../config/env';
import {
  assertNoCjk,
  buildProviderMetadata,
  type LlmChatAdapter,
  type LlmParsedResult,
} from './llm-chat-adapter';
import { ProviderTimeoutError, ProviderUnavailableError } from './provider-errors';

/**
 * REFACTOR-007 (decision 0030): nơi DUY NHẤT chạy vòng glue non-stream cho mọi AI provider.
 *
 * Trình tự: dựng timeout signal → adapter.buildRequest → fetch → adapter.parseResult →
 * guard text rỗng (emptyMessage) → assertNoCjk → buildProviderMetadata. Lỗi ngoài cùng map đồng nhất:
 * ProviderUnavailableError rethrow nguyên; TimeoutError/AbortError → ProviderTimeoutError; còn lại →
 * ProviderUnavailableError. Adapter chỉ lo phần đặc thù provider (URL/headers/body/parse).
 */
@Injectable()
export class LlmExchange {
  private readonly logger = new Logger(LlmExchange.name);
  private globalDailyCount = 0;
  private currentDayKey = '';

  private checkGlobalSpendCircuitBreaker() {
    const today = new Date().toISOString().slice(0, 10);
    if (this.currentDayKey !== today) {
      this.currentDayKey = today;
      this.globalDailyCount = 0;
    }

    if (this.globalDailyCount >= apiEnv.AI_GLOBAL_DAILY_REQUEST_LIMIT) {
      this.logger.error(
        `CRITICAL: Global daily AI request budget exceeded (${this.globalDailyCount}/${apiEnv.AI_GLOBAL_DAILY_REQUEST_LIMIT}). Circuit breaker triggered.`,
      );
      throw new ProviderUnavailableError(
        'Hệ thống AI đã đạt giới hạn an toàn toàn cục trong ngày để bảo vệ ngân sách dịch vụ. Vui lòng quay lại vào ngày mai.',
      );
    }
    this.globalDailyCount++;
  }

  async run(params: {
    adapter: LlmChatAdapter;
    prompt: string;
    emptyMessage: string;
    modelOverride?: string;
    imageInput?: { base64: string; mimeType: string };
    timeoutMsOverride?: number;
    kind?: 'explanation' | 'conversation';
  }): Promise<{ renderedMarkdown: string; providerMetadata: Record<string, string> }> {
    this.checkGlobalSpendCircuitBreaker();

    const { adapter } = params;
    if (!adapter.isAvailable()) {
      throw new ProviderUnavailableError(adapter.notConfiguredMessage);
    }

    const MAX_PROMPT_INPUT_CHARS = 16000;
    if (params.prompt && params.prompt.length > MAX_PROMPT_INPUT_CHARS) {
      throw new ProviderUnavailableError(
        `Nội dung đầu vào vượt quá giới hạn an toàn (${params.prompt.length} > ${MAX_PROMPT_INPUT_CHARS} ký tự). Vui lòng rút gọn câu hỏi.`,
      );
    }

    try {
      const model = adapter.resolveModel(params.modelOverride);
      const timeoutMs = params.timeoutMsOverride ?? apiEnv.AI_PROVIDER_TIMEOUT_MS;

      const executeFetch = async (attempt: number): Promise<LlmParsedResult> => {
        const { url, init } = adapter.buildRequest({
          prompt: params.prompt,
          imageInput: params.imageInput,
          model,
          signal: AbortSignal.timeout(timeoutMs),
        });

        try {
          const response = await fetch(url, init);
          return await adapter.parseResult(response);
        } catch (err) {
          const isTransient =
            err instanceof Error &&
            !err.message.includes('chữ Hán') &&
            !err.message.includes('nội dung không hợp lệ') &&
            err.name !== 'TimeoutError' &&
            err.name !== 'AbortError' &&
            /fetch failed|ECONNRESET|ETIMEDOUT|503|ENOTFOUND/i.test(err.message);

          if (attempt === 0 && isTransient) {
            this.logger.warn(`AI Provider [${adapter.providerName}] transient error, retrying in 400ms... (${err.message})`);
            await new Promise((r) => setTimeout(r, 400));
            return executeFetch(1);
          }
          throw err;
        }
      };

      const { text, usage } = await executeFetch(0);

      const renderedMarkdown = text.trim();
      if (!renderedMarkdown) {
        throw new ProviderUnavailableError(params.emptyMessage);
      }

      assertNoCjk(renderedMarkdown);

      return {
        renderedMarkdown,
        providerMetadata: buildProviderMetadata(adapter.providerName, model, usage, params.kind),
      };
    } catch (error) {
      if (error instanceof ProviderUnavailableError) {
        this.logger.warn(error.message);
        throw error;
      }
      this.logger.error(
        `Yêu cầu ${adapter.providerName} thất bại.`,
        error instanceof Error ? error.stack : String(error),
      );
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        throw new ProviderTimeoutError(adapter.timeoutMessage);
      }
      throw new ProviderUnavailableError(adapter.unavailableMessage);
    }
  }
}
