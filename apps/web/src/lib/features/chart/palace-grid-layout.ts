import type { PalaceView } from './chart-display';

const CANONICAL_BRANCH_KEYS = new Set([
  'siEarthly',
  'wuEarthly',
  'weiEarthly',
  'shenEarthly',
  'chenEarthly',
  'maoEarthly',
  'youEarthly',
  'xuEarthly',
  'yinEarthly',
  'chouEarthly',
  'ziEarthly',
  'haiEarthly',
]);

// US-008: bàn vuông 4×4 chỉ phụ thuộc dữ liệu (mọi cung có địa chi chuẩn) — KHÔNG còn chặn
// theo bề rộng màn hình. Trên mobile bàn co giãn / cuộn ngang (CSS), không ép về lưới index.
// Snapshot legacy thiếu địa chi chuẩn → false → fallback lưới responsive theo index.
export function shouldUseSquareBoard(palaces: PalaceView[]): boolean {
  return palaces.length > 0 && palaces.every((palace) => CANONICAL_BRANCH_KEYS.has(palace.earthlyBranchKey));
}
