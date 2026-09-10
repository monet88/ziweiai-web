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
): AsyncGenerator<ExplanationStreamEvent> {
  const res = await fetch(buildUrl(env.apiBaseUrl, '/explanations/stream'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok || !res.body) {
    let message = `Yêu cầu thất bại (${res.status}).`;
    try {
      const err: unknown = await res.json();
      if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
        message = (err as { message: string }).message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  try {
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
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
): AsyncGenerator<ConversationStreamEvent> {
  const res = await fetch(buildUrl(env.apiBaseUrl, `/conversations/${conversationId}/messages/stream`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok || !res.body) {
    let message = `Yêu cầu thất bại (${res.status}).`;
    try {
      const err: unknown = await res.json();
      if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
        message = (err as { message: string }).message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  try {
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
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
        yield parsed.data;
      }
    }
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
