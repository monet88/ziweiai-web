/**
 * Model trang chi tiết lá số (factory Svelte 5 runes) — US-006.
 *
 * Nguyên tắc reactive (Design Notes US-006 + invariants §3):
 * - createQuery fetchChartDetail: token đọc TƯƠI trong queryFn (không snapshot lúc mount);
 *   queryKey gắn token để cache tách theo user.
 * - selectedPalaceKey là $state THUẦN; chọn cung ghi trực tiếp, KHÔNG $effect ghi ngược.
 * - Reset state khi chartId đổi: route bọc model trong {#key chartId} → đổi chartId hủy
 *   model cũ + tạo model mới (selectedPalaceKey về null), KHÔNG đồng bộ ngược bằng $effect.
 *
 * Selection tách thành factory pure `createPalaceSelection` (runes thuần, test được mà
 * không cần QueryClient context); model lớn ghép selection + createQuery.
 */
import { createQuery } from '@tanstack/svelte-query';
import type { ChartDetailResponse } from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { fetchChartDetail } from '$lib/api-client';
import { viCopy } from '$lib/i18n/vi';
import { buildPalaceViews, type PalaceView } from './palace-view-builder';

/**
 * Factory chọn cung (runes thuần). Mỗi instance độc lập: tạo instance mới (như khi route
 * remount qua {#key chartId}) bắt đầu với selectedPalaceKey = null → đảm bảo đổi lá số
 * không giữ cung của lá số cũ. Chọn lại đúng cung đang chọn sẽ bỏ chọn (toggle).
 */
export function createPalaceSelection() {
  let selectedPalaceKey = $state<string | null>(null);

  function select(nameKey: string): void {
    selectedPalaceKey = selectedPalaceKey === nameKey ? null : nameKey;
  }

  function clear(): void {
    selectedPalaceKey = null;
  }

  return {
    get selectedPalaceKey(): string | null {
      return selectedPalaceKey;
    },
    select,
    clear,
  };
}

export type PalaceSelection = ReturnType<typeof createPalaceSelection>;

export interface ChartDetailModelOptions {
  auth: AuthStore;
  /** Getter chartId (route param) — đọc reactive trong queryKey/queryFn, giữ phản xạ Svelte 5. */
  getChartId: () => string;
}

export function createChartDetailModel(options: ChartDetailModelOptions) {
  const auth = options.auth;

  const query = createQuery(() => ({
    queryKey: ['chart-detail', auth.getAccessToken(), options.getChartId()],
    queryFn: (): Promise<ChartDetailResponse> => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new Error(viCopy.errors.missingChartContext);
      }
      return fetchChartDetail(token, options.getChartId());
    },
    // Chờ có token thật: isAuthenticated có thể true trong khoảnh khắc token chưa nạp/đang
    // refresh — bật query lúc đó khiến queryFn ném lỗi và hiện banner thừa cho người dùng.
    enabled: auth.isAuthenticated && !!auth.getAccessToken() && options.getChartId().length > 0,
  }));

  const selection = createPalaceSelection();

  // Snapshot + palaces dẫn xuất hoàn toàn từ query — không lưu trùng state.
  const snapshot = $derived(query.data?.snapshot ?? null);
  const chartSystem = $derived(query.data?.chartRecord.chartSystem ?? null);
  const palaces = $derived<PalaceView[]>(query.data ? buildPalaceViews(query.data.snapshot) : []);
  const selectedPalace = $derived<PalaceView | null>(
    palaces.find((palace) => palace.nameKey === selection.selectedPalaceKey) ?? null,
  );

  return {
    get chartId(): string {
      return options.getChartId();
    },
    get isPending(): boolean {
      return query.isPending;
    },
    get isError(): boolean {
      return query.isError;
    },
    get snapshot(): ChartDetailResponse['snapshot'] | null {
      return snapshot;
    },
    get chartSystem() {
      return chartSystem;
    },
    get palaces(): PalaceView[] {
      return palaces;
    },
    get selectedPalaceKey(): string | null {
      return selection.selectedPalaceKey;
    },
    get selectedPalace(): PalaceView | null {
      return selectedPalace;
    },
    selectPalace: selection.select,
    clearSelection: selection.clear,
  };
}

export type ChartDetailModel = ReturnType<typeof createChartDetailModel>;
