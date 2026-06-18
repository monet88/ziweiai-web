/**
 * Factory TanStack Query cho 1 mốc vận hạn (US-015) — wrap `fetchChartHoroscope` (US-014).
 *
 * Mỗi tầng (lưu niên / lưu nguyệt / lưu nhật) tạo 1 instance riêng với `getAsOf()` derive từ
 * `selection`. Đại vận KHÔNG cần query (dữ liệu nằm sẵn trong `snapshot.palaces`).
 *
 * Hai bài học từ review US-014 (bắt buộc giữ):
 * 1. Access token VÀO queryKey → cache tách theo phiên (đổi user / đăng xuất không tái dùng
 *    frame cũ). Token vẫn đọc TƯƠI trong queryFn (bất biến §3), KHÔNG snapshot lúc mount.
 * 2. `asOf` dựng bằng local timezone (`getFullYear/getMonth/getDate`), KHÔNG `toISOString` —
 *    UTC lệch 1 ngày cho GMT+7 lúc 00:00–07:00 → sai lưu nhật.
 *
 * Vận hạn deterministic theo (chartId, asOf) ⇒ `staleTime: Infinity`: lướt qua-lại chip cũ
 * không refetch. Phần dựng `queryKey/enabled` tách ra `buildHoroscopeQueryOptions` (thuần,
 * test được mà KHÔNG cần QueryClient context).
 */
import { createQuery } from '@tanstack/svelte-query';
import type { HoroscopeResponse, HoroscopeScope } from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { fetchChartHoroscope } from '$lib/api-client';
import { viCopy } from '$lib/i18n/vi';

/** Dựng `asOf` ISO `YYYY-MM-DD` từ thành phần năm/tháng/ngày dương (local, KHÔNG toISOString). */
export function formatAsOf(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export interface HoroscopeQueryParams {
  token: string | null;
  chartId: string;
  /** Mốc ISO `YYYY-MM-DD`; null = tầng chưa chọn → query tắt. */
  asOf: string | null;
  scopes: HoroscopeScope[];
  isAuthenticated: boolean;
}

export interface HoroscopeQueryOptions {
  queryKey: (string | null)[];
  enabled: boolean;
}

/**
 * Dựng `queryKey` + `enabled` thuần (test được không cần QueryClient). queryKey gắn token
 * (cache tách theo phiên) + asOf + scopes; `enabled` chỉ bật khi đủ token + chartId + asOf.
 */
export function buildHoroscopeQueryOptions(params: HoroscopeQueryParams): HoroscopeQueryOptions {
  return {
    queryKey: ['horoscope', params.token, params.chartId, params.asOf, params.scopes.join(',')],
    enabled:
      params.isAuthenticated &&
      !!params.token &&
      params.chartId.length > 0 &&
      params.asOf !== null,
  };
}

export interface CreateHoroscopeQueryOptions {
  auth: AuthStore;
  getChartId: () => string;
  /** Mốc ISO reactive; null = chưa chọn tầng này → query tắt. */
  getAsOf: () => string | null;
  /** Scope đơn cho tầng này (`['yearly']` / `['monthly']` / `['daily']`). */
  scopes: HoroscopeScope[];
}

export function createHoroscopeQuery(options: CreateHoroscopeQueryOptions) {
  return createQuery<HoroscopeResponse>(() => {
    const queryOptions = buildHoroscopeQueryOptions({
      token: options.auth.getAccessToken(),
      chartId: options.getChartId(),
      asOf: options.getAsOf(),
      scopes: options.scopes,
      isAuthenticated: options.auth.isAuthenticated,
    });
    return {
      queryKey: queryOptions.queryKey,
      queryFn: (): Promise<HoroscopeResponse> => {
        const token = options.auth.getAccessToken();
        const asOf = options.getAsOf();
        if (!token || !asOf) {
          throw new Error(viCopy.errors.missingChartContext);
        }
        return fetchChartHoroscope(token, options.getChartId(), asOf, options.scopes);
      },
      enabled: queryOptions.enabled,
      staleTime: Infinity,
      gcTime: 5 * 60 * 1000,
    };
  });
}

export type HoroscopeQuery = ReturnType<typeof createHoroscopeQuery>;
