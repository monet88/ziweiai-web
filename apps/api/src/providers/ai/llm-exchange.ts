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
  private static globalDailyCount = 0;
  private static currentDayKey = '';

  private static async trackAndAssertSpend(logger: Logger) {
    const today = new Date().toISOString().slice(0, 10);
    const limit = apiEnv.AI_GLOBAL_DAILY_REQUEST_LIMIT;

    // 1. Kiểm tra qua Upstash REST nếu có cấu hình (chia sẻ toàn cục qua mọi Vercel instance/lambda)
    if (apiEnv.QUOTA_UPSTASH_REST_URL && apiEnv.QUOTA_UPSTASH_REST_TOKEN) {
      try {
        const restUrl = apiEnv.QUOTA_UPSTASH_REST_URL.replace(/\/+$/, '');
        const key = `ai:global:daily:${today}`;
        const res = await fetch(`${restUrl}/pipeline`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${apiEnv.QUOTA_UPSTASH_REST_TOKEN}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify([
            ['INCR', key],
            ['EXPIRE', key, '86400', 'NX'],
          ]),
          signal: AbortSignal.timeout(3000),
        });

        if (res.ok) {
          const payload = (await res.json()) as Array<{ result?: number }>;
          const count = Number(payload?.[0]?.result);
          if (Number.isFinite(count) && count > limit) {
            logger.error(
              `CRITICAL: Upstash Global AI daily budget reached (${count}/${limit}). Circuit breaker tripped.`,
            );
            throw new ProviderUnavailableError(
              'Hệ thống AI đã đạt giới hạn an toàn toàn cục trong ngày để bảo vệ ngân sách dịch vụ. Vui lòng quay lại vào ngày mai.',
            );
          }
          return;
        }
      } catch (err) {
        if (err instanceof ProviderUnavailableError) throw err;
        logger.warn(`Upstash global counter check failed, fallback to process static counter: ${err}`);
      }
    }

    // 2. Static process-level counter (chia sẻ giữa 100% provider instances trong runtime)
    if (LlmExchange.currentDayKey !== today) {
      LlmExchange.currentDayKey = today;
      LlmExchange.globalDailyCount = 0;
    }

    if (LlmExchange.globalDailyCount >= limit) {
      logger.error(
        `CRITICAL: Process Global daily AI request budget exceeded (${LlmExchange.globalDailyCount}/${limit}). Circuit breaker triggered.`,
      );
      throw new ProviderUnavailableError(
        'Hệ thống AI đã đạt giới hạn an toàn toàn cục trong ngày để bảo vệ ngân sách dịch vụ. Vui lòng quay lại vào ngày mai.',
      );
    }
    LlmExchange.globalDailyCount++;
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
        // Đếm chính xác mọi lượt request thực tế tới LLM (bao gồm cả attempt 0 và retry)
        await LlmExchange.trackAndAssertSpend(this.logger);

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
