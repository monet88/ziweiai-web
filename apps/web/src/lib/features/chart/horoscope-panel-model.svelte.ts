/**
 * Model panel vận hạn (factory Svelte 5 runes) — US-015.
 *
 * Ghép `createHoroscopeSelection` (state 4 tầng) + 3 `createHoroscopeQuery` (lưu niên / lưu
 * nguyệt / lưu nhật) + helper build chip + overlay. Parent (`ChartDetailScreen`) sở hữu model,
 * đọc `overlay` getter truyền vào `<PalaceGrid>`, và truyền cả model vào `<ZiweiHoroscopePanel>`
 * để render. Cả hai cùng đọc một model reactive → propagation thuần `$derived`, KHÔNG `$effect`
 * ghi ngược (đúng pattern `createChartDetailModel` US-006 + bất biến §3).
 *
 * Đại vận KHÔNG query (dữ liệu nằm sẵn trong `snapshot.palaces`). Mỗi tầng dưới 1 query đơn
 * scope với `getAsOf` derive từ selection; `enabled: false` cho tới khi tầng đó được chọn →
 * không tốn round-trip thừa (decision 0011, lazy chip).
 */
import type { ChartDetailResponse } from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import type { PalaceView } from './palace-view-builder';
import { createHoroscopeSelection } from './horoscope-selection.svelte';
import { createHoroscopeQuery, formatAsOf } from './horoscope-query';
import {
  buildDecadalChips,
  buildYearlyChips,
  buildMonthlyChips,
  buildDailyChips,
  computeDefaultDecadalIndex,
  type HoroscopeChip,
} from './horoscope-chips';
import { buildHoroscopeOverlay, type HoroscopeOverlay } from './horoscope-overlay';

/** Tháng dùng cho mốc lưu niên (giữa năm, khớp taibu `new Date(year, 5, 15)` → tháng 6). */
const YEARLY_PROBE_MONTH = 6;
/** Ngày dùng cho mốc lưu niên / lưu nguyệt (giữa tháng, khớp taibu day=15). */
const PROBE_DAY = 15;

export interface HoroscopePanelModelOptions {
  auth: AuthStore;
  getChartId: () => string;
  /** Snapshot bản mệnh (để lấy birthYear). null khi chưa tải. */
  getSnapshot: () => ChartDetailResponse['snapshot'] | null;
  /** 12 cung bản mệnh (để build chip đại vận + tính default). */
  getPalaces: () => PalaceView[];
}

