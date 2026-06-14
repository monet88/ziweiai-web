/**
 * api-client hàm phẳng (port từ Expo; api-contract.md §"Hình dạng api-client").
 *
 * US-001: fetchHealth() — endpoint public, không Bearer.
 * US-002: fetchHistory() — Bearer, dùng để xác minh token gắn đúng sau đăng nhập.
 * Các hàm Bearer còn lại (createChart/fetchChartDetail/createExplanation)
 * thêm ở phase sau.
 */
import {
  healthResponseSchema,
  historyListResponseSchema,
  type HealthResponse,
  type HistoryListResponse,
} from '@ziweiai/contracts';
import { fetchJson } from './fetch-json';

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
