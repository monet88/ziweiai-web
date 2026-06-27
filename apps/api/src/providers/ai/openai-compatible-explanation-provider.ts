import { Injectable, Logger } from '@nestjs/common';
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
import { buildImageDataUrl } from './vision-prompt';

type OpenAiCompatibleResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error?: { message?: string };
};

// US-027: shape of a streamed SSE chunk from an OpenAI-compatible upstream. Only the delta content
// and the optional trailing usage block matter for us.
type OpenAiCompatibleStreamChunk = {
  choices?: Array<{ delta?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
};

// US-017e: user message OpenAI-style là string hoặc mảng content part (text + image_url).
type OpenAiStyleContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

// Chuẩn hóa base URL về dạng không có dấu `/` cuối và không có hậu tố `/v1`,
// rồi nối `/v1/chat/completions`. Tránh lặp `/v1/v1/...` khi operator cấu hình base
// đã chứa `/v1` (ví dụ proxy cũ). Không đưa `/chat/completions` vào base.
function buildChatCompletionsEndpoint(): string {
  const normalized = apiEnv.OPENAI_COMPAT_BASE_URL.replace(/\/+$/, '').replace(/\/v1$/i, '');
  return `${normalized}/v1/chat/completions`;
}

@Injectable()
export class OpenAiCompatibleExplanationProvider implements AiConversationProvider {
  private readonly logger = new Logger(OpenAiCompatibleExplanationProvider.name);
  readonly providerName = 'openai-compat';

  isAvailable(): boolean {
    return apiEnv.OPENAI_COMPAT_API_KEY.length > 0;
  }

  async generateConversation(payload: ConversationPromptPayload): Promise<ConversationProviderResult> {
    return this.generateChatCompletion({
      prompt: buildConversationPrompt(payload),
      emptyMessage: 'Nhà cung cấp OpenAI-compatible không trả về nội dung hội thoại.',
      metadataKind: 'conversation',
      modelOverride: payload.modelOverride,
    });
  }

  // US-017e: endpoint OpenAI-compatible do operator cấu hình (OPENAI_COMPAT_MODEL). Coi như đọc được
  // ảnh khi key có sẵn — không hard-code allowlist model vì model do operator chọn (gpt-4o, llava...).
  // Nếu model cấu hình không đọc ảnh, lỗi/ bỏ ảnh sẽ lộ qua failover sang gemini trong chain vision.
  isVisionCapable(): boolean {
    return this.isAvailable();
  }

  async generateExplanation(payload: ExplanationPromptPayload): Promise<ExplanationProviderResult> {
    return this.generateChatCompletion({
      prompt: payload.promptOverride ?? buildExplanationPrompt(payload),
      emptyMessage: 'Nhà cung cấp OpenAI-compatible không trả về nội dung luận giải.',
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
      throw new ProviderUnavailableError('Chưa cấu hình nhà cung cấp OpenAI-compatible.');
    }

    try {
      const model = params.modelOverride ?? apiEnv.OPENAI_COMPAT_MODEL;
      const timeoutMs = params.timeoutMsOverride ?? apiEnv.AI_PROVIDER_TIMEOUT_MS;
      const userContent: string | OpenAiStyleContentPart[] = params.imageInput
        ? [
            { type: 'text', text: params.prompt },
            { type: 'image_url', image_url: { url: buildImageDataUrl(params.imageInput.mimeType, params.imageInput.base64) } },
          ]
        : params.prompt;
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
            { role: 'user', content: userContent },
          ],
          stream: false,
          temperature: 0.7,
          max_tokens: 2048,
        }),
        signal: AbortSignal.timeout(timeoutMs),
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
      // Use the caller-supplied message so the conversation flow surfaces "không trả về nội dung hội
      // thoại" instead of the explanation text. Both callers pass `emptyMessage`.
      throw new ProviderUnavailableError(params.emptyMessage);
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

  // US-027 (decision 0026): REAL token streaming. POST with stream:true, read the upstream SSE
  // body, parse `data:` frames, and yield each delta as it arrives. The accumulated text is run
  // through the CJK guard before the final result is returned, mirroring the non-stream path.
  // Timeout (AbortSignal.timeout) and error mapping match generateChatCompletion. An optional
  // external `signal` lets the caller cancel the upstream fetch when the client disconnects.
  async *generateConversationStream(
    payload: ConversationPromptPayload,
    signal?: AbortSignal,
  ): AsyncGenerator<string, ConversationProviderResult, void> {
    if (!this.isAvailable()) {
      throw new ProviderUnavailableError('Chưa cấu hình nhà cung cấp OpenAI-compatible.');
    }

    const emptyMessage = 'Nhà cung cấp OpenAI-compatible không trả về nội dung hội thoại.';
    const model = payload.modelOverride ?? apiEnv.OPENAI_COMPAT_MODEL;
    const timeoutMs = apiEnv.AI_PROVIDER_TIMEOUT_MS;

    // Combine the per-request timeout with the optional caller signal: either firing aborts the
    // upstream fetch. AbortSignal.any is available on Node >=20; the repo targets Node >=22.
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

    try {
      const response = await fetch(buildChatCompletionsEndpoint(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiEnv.OPENAI_COMPAT_API_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: EXPLANATION_SYSTEM_PROMPT },
            { role: 'user', content: buildConversationPrompt(payload) },
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 2048,
        }),
        signal: combinedSignal,
      });

      if (!response.ok) {
        // Surface the upstream status; the body may be a non-JSON error page so we do not parse it.
        throw new ProviderUnavailableError(
          `Yêu cầu nhà cung cấp OpenAI-compatible thất bại: HTTP ${response.status} ${response.statusText}.`,
        );
      }

      if (!response.body) {
        throw new ProviderUnavailableError(emptyMessage);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';
      let usage: OpenAiCompatibleStreamChunk['usage'];
      let done = false;

      // Yield deltas as frames complete. SSE frames are separated by a blank line ("\n\n"); a single
      // JSON payload can be split across reads, so we keep a buffer and only consume complete frames.
        const deltas: string[] = [];
        try {
          while (!done) {
            let value: Uint8Array | undefined;
            let streamDone = false;
            try {
              ({ value, done: streamDone } = await reader.read());
            } catch (readError) {
              // Backlog #34 (lossless client-disconnect): if the CALLER signal aborted (client went
              // away) mid-read, stop gracefully and KEEP the text accumulated so far so the service can
              // still persist the partial reply the user already saw. The upstream fetch is cancelled
              // (token burn stops) but nothing is lost. A timeout-only abort is a genuine failure, so
              // only swallow the read error when the caller signal is the one that fired.
              if (signal?.aborted) {
                break;
              }
              throw readError;
            }
            if (streamDone) {
              break;
            }
            buffer += decoder.decode(value, { stream: true });

          let separatorIndex = buffer.indexOf('\n\n');
          while (separatorIndex !== -1) {
            const rawFrame = buffer.slice(0, separatorIndex);
            buffer = buffer.slice(separatorIndex + 2);

            const parsed = this.parseStreamFrame(rawFrame);
            if (parsed.isDone) {
              done = true;
              break;
            }
            if (parsed.usage) {
              usage = parsed.usage;
            }
            if (parsed.delta) {
              accumulated += parsed.delta;
              deltas.push(parsed.delta);
            }
            separatorIndex = buffer.indexOf('\n\n');
          }

          // Flush the collected deltas to the caller. Deltas are buffered per read so the inner frame
          // loop stays synchronous; yielding here keeps order and lets the controller emit chunks live.
          while (deltas.length > 0) {
            yield deltas.shift() as string;
          }
        }

        // Medium-2: some non-conformant proxies close the body right after the last data line without a
        // trailing "\n\n" or [DONE]. Parse whatever is left in the buffer as a final frame so the last
        // token is not dropped. Skip when the stream ended on an explicit [DONE] (done === true).
        if (!done && buffer.trim().length > 0) {
          const parsed = this.parseStreamFrame(buffer);
          buffer = '';
          if (parsed.usage) {
            usage = parsed.usage;
          }
          if (parsed.delta) {
            accumulated += parsed.delta;
            yield parsed.delta;
          }
        }
      } finally {
        // P2-2: release the upstream stream on EVERY exit path (success, CJK reject, empty, timeout,
        // and consumer-driven .return() when the client disconnects). cancel() aborts the body read so
        // the socket is freed; releaseLock() detaches the reader. Both are best-effort.
        await reader.cancel().catch(() => undefined);
        reader.releaseLock();
      }

      const renderedMarkdown = accumulated.trim();
      if (!renderedMarkdown) {
        throw new ProviderUnavailableError(emptyMessage);
      }
      // Low-1 (known + acceptable): the CJK guard runs on the FULLY accumulated text, so any Han
      // tokens were already streamed to the client as deltas before we reject here. A brief flash of
      // invalid content on the client is possible; it is client-dependent and the assistant message is
      // never persisted, so the durable record stays clean. A per-delta guard would add cost for a
      // cosmetic gain, so we keep the accumulated-text guard.
      if (containsCjkText(renderedMarkdown)) {
        this.logger.warn('Nhà cung cấp OpenAI-compatible trả về nội dung chứa chữ Hán, từ chối.');
        throw new ProviderUnavailableError('Nhà cung cấp trả về nội dung không hợp lệ (chứa chữ Hán).');
      }

      return {
        renderedMarkdown,
        providerMetadata: {
          provider: this.providerName,
          model,
          totalTokens: String(usage?.total_tokens ?? 0),
          promptTokens: String(usage?.prompt_tokens ?? 0),
          completionTokens: String(usage?.completion_tokens ?? 0),
        },
      };
    } catch (error) {
      if (error instanceof ProviderUnavailableError) {
        this.logger.warn(error.message);
        throw error;
      }
      this.logger.error(
        'Yêu cầu nhà cung cấp OpenAI-compatible (stream) thất bại.',
        error instanceof Error ? error.stack : String(error),
      );
      // Low-2: distinguish a caller-driven abort (client disconnect -> `signal` aborted) from a real
      // per-request timeout. Only the timeout maps to ProviderTimeoutError (504). A client disconnect
      // is not a provider fault, so it surfaces as a plain unavailable error and never as a 504.
      if (signal?.aborted) {
        throw new ProviderUnavailableError('Yêu cầu nhà cung cấp OpenAI-compatible bị hủy.');
      }
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        throw new ProviderTimeoutError('Nhà cung cấp OpenAI-compatible phản hồi quá thời gian chờ.');
      }
      throw new ProviderUnavailableError('Yêu cầu nhà cung cấp OpenAI-compatible thất bại.');
    }
  }

  // Parse a single SSE frame body. Each frame may contain one or more `data:` lines; we read the
  // payload after the first `data:` prefix. `[DONE]` is the OpenAI sentinel that ends the stream.
  // Non-JSON keepalive lines (comments starting ":") and blank frames return an empty delta.
  private parseStreamFrame(rawFrame: string): {
    delta: string;
    isDone: boolean;
    usage?: OpenAiCompatibleStreamChunk['usage'];
  } {
    let delta = '';
    let isDone = false;
    let usage: OpenAiCompatibleStreamChunk['usage'];

    for (const line of rawFrame.split('\n')) {
      const trimmed = line.trimStart();
      if (!trimmed.startsWith('data:')) {
        continue;
      }
      const data = trimmed.slice('data:'.length).trim();
      if (data.length === 0) {
        continue;
      }
      if (data === '[DONE]') {
        isDone = true;
        break;
      }
      try {
        const chunk = JSON.parse(data) as OpenAiCompatibleStreamChunk;
        const content = chunk.choices?.[0]?.delta?.content;
        if (typeof content === 'string') {
          delta += content;
        }
        if (chunk.usage) {
          usage = chunk.usage;
        }
      } catch {
        // Ignore non-JSON data lines (some proxies emit keepalive text); keep streaming.
      }
    }

    return { delta, isDone, usage };
  }
}
