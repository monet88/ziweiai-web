/**
 * Map `selection` + frame của 3 tầng query → `HoroscopeOverlay` (4 palace index) — US-015.
 *
 * Helper thuần, KHÔNG fetch. Tách biệt hoàn toàn với `inAspect` của US-011 (hai overlay sống
 * chung trên bàn). Cung Mệnh vận mỗi tầng:
 * - Đại vận: `selection.decadalIndex` CHÍNH LÀ palace index (index cung Mệnh đại vận trên bàn
 *   bản mệnh — đã chọn trực tiếp từ chip dựng từ `snapshot.palaces`, KHÔNG cần frame).
 * - Lưu niên / lưu nguyệt / lưu nhật: lấy `frame.<tier>.index` từ frame đã fetch cho mốc đó.
 *   Frame chưa về (đang tải / lỗi) ⇒ index null ở tầng đó (overlay tầng đó tắt, các tầng khác
 *   vẫn hiện — degrade gọn, không chặn cả bàn).
 *
 * Bất biến cascade: nếu tầng trên chưa chọn thì tầng dưới cũng null (selection đã giữ bất biến
 * này ở reducer; ở đây chỉ đọc, không tự suy diễn thêm).
 */
import type { HoroscopeFrame } from '@ziweiai/contracts';
import type { HoroscopeSelection } from './horoscope-selection.svelte';

export interface HoroscopeOverlay {
  /** Index cung Mệnh đại vận (0..11) hoặc null (chưa chọn). */
  decadalPalaceIndex: number | null;
  /** Index cung Mệnh lưu niên hoặc null. */
  yearlyPalaceIndex: number | null;
  /** Index cung Mệnh lưu nguyệt hoặc null. */
  monthlyPalaceIndex: number | null;
  /** Index cung Mệnh lưu nhật hoặc null. */
  dailyPalaceIndex: number | null;
}

/** Overlay rỗng (không tầng nào chọn) — bàn về trạng thái US-011 thuần. */
export const EMPTY_HOROSCOPE_OVERLAY: HoroscopeOverlay = {
  decadalPalaceIndex: null,
  yearlyPalaceIndex: null,
  monthlyPalaceIndex: null,
  dailyPalaceIndex: null,
};

export interface HoroscopeOverlayInput {
  selection: HoroscopeSelection;
  /** Frame fetch cho mốc lưu niên đang chọn (scope ['yearly']). null khi chưa chọn / chưa về. */
  yearlyFrame: HoroscopeFrame | null;
  /** Frame fetch cho mốc lưu nguyệt đang chọn (scope ['monthly']). */
  monthlyFrame: HoroscopeFrame | null;
  /** Frame fetch cho mốc lưu nhật đang chọn (scope ['daily']). */
  dailyFrame: HoroscopeFrame | null;
}

export function buildHoroscopeOverlay(input: HoroscopeOverlayInput): HoroscopeOverlay {
  const { selection } = input;

  // Đại vận: index cung đã chọn chính là palace index trên bàn bản mệnh.
  const decadalPalaceIndex = selection.decadalIndex ?? null;

  // Lưu niên: chỉ tô khi đã chọn năm VÀ frame yearly đã về.
  const yearlyPalaceIndex =
    selection.yearlyYear !== undefined ? (input.yearlyFrame?.yearly.index ?? null) : null;

  // Lưu nguyệt: cần frame.monthly (optional trong schema) — thiếu ⇒ null.
  const monthlyPalaceIndex =
    selection.monthlyMonth !== undefined ? (input.monthlyFrame?.monthly?.index ?? null) : null;

  // Lưu nhật: cần frame.daily (optional) — thiếu ⇒ null.
  const dailyPalaceIndex =
    selection.dailyDay !== undefined ? (input.dailyFrame?.daily?.index ?? null) : null;

  return { decadalPalaceIndex, yearlyPalaceIndex, monthlyPalaceIndex, dailyPalaceIndex };
}
