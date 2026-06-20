/**
 * Helper mốc thời gian cho feature vận hạn (US-016) — tách thuần để test deterministic
 * (truyền `now` vào), tránh rải `new Date()` trong component.
 */

/** `YYYY-MM-DD` theo giờ địa phương cho vận ngày. */
export function todayAsOf(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** `YYYY-MM` theo giờ địa phương cho vận tháng. */
export function currentMonthAsOf(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

/** Năm hiện tại cho báo cáo năm. */
export function currentYear(now: Date = new Date()): number {
  return now.getFullYear();
}
