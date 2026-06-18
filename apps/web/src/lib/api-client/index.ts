/**
 * api-client hàm phẳng (port từ Expo; api-contract.md §"Hình dạng api-client").
 *
 * US-001: fetchHealth() — endpoint public, không Bearer.
 * US-002: fetchHistory() — Bearer, dùng để xác minh token gắn đúng sau đăng nhập.
 * US-005: createChart() — Bearer, POST /charts để lập lá số rồi điều hướng chi tiết.
 * US-006: fetchChartDetail() — Bearer, GET /charts/:id để mở chi tiết lá số.
 *         createExplanation() — Bearer, POST /explanations để sinh luận giải AI theo cung.
 */
import {
  chartDetailResponseSchema,
  conversationDetailResponseSchema,
  createChartResponseSchema,
  createConversationResponseSchema,
  createExplanationResponseSchema,
  healthResponseSchema,
  historyListResponseSchema,
  conversationStreamEventSchema,
  type ChartDetailResponse,
  type ConversationDetailResponse,
  type ConversationStreamEvent,
  type CreateChartRequest,
  type CreateChartResponse,
  type CreateConversationRequest,
  type CreateConversationResponse,
  type CreateConversationMessageRequest,
  type CreateExplanationRequest,
  type CreateExplanationResponse,
  type HealthResponse,
  type HistoryListResponse,
  type ConversationMessageRecord,
} from '@ziweiai/contracts';
import { fetchJson } from './fetch-json';
import { env } from '$lib/env';

export { ApiError } from './fetch-json';
export type { ApiErrorKind } from './fetch-json';

/** Số bản ghi lịch sử mặc định (port từ Expo HISTORY_SCREEN_LIMIT). */
export const HISTORY_SCREEN_LIMIT = 20;
/** Số bản ghi lịch sử hiển thị ở dashboard (port từ Expo). */
export const DASHBOARD_HISTORY_LIMIT = 8;

/** GET /health — public, không cần token. */
export function fetchHealth(): Promise<HealthResponse> {
  return fetchJson('/health', healthResponseSchema);
}

/** GET /history?limit=N — Bearer. Token đọc tươi từ auth store ngay trước khi gọi. */
export function fetchHistory(
  token: string,
  limit = HISTORY_SCREEN_LIMIT,
): Promise<HistoryListResponse> {
  return fetchJson(`/history?limit=${limit}`, historyListResponseSchema, { token });
}

/** POST /charts — Bearer. Lập lá số mới; response chứa snapshot + chartRecord (id thật). */
export function createChart(
  token: string,
  request: CreateChartRequest,
): Promise<CreateChartResponse> {
  return fetchJson('/charts', createChartResponseSchema, {
    method: 'POST',
    token,
    body: request,
  });
}

/** GET /charts/:id — Bearer. Mở chi tiết lá số đã tạo (snapshot + bản ghi + luận giải đã lưu). */
export function fetchChartDetail(
  token: string,
  chartId: string,
): Promise<ChartDetailResponse> {
  return fetchJson(`/charts/${chartId}`, chartDetailResponseSchema, { token });
}

/** POST /explanations — Bearer. Sinh luận giải AI (overview hoặc theo cung qua palaceScope). */
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

/** POST /conversations — Bearer. Tạo cuộc hội thoại mới gắn với một chart. */
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

/** GET /conversations/:id — Bearer. Lấy chi tiết cuộc hội thoại (conversation + messages). */
export function fetchConversationDetail(
  token: string,
  conversationId: string,
): Promise<ConversationDetailResponse> {
  return fetchJson(`/conversations/${conversationId}`, conversationDetailResponseSchema, { token });
}

/** POST /conversations/:id/messages — Bearer. Non-streaming append (trả full detail). */
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

/**
 * POST /conversations/:id/messages/stream — Bearer.
 * Trả về AsyncIterable<ConversationStreamEvent> đã parse bằng schema (chunk/done/error).
 * Dùng fetch + ReadableStream (không EventSource) để giữ Authorization header.
 */
export async function* streamConversationMessage(
  token: string,
  conversationId: string,
  request: CreateConversationMessageRequest,
): AsyncGenerator<ConversationStreamEvent> {
  const res = await fetch(`${env.apiBaseUrl}/conversations/${conversationId}/messages/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok || !res.body) {
    // Parse error body the same way fetchJson does (best effort)
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
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    // SSE frames are separated by double newlines; each data: line carries JSON
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      // Extract data: lines (support multi-line data by concatenation)
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
}

/** Helper: consume streaming assistant text until 'done' or 'error'. */
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
