import {
  historyListResponseSchema,
  type HistoryListResponse,
} from '@ziweiai/contracts';
import { fetchJson } from './fetch-json';

export const HISTORY_SCREEN_LIMIT = 20;
export const DASHBOARD_HISTORY_LIMIT = 8;

export function fetchHistory(
  token: string,
  limit = HISTORY_SCREEN_LIMIT,
): Promise<HistoryListResponse> {
  return fetchJson(`/history?limit=${limit}`, historyListResponseSchema, { token });
}
