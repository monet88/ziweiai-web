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
  createDivinationResponseSchema,
  createExplanationResponseSchema,
  healthResponseSchema,
  historyListResponseSchema,
  conversationStreamEventSchema,
  horoscopeResponseSchema,
  annualReportResponseSchema,
  dailyFortuneResponseSchema,
  monthlyFortuneResponseSchema,
  mbtiResultSchema,
  featuresResponseSchema,
  pairingSnapshotSchema,
  visionAnalysisSchema,
  tarotDrawSchema,
  type AnnualReportResponse,
  type ChartDetailResponse,
  type ConversationDetailResponse,
  type ConversationStreamEvent,
  type CreateChartRequest,
  type CreateChartResponse,
  type CreateConversationRequest,
  type CreateConversationResponse,
  type CreateConversationMessageRequest,
  type CreateDivinationRequest,
  type CreateDivinationResponse,
  type CreateExplanationRequest,
  type CreateExplanationResponse,
  type DailyFortuneResponse,
  type HealthResponse,
  type HistoryListResponse,
  type ConversationMessageRecord,
  type HoroscopeResponse,
  type HoroscopeScope,
  type MonthlyFortuneResponse,
  type MbtiAnswer,
  type MbtiResult,
  type FeaturesResponse,
  type PairingRequest,
  type PairingSnapshot,
  type VisionAnalysis,
  type VisionKind,
  type TarotDraw,
  type TarotSpread,
} from '@ziweiai/contracts';
import { fetchJson, fetchMultipart } from './fetch-json';
import { env } from '$lib/env';

export { ApiError } from './fetch-json';
export type { ApiErrorKind } from './fetch-json';

/** Số bản ghi lịch sử mặc định (port từ Expo HISTORY_SCREEN_LIMIT). */
export const HISTORY_SCREEN_LIMIT = 20;
/** Số bản ghi lịch sử hiển thị ở dashboard (port từ Expo). */
export const DASHBOARD_HISTORY_LIMIT = 8;

/** US-014: 4 tầng vận hạn mặc định fetch cho lát cắt hôm nay trên bàn Tử Vi. */
export const DEFAULT_HOROSCOPE_SCOPES: HoroscopeScope[] = ['decadal', 'yearly', 'monthly', 'daily'];
/** Vận hạn deterministic theo (chartId, asOf) → cache dài, không refetch trong phiên. */
export const HOROSCOPE_QUERY_STALE_MS = 60 * 60 * 1000;
export const HOROSCOPE_QUERY_GC_MS = 24 * 60 * 60 * 1000;

/** GET /health — public, không cần token. */
export function fetchHealth(): Promise<HealthResponse> {
  return fetchJson('/health', healthResponseSchema);
}

