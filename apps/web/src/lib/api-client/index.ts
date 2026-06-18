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
  createChartResponseSchema,
  createExplanationResponseSchema,
  healthResponseSchema,
  historyListResponseSchema,
  horoscopeResponseSchema,
  type ChartDetailResponse,
  type CreateChartRequest,
  type CreateChartResponse,
  type CreateExplanationRequest,
  type CreateExplanationResponse,
  type HealthResponse,
  type HistoryListResponse,
  type HoroscopeResponse,
  type HoroscopeScope,
} from '@ziweiai/contracts';
import { fetchJson } from './fetch-json';

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