export function createHoroscopePanelModel(options: HoroscopePanelModelOptions) {
  const auth = options.auth;

  // birthYear từ snapshot bản mệnh (dương lịch chuẩn hoá). null khi snapshot chưa tải.
  const birthYear = $derived<number | null>(
    options.getSnapshot()?.birth.resolvedDateTime.date.year ?? null,
  );

  // Đại vận mặc định = đại vận chứa năm hiện tại. Đọc reactive (palaces tới muộn) → selection
  // tự áp qua ensureDefault() khi snapshot sẵn sàng. new Date() ở getter: chỉ đọc lúc ensureDefault
  // chạy (1 lần), không gây vòng lặp reactive.
  const selection = createHoroscopeSelection({
    defaultDecadalIndex: () => {
      const year = birthYear;
      if (year === null) {
        return null;
      }
      return computeDefaultDecadalIndex(options.getPalaces(), year, new Date());
    },
  });

  // Palace đại vận đang chọn (để lấy decadalRange cho chip lưu niên).
  const selectedDecadalPalace = $derived<PalaceView | null>(
    selection.value.decadalIndex !== undefined
      ? (options.getPalaces().find((p) => p.index === selection.value.decadalIndex) ?? null)
      : null,
  );

  // --- 3 query, asOf derive từ selection ---
  const yearlyQuery = createHoroscopeQuery({
    auth,
    getChartId: options.getChartId,
    getAsOf: () =>
      selection.value.yearlyYear !== undefined
        ? formatAsOf(selection.value.yearlyYear, YEARLY_PROBE_MONTH, PROBE_DAY)
        : null,
    scopes: ['yearly'],
  });

  const monthlyQuery = createHoroscopeQuery({
    auth,
    getChartId: options.getChartId,
    getAsOf: () =>
      selection.value.yearlyYear !== undefined && selection.value.monthlyMonth !== undefined
        ? formatAsOf(selection.value.yearlyYear, selection.value.monthlyMonth, PROBE_DAY)
        : null,
    scopes: ['monthly'],
  });

  const dailyQuery = createHoroscopeQuery({
    auth,
    getChartId: options.getChartId,
    getAsOf: () =>
      selection.value.yearlyYear !== undefined &&
      selection.value.monthlyMonth !== undefined &&
      selection.value.dailyDay !== undefined
        ? formatAsOf(selection.value.yearlyYear, selection.value.monthlyMonth, selection.value.dailyDay)
        : null,
    scopes: ['daily'],
  });

  // Frame mỗi tầng (null khi chưa chọn / đang tải / lỗi). Đọc .data trực tiếp (svelte-query v6
  // runes — KHÔNG dùng $). queryFn trả HoroscopeResponse, lấy .frame.
  const yearlyFrame = $derived(yearlyQuery.data?.frame ?? null);
  const monthlyFrame = $derived(monthlyQuery.data?.frame ?? null);
  const dailyFrame = $derived(dailyQuery.data?.frame ?? null);

  // --- Chip 4 tầng ---
  const decadalChips = $derived<HoroscopeChip[]>(
    buildDecadalChips(options.getPalaces(), selection.value),
  );
  const yearlyChips = $derived<HoroscopeChip[]>(
    birthYear !== null && selectedDecadalPalace
      ? buildYearlyChips({
          decadalRange: selectedDecadalPalace.decadalRange,
          birthYear,
          selection: selection.value,
        })
      : [],
  );
  const monthlyChips = $derived<HoroscopeChip[]>(
    selection.value.yearlyYear !== undefined
      ? buildMonthlyChips({ selection: selection.value, monthlyFrame })
      : [],
  );
  const dailyChips = $derived<HoroscopeChip[]>(
    selection.value.yearlyYear !== undefined && selection.value.monthlyMonth !== undefined
      ? buildDailyChips({
          year: selection.value.yearlyYear,
          month: selection.value.monthlyMonth,
          selection: selection.value,
          dailyFrame,
        })
      : [],
  );

  // --- Overlay cho PalaceGrid ---
  const overlay = $derived<HoroscopeOverlay>(
    buildHoroscopeOverlay({ selection: selection.value, yearlyFrame, monthlyFrame, dailyFrame }),
  );

  // Trạng thái tải/lỗi gộp cho UI banner (chỉ tầng đang chọn mới enabled nên hiếm khi đồng thời).
  const isFetching = $derived(yearlyQuery.isFetching || monthlyQuery.isFetching || dailyQuery.isFetching);
  const isError = $derived(yearlyQuery.isError || monthlyQuery.isError || dailyQuery.isError);

  return {
    /** Áp đại vận mặc định 1 lần khi snapshot sẵn sàng — gọi trong $effect.pre của component. */
    ensureDefault: selection.ensureDefault,
    get decadalChips(): HoroscopeChip[] {
      return decadalChips;
    },
    get yearlyChips(): HoroscopeChip[] {
      return yearlyChips;
    },
    get monthlyChips(): HoroscopeChip[] {
      return monthlyChips;
    },
    get dailyChips(): HoroscopeChip[] {
      return dailyChips;
    },
    get overlay(): HoroscopeOverlay {
      return overlay;
    },
    get hasDecadalData(): boolean {
      return decadalChips.length > 0;
    },
    get yearlySelected(): boolean {
      return selection.value.yearlyYear !== undefined;
    },
    get monthlySelected(): boolean {
      return selection.value.monthlyMonth !== undefined;
    },
    get isFetching(): boolean {
      return isFetching;
    },
    get isError(): boolean {
      return isError;
    },
    selectDecadal: (index: number) => selection.selectDecadal(index),
    selectYearlyByYear: (year: number) => selection.selectYearly(year),
    selectMonthly: (month: number) => selection.selectMonthly(month),
    selectDaily: (day: number) => selection.selectDaily(day),
  };
}

export type HoroscopePanelModel = ReturnType<typeof createHoroscopePanelModel>;
