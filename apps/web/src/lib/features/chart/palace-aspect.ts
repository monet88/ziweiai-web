// Tam phương tứ chính (3 phương 4 chính): từ một cung đang chọn, bộ cung "chiếu" gồm chính
// cung, đối cung (xung chiếu, +6) và nhị cung tam hợp (+4, -4). Port công thức bàn Tử Vi
// truyền thống nhưng tính THUẦN trên index vòng cung 0–11 — KHÔNG dùng chuỗi địa chi Hán và
// KHÔNG import engine (boundary web chỉ `@ziweiai/contracts`; xem decision 0007).

const PALACE_RING_SIZE = 12;

// Số bước lệch của tam phương tứ chính so với chính cung: đối cung +6, tam hợp +4 và -4.
const ASPECT_OFFSETS = [0, 6, 4, -4] as const;

// Chuẩn hoá về vòng cung 0–11 (xử lý cả số âm khi cộng -4).
function normalizeRingIndex(index: number): number {
  return ((Math.trunc(index) % PALACE_RING_SIZE) + PALACE_RING_SIZE) % PALACE_RING_SIZE;
}

/**
 * Trả về index 4 cung tam phương tứ chính của `index`, theo thứ tự
 * `[chính cung, đối cung (+6), tam hợp (+4), tam hợp (-4)]`, đã chuẩn hoá vòng 0–11.
 */
export function getPalaceAspectIndices(index: number): number[] {
  const base = normalizeRingIndex(index);
  return ASPECT_OFFSETS.map((offset) => normalizeRingIndex(base + offset));
}

/** True khi `candidateIndex` thuộc tam phương tứ chính của `selectedIndex`. */
export function isPalaceInAspect(selectedIndex: number, candidateIndex: number): boolean {
  return getPalaceAspectIndices(selectedIndex).includes(normalizeRingIndex(candidateIndex));
}
