import type { HoroscopeFrame, HoroscopeItem } from '@ziweiai/contracts';
import { translateZiweiKey } from '../../i18n/ziwei-terms-vi';
import type { PalaceView } from './palace-view-builder';

/** 4 tầng vận hạn — dùng làm key cho CSS variable + thanh chỉ báo + chip footer. */
export type HighlightTier = 'decadal' | 'yearly' | 'monthly' | 'daily';

/** Dữ liệu flow-info presentational cho 1 ô (US-014). undefined ở tầng nào = ô không phải cung Mệnh tầng đó. */
export interface PalaceFlowView {
  decadal?: { stemBranch: string; agesRange: string | null };
  yearly?: { stemBranch: string };
  monthly?: { stemBranch: string };
  daily?: { stemBranch: string };
}

/** Dịch can-chi của một horoscope item sang tiếng Việt (fail-fast qua translateZiweiKey). */
function toStemBranch(item: HoroscopeItem): string {
  return `${translateZiweiKey(item.heavenlyStemKey)} ${translateZiweiKey(item.earthlyBranchKey)}`;
}

/**
 * Build flow-flags cho một ô từ frame vận hạn (US-014) — thuần, KHÔNG side-effect, KHÔNG fetch.
 *
 * Set field của tầng khi `palace.index` khớp `frame.<tier>.index`. `agesRange` lấy từ
 * `palace.decadalRange` đã có sẵn trên `PalaceView` (US-008), KHÔNG đọc lại `palace.ages`.
 * Can-chi dịch fail-fast — key lạ (snapshot legacy) → throw, caller (PalaceGrid) bắt + degrade.
 */
export function buildPalaceFlowFlags(palace: PalaceView, frame: HoroscopeFrame): PalaceFlowView {
  const flags: PalaceFlowView = {};

  if (palace.index === frame.decadal.index) {
    flags.decadal = { stemBranch: toStemBranch(frame.decadal), agesRange: palace.decadalRange };
  }
  if (palace.index === frame.yearly.index) {
    flags.yearly = { stemBranch: toStemBranch(frame.yearly) };
  }
  if (frame.monthly && palace.index === frame.monthly.index) {
    flags.monthly = { stemBranch: toStemBranch(frame.monthly) };
  }
  if (frame.daily && palace.index === frame.daily.index) {
    flags.daily = { stemBranch: toStemBranch(frame.daily) };
  }

  return flags;
}

/** Duyệt 12 cung, trả map `palaceIndex → PalaceFlowView` (chỉ chứa ô có ≥ 1 tầng). */
export function buildPalaceFlowFlagsMap(
  palaces: PalaceView[],
  frame: HoroscopeFrame | null,
): Map<number, PalaceFlowView> {
  const map = new Map<number, PalaceFlowView>();
  if (!frame) {
    return map;
  }

  for (const palace of palaces) {
    const flags = buildPalaceFlowFlags(palace, frame);
    if (Object.keys(flags).length > 0) {
      map.set(palace.index, flags);
    }
  }

  return map;
}