/** GET /features — public (US-017). Trạng thái 6 cờ hệ mở rộng để web ẩn/hiện lối vào. */
export function fetchFeatures(): Promise<FeaturesResponse> {
  return fetchJson('/features', featuresResponseSchema);
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

/** POST /divinations — Bearer. US-025: cast a time-based divination (cast=now) with a mandatory question + purpose. */
export function createDivination(
  token: string,
  request: CreateDivinationRequest,
): Promise<CreateDivinationResponse> {
  return fetchJson('/divinations', createDivinationResponseSchema, {
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

/**
 * POST /charts/:id/horoscope — Bearer (US-014).
 *
 * Tính vận hạn Tử Vi cho một mốc `asOf` (ISO `YYYY-MM-DD`). Web KHÔNG tự tính
 * (boundary 0007); engine chạy server-side. Response parse qua
 * `horoscopeResponseSchema` — sai shape → throw, không silent.
 */
export function fetchChartHoroscope(
  token: string,
  chartId: string,
  asOf: string,
  scopes: HoroscopeScope[] = DEFAULT_HOROSCOPE_SCOPES,
): Promise<HoroscopeResponse> {
  return fetchJson(`/charts/${chartId}/horoscope`, horoscopeResponseSchema, {
    method: 'POST',
    token,
    body: { asOf, scopes },
  });
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

/** US-017b: POST /quizzes/mbti — Bearer. Gửi mảng câu trả lời Likert, nhận kết quả MBTI. */
export function createMbtiQuiz(token: string, answers: MbtiAnswer[]): Promise<MbtiResult> {
  return fetchJson('/quizzes/mbti', mbtiResultSchema, {
    method: 'POST',
    token,
    body: { answers },
  });
}

/** US-017c: POST /pairings — Bearer. Ghép 2 lá số ziwei + loại quan hệ, nhận tóm tắt tương hợp. */
export function createPairing(token: string, request: PairingRequest): Promise<PairingSnapshot> {
  return fetchJson('/pairings', pairingSnapshotSchema, {
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
  // try/finally so an early abort (caller breaks out of `for await`, or navigates away) still releases
  // the reader lock and cancels the underlying stream — otherwise the connection can hang/leak.
  try {
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, '\n');

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
  } finally {
    reader.cancel().catch(() => {});
    reader.releaseLock();
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

/**
 * US-017e/f: POST /vision/{face,palm} — Bearer, multipart/form-data.
 *
 * Tải 1 ảnh (≤ 4MB) + câu hỏi tuỳ chọn lên endpoint vision. KHÔNG đi qua fetchJson (chỉ JSON);
 * dùng fetchMultipart để gửi FormData (browser tự set Content-Type + boundary). Response vẫn parse
 * qua visionAnalysisSchema — sai shape → throw, không trust raw.
 */
export function createVisionAnalysis(
  token: string,
  kind: VisionKind,
  params: { image: File; question?: string },
): Promise<VisionAnalysis> {
  const form = new FormData();
  form.append('image', params.image);
  if (params.question && params.question.trim().length > 0) {
    form.append('question', params.question.trim());
  }
  return fetchMultipart(`/vision/${kind}`, visionAnalysisSchema, form, token);
}

/**
 * US-017h: POST /draws/tarot — Bearer (anon được phép, theo backend). Gửi câu hỏi + kiểu trải bài
 * (+ seed tuỳ chọn). Rút lá là deterministic server-side theo seed; diễn giải do LLM sinh. Web hiện
 * KHÔNG gửi seed (mỗi lần rút là một quẻ mới); tham số seed để dành cho luồng cần tái lập về sau.
 * Response parse qua tarotDrawSchema — sai shape → throw, không trust raw.
 */
export function drawTarot(
  token: string,
  params: { question: string; spread: TarotSpread; seed?: string },
): Promise<TarotDraw> {
  return fetchJson('/draws/tarot', tarotDrawSchema, {
    method: 'POST',
    token,
    body: {
      question: params.question,
      spread: params.spread,
      ...(params.seed ? { seed: params.seed } : {}),
    },
  });
}

/** US-016: vận hạn deterministic theo (chartId, asOf) → cache TanStack dài. */
export const DAILY_FORTUNE_QUERY_STALE_MS = 60 * 60 * 1000;
export const MONTHLY_FORTUNE_QUERY_STALE_MS = 6 * 60 * 60 * 1000;
export const ANNUAL_REPORT_QUERY_STALE_MS = 24 * 60 * 60 * 1000;

/**
 * GET /charts/:id/daily?asOf=YYYY-MM-DD — Bearer (US-016).
 *
 * Vận ngày thuần đọc (KHÔNG LLM): cung lưu nhật + tứ hóa + đoạn văn template tiếng Việt.
 * Engine chạy server-side (boundary 0007). Response parse qua schema — sai shape → throw.
 */
export function fetchDailyFortune(
  token: string,
  chartId: string,
  asOf: string,
): Promise<DailyFortuneResponse> {
  return fetchJson(`/charts/${chartId}/daily?asOf=${asOf}`, dailyFortuneResponseSchema, { token });
}

/** GET /charts/:id/monthly?asOf=YYYY-MM — Bearer (US-016). Vận tháng thuần đọc, KHÔNG LLM. */
export function fetchMonthlyFortune(
  token: string,
  chartId: string,
  asOf: string,
): Promise<MonthlyFortuneResponse> {
  return fetchJson(`/charts/${chartId}/monthly?asOf=${asOf}`, monthlyFortuneResponseSchema, { token });
}

/**
 * POST /charts/:id/annual-report?year=YYYY — Bearer (US-016).
 *
 * Báo cáo năm có LLM + gate kép (entitlement + cờ riêng) → có thể trả 402 PAYMENT_REQUIRED;
 * caller hiển thị CTA paywall. Cache-hit trả Markdown cũ không re-gate (decision 0010).
 */
export function createAnnualReport(
  token: string,
  request: { chartId: string; year: number },
): Promise<AnnualReportResponse> {
  return fetchJson(`/charts/${request.chartId}/annual-report?year=${request.year}`, annualReportResponseSchema, {
    method: 'POST',
    token,
  });
}
