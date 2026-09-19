import {
  conversationDetailResponseSchema,
  conversationListResponseSchema,
  createConversationResponseSchema,
  createExplanationResponseSchema,
  conversationStreamEventSchema,
  explanationStreamEventSchema,
  type ConversationDetailResponse,
  type ConversationListResponse,
  type ConversationStreamEvent,
  type ExplanationStreamEvent,
  type CreateConversationRequest,
  type CreateConversationResponse,
  type CreateConversationMessageRequest,
  type CreateExplanationRequest,
  type CreateExplanationResponse,
  type ConversationMessageRecord,
} from '@ziweiai/contracts';
import { fetchJson, buildUrl } from './fetch-json';
import { env } from '$lib/env';

export interface StreamRetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
}

function sleepWithSignal(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export function createExplanation(
  token: string,
  request: CreateExplanationRequest,
): Promise<CreateExplanationResponse> {
  return fetchJson('/explanations', createExplanationResponseSchema, {
    method: 'POST',
    token,
    body: request,
  });
}

export async function* streamExplanation(
  token: string,
  request: CreateExplanationRequest,
  signal?: AbortSignal,
  retryOptions?: StreamRetryOptions,
): AsyncGenerator<ExplanationStreamEvent> {
  const maxRetries = retryOptions?.maxRetries ?? 3;
  const initialDelayMs = retryOptions?.initialDelayMs ?? 1000;
  const backoffFactor = retryOptions?.backoffFactor ?? 2;

  let res: Response | null = null;
  let attempt = 0;

  while (attempt <= maxRetries) {
    if (signal?.aborted) return;
    try {
      res = await fetch(buildUrl(env.apiBaseUrl, '/explanations/stream'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
        signal,
      });

      // Retry on server errors (502, 503, 504) or connection drops before streaming
      if (!res.ok && [502, 503, 504].includes(res.status) && attempt < maxRetries) {
        attempt += 1;
        const delay = initialDelayMs * Math.pow(backoffFactor, attempt - 1) + Math.random() * 200;
        await sleepWithSignal(delay, signal);
        continue;
      }
      break;
    } catch (err) {
      if (signal?.aborted || (err instanceof Error && err.name === 'AbortError')) {
        return;
      }
      if (attempt < maxRetries) {
        attempt += 1;
        const delay = initialDelayMs * Math.pow(backoffFactor, attempt - 1) + Math.random() * 200;
        await sleepWithSignal(delay, signal);
        continue;
      }
      throw err;
    }
  }

  if (!res || !res.ok || !res.body) {
    let message = `Yêu cầu thất bại (${res?.status ?? 'unknown'}).`;
    if (res) {
      try {
        const err: unknown = await res.json();
        if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
          message = (err as { message: string }).message;
        }
      } catch {
        // ignore
      }
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  try {
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, '\n');

      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        const dataLines = frame
          .split('\n')
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.replace(/^data:\s?/, ''));

        if (dataLines.length === 0) continue;

        const payload = dataLines.join('\n');
        let raw: unknown;
        try {
          raw = JSON.parse(payload);
        } catch {
          continue;
        }

        const parsed = explanationStreamEventSchema.safeParse(raw);
        if (!parsed.success) {
          if (import.meta.env.DEV) {
            console.error('[api] explanation stream event parse error:', parsed.error.issues);
          }
          continue;
        }
        yield parsed.data;
      }
    }
  } catch (err) {
    if (signal?.aborted || (err instanceof Error && err.name === 'AbortError')) {
      return;
    }
    throw err;
  } finally {
    reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export function createConversation(
  token: string,
  request: CreateConversationRequest,
): Promise<CreateConversationResponse> {
  return fetchJson('/conversations', createConversationResponseSchema, {
    method: 'POST',
    token,
    body: request,
  });
}

export function fetchConversationsForChart(
  token: string,
  chartSnapshotId: string,
): Promise<ConversationListResponse> {
  return fetchJson(
    `/conversations?chartSnapshotId=${encodeURIComponent(chartSnapshotId)}`,
    conversationListResponseSchema,
    { token },
  );
}

export function fetchConversationDetail(
  token: string,
  conversationId: string,
): Promise<ConversationDetailResponse> {
  return fetchJson(`/conversations/${conversationId}`, conversationDetailResponseSchema, { token });
}

export function appendConversationMessage(
  token: string,
  conversationId: string,
  request: CreateConversationMessageRequest,
): Promise<ConversationDetailResponse> {
  return fetchJson(`/conversations/${conversationId}/messages`, conversationDetailResponseSchema, {
    method: 'POST',
    token,
    body: request,
  });
}

export async function* streamConversationMessage(
  token: string,
  conversationId: string,
  request: CreateConversationMessageRequest,
  signal?: AbortSignal,
  retryOptions?: StreamRetryOptions,
): AsyncGenerator<ConversationStreamEvent> {
  const maxRetries = retryOptions?.maxRetries ?? 3;
  const initialDelayMs = retryOptions?.initialDelayMs ?? 1000;
  const backoffFactor = retryOptions?.backoffFactor ?? 2;

  let res: Response | null = null;
  let attempt = 0;

  while (attempt <= maxRetries) {
    if (signal?.aborted) return;
    try {
      res = await fetch(buildUrl(env.apiBaseUrl, `/conversations/${conversationId}/messages/stream`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
        signal,
      });

      // Retry on server errors (502, 503, 504) or connection drops before streaming
      if (!res.ok && [502, 503, 504].includes(res.status) && attempt < maxRetries) {
        attempt += 1;
        const delay = initialDelayMs * Math.pow(backoffFactor, attempt - 1) + Math.random() * 200;
        await sleepWithSignal(delay, signal);
        continue;
      }
      break;
    } catch (err) {
      if (signal?.aborted || (err instanceof Error && err.name === 'AbortError')) {
        return;
      }
      if (attempt < maxRetries) {
        attempt += 1;
        const delay = initialDelayMs * Math.pow(backoffFactor, attempt - 1) + Math.random() * 200;
        await sleepWithSignal(delay, signal);
        continue;
      }
      throw err;
    }
  }

  if (!res || !res.ok || !res.body) {
    let message = `Yêu cầu thất bại (${res?.status ?? 'unknown'}).`;
    if (res) {
      try {
        const err: unknown = await res.json();
        if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
          message = (err as { message: string }).message;
        }
      } catch {
        // ignore
      }
    }
    throw new Error(message);
  }

  let accumulatedText = '';
  let receivedDone = false;
  const reader = res.body.getReader();
  try {
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, '\n');

      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        const dataLines = frame
          .split('\n')
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.replace(/^data:\s?/, ''));

        if (dataLines.length === 0) continue;

        const payload = dataLines.join('\n');
        let raw: unknown;
        try {
          raw = JSON.parse(payload);
        } catch {
          continue;
        }

        const parsed = conversationStreamEventSchema.safeParse(raw);
        if (!parsed.success) {
          if (import.meta.env.DEV) {
            console.error('[api] stream event parse error:', parsed.error.issues);
          }
          continue;
        }

        if (parsed.data.type === 'chunk') {
          accumulatedText += parsed.data.delta;
        } else if (parsed.data.type === 'done') {
          receivedDone = true;
        }

        yield parsed.data;
      }
    }
  } catch (err) {
    if (signal?.aborted || (err instanceof Error && err.name === 'AbortError')) {
      return;
    }

    // Nếu stream bị ngắt kết nối giữa chừng mà chưa nhận done: thử phục hồi tin nhắn từ backend
    if (!receivedDone && accumulatedText.length > 0) {
      try {
        await sleepWithSignal(800, signal);
        const detail = await fetchConversationDetail(token, conversationId);
        const lastMsg = detail.messages[detail.messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          if (lastMsg.content.length > accumulatedText.length) {
            const missingDelta = lastMsg.content.slice(accumulatedText.length);
            yield { type: 'chunk', delta: missingDelta };
          }
          yield { type: 'done', message: lastMsg };
          return;
        }
      } catch {
        // Tiếp tục xuống dưới để throw lỗi hoặc để caller xử lý graceful
      }
    }

    throw err;
  } finally {
    reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function collectAssistantStream(
  token: string,
  conversationId: string,
  request: CreateConversationMessageRequest,
): Promise<{ text: string; finalMessage?: ConversationMessageRecord }> {
  let text = '';
  let final: ConversationMessageRecord | undefined;
  for await (const evt of streamConversationMessage(token, conversationId, request)) {
    if (evt.type === 'chunk') {
      text += evt.delta;
    } else if (evt.type === 'done') {
      final = evt.message;
    } else if (evt.type === 'error') {
      throw new Error(evt.error.message);
    }
  }
  return { text, finalMessage: final };
}
