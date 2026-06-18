/**
 * Build danh sách chip cho 4 vùng panel vận hạn (US-015) — helper thuần, KHÔNG fetch.
 *
 * Nguồn dữ liệu:
 * - Đại vận: lấy thẳng từ `PalaceView[]` (snapshot bản mệnh đã có `decadalRange` — US-008).
 * - Lưu niên: suy ra 10 năm trong dải đại vận đang chọn (`birthYear + startAge..endAge`,
 *   khớp số học taibu `birthYear + startAge`). Tuổi nominal = `year - birthYear`.
 * - Lưu nguyệt / lưu nhật: 12 tháng / 28–31 ngày; tên cung Mệnh vận đích chỉ hiển thị cho
 *   mốc đang chọn (mốc duy nhất có frame đã fetch — tradeoff lazy của decision 0011).
 *
 * Bất biến CJK: tên cung đích dịch qua `translateZiweiKey` (fail-fast). Key lạ → degrade
 * thành `viCopy.horoscope.missingValue` + `console.warn` 1 lần, KHÔNG rò Han, KHÔNG throw
 * vỡ panel (đúng pattern degrade của `PalaceGrid` US-014).
 */
import type { HoroscopeFrame } from '@ziweiai/contracts';
import { translateZiweiKey } from '$lib/i18n/ziwei-terms-vi';
import { viCopy } from '$lib/i18n/vi';
import type { PalaceView } from './palace-view-builder';
import type { HoroscopeSelection } from './horoscope-selection.svelte';

export interface HoroscopeChip {
  /** Khoá ổn định cho `{#each}` Svelte. */
  key: string;
  /** Nhãn chính tiếng Việt (vd "Mệnh", "2026", "Tháng 6", "15"). */
  primary: string;
  /** Nhãn phụ (dải tuổi / tuổi nominal / tên cung Mệnh vận đích). */
  secondary: string;
  /** Có đang được chọn ở tầng đó không. */
  selected: boolean;
}

const copy = viCopy.horoscope;

/** Parse dải đại vận "6–15" / "6-15" → { startAge, endAge }. null nếu không đọc được. */
export function parseDecadalRange(range: string | null): { startAge: number; endAge: number } | null {
  // Guard kiểu nghiêm ngặt (review cubic+gemini): hàm thao tác chuỗi ở ranh giới dữ liệu
  // snapshot — chặn cả null lẫn non-string trước khi gọi .match() phòng input lệch type runtime.
  if (typeof range !== 'string') {
    return null;
  }
  const match = range.match(/(\d+)\D+(\d+)/u);
  if (!match) {
    return null;
  }
  return { startAge: Number(match[1]), endAge: Number(match[2]) };
}

/**
 * Dịch tên cung Mệnh vận đích (palaceNameKeys[0]) — degrade về placeholder khi key lạ.
 * Trả `viCopy.horoscope.missingValue` thay vì throw để 1 chip lỗi không làm vỡ cả vùng.
 */
function destinationPalaceName(item: HoroscopeFrame['yearly'] | undefined): string {
  const key = item?.palaceNameKeys[0];
  if (!key) {
    return copy.missingValue;
  }
  try {
    return translateZiweiKey(key);
  } catch (error) {
    console.warn('[horoscope-panel] tên cung Mệnh vận có key lạ', error);
    return copy.missingValue;
  }
}

/**
 * Đại vận: 1 chip cho mỗi cung có `decadalRange` hợp lệ, sort tăng dần theo `startAge`.
 * Số lượng do snapshot quyết định (KHÔNG hardcode), thường ~10 giai đoạn.
 */
export function buildDecadalChips(
  palaces: PalaceView[],
  selection: HoroscopeSelection,
): HoroscopeChip[] {
  return palaces
    .map((palace) => {
      const range = parseDecadalRange(palace.decadalRange);
      if (!range) {
        return null;
      }
      return {
        palace,
        range,
        chip: {
          key: `decadal-${palace.index}`,
          primary: palace.name,
          secondary: palace.decadalRange ? `${palace.decadalRange} ${copy.decadal.ageSuffix}` : copy.missingValue,
          selected: selection.decadalIndex === palace.index,
        } satisfies HoroscopeChip,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => a.range.startAge - b.range.startAge)
    .map((entry) => entry.chip);
}

/**
 * Lưu niên: các năm trong dải đại vận đang chọn (`birthYear + startAge..endAge`).
 * Tuổi nominal hiển thị = `year - birthYear` (khớp số học taibu). Trả [] khi chưa đọc được dải.
 */
export function buildYearlyChips(params: {
  decadalRange: string | null;
  birthYear: number;
  selection: HoroscopeSelection;
}): HoroscopeChip[] {
  const range = parseDecadalRange(params.decadalRange);
  if (!range) {
    return [];
  }
  const chips: HoroscopeChip[] = [];
  for (let age = range.startAge; age <= range.endAge; age += 1) {
    const year = params.birthYear + age;
    chips.push({
      key: `yearly-${year}`,
      primary: String(year),
      secondary: `${age} ${copy.decadal.ageSuffix}`,
      selected: params.selection.yearlyYear === year,
    });
  }
  return chips;
}

/**
 * Lưu nguyệt: 12 chip tháng (1..12). Tên cung Mệnh vận đích chỉ hiển thị cho tháng đang
 * chọn (mốc duy nhất có `frame.monthly`); các tháng khác để placeholder.
 */
export function buildMonthlyChips(params: {
  selection: HoroscopeSelection;
  monthlyFrame: HoroscopeFrame | null;
}): HoroscopeChip[] {
  const chips: HoroscopeChip[] = [];
  for (let month = 1; month <= 12; month += 1) {
    const isSelected = params.selection.monthlyMonth === month;
    const secondary =
      isSelected && params.monthlyFrame?.monthly
        ? destinationPalaceName(params.monthlyFrame.monthly)
        : copy.missingValue;
    chips.push({
      key: `monthly-${month}`,
      primary: copy.monthFormat.replace('{month}', String(month)),
      secondary,
      selected: isSelected,
    });
  }
  return chips;
}

/**
 * Lưu nhật: 28–31 chip ngày của (year, month). Số ngày = `new Date(year, month, 0).getDate()`
 * (month 1-based: index `month` là tháng kế, day 0 lùi về ngày cuối tháng `month`).
 */
export function buildDailyChips(params: {
  year: number;
  month: number;
  selection: HoroscopeSelection;
  dailyFrame: HoroscopeFrame | null;
}): HoroscopeChip[] {
  const daysInMonth = new Date(params.year, params.month, 0).getDate();
  const chips: HoroscopeChip[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const isSelected = params.selection.dailyDay === day;
    const secondary =
      isSelected && params.dailyFrame?.daily
        ? destinationPalaceName(params.dailyFrame.daily)
        : copy.missingValue;
    chips.push({
      key: `daily-${day}`,
      primary: String(day),
      secondary,
      selected: isSelected,
    });
  }
  return chips;
}

/**
 * Đại vận mặc định = đại vận chứa năm hiện tại. Tuổi nội suy = `today.year - birthYear`
 * (khớp số học taibu `birthYear + startAge`). null khi không cung nào có dải khớp / thiếu dải.
 */
export function computeDefaultDecadalIndex(
  palaces: PalaceView[],
  birthYear: number,
  today: Date,
): number | null {
  const age = today.getFullYear() - birthYear;
  for (const palace of palaces) {
    const range = parseDecadalRange(palace.decadalRange);
    if (range && age >= range.startAge && age <= range.endAge) {
      return palace.index;
    }
  }
  return null;
}
