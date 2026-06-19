/**
 * State machine 4 tầng vận hạn (đại vận → lưu niên → lưu nguyệt → lưu nhật) — US-015.
 *
 * Factory runes thuần (port reducer taibu `ZiweiHoroscopePanel.tsx`), test được mà KHÔNG
 * cần QueryClient context — đúng pattern `createPalaceSelection` của US-006. Mỗi instance
 * độc lập: route bọc model trong {#key chartId} (US-006) → đổi lá số tạo instance mới →
 * selection về `{}` mà KHÔNG cần $effect ghi ngược.
 *
 * Bất biến cascade (reducer phải giữ):
 * - `yearlyYear` set ⇒ `decadalIndex` set; `monthlyMonth` set ⇒ `yearlyYear` set;
 *   `dailyDay` set ⇒ `monthlyMonth` set.
 * - Đổi tầng cao reset mọi tầng thấp về `undefined`.
 * - Click lại đúng chip đang chọn = toggle off tầng đó + reset các tầng dưới (taibu DESELECT_*).
 * - Chọn tầng thấp khi tầng trên chưa chọn = noop (không leo tầng).
 */

/** State 4 tầng; mọi trường optional — `undefined` = "chưa chọn ở tầng đó". */
export interface HoroscopeSelection {
  /** Index cung Mệnh đại vận (0..11). undefined = panel rỗng. */
  decadalIndex?: number;
  /** Năm dương lưu niên (vd 2026). undefined = chưa chọn lưu niên. */
  yearlyYear?: number;
  /** Tháng dương lưu nguyệt (1..12). undefined = chưa chọn lưu nguyệt. */
  monthlyMonth?: number;
  /** Ngày dương lưu nhật (1..31). undefined = chưa chọn lưu nhật. */
  dailyDay?: number;
}

export interface HoroscopeSelectionOptions {
  /**
   * Getter đại vận mặc định (đại vận chứa năm hiện tại). null = snapshot chưa sẵn / không
   * xác định được đại vận → giữ `{}`. Đọc reactive nên khi snapshot tới muộn, component gọi
   * lại `ensureDefault()` trong `$effect.pre` để áp đúng 1 lần.
   */
  defaultDecadalIndex: () => number | null;
}

export function createHoroscopeSelection(options: HoroscopeSelectionOptions) {
  let selection = $state<HoroscopeSelection>({});
  // Khoá auto-apply: bật khi đã áp mặc định HOẶC user đã tương tác (kể cả toggle off đại vận).
  // Ngăn ensureDefault() ghi đè lựa chọn/ý định của user khi snapshot re-evaluate.
  let locked = false;

  /** Áp đại vận mặc định đúng 1 lần khi snapshot sẵn sàng + user chưa tương tác. */
  function ensureDefault(): void {
    if (locked || selection.decadalIndex !== undefined) {
      return;
    }
    const index = options.defaultDecadalIndex();
    if (index === null) {
      return; // snapshot chưa sẵn / không có đại vận → thử lại lần sau
    }
    locked = true;
    selection = { decadalIndex: index };
  }

  // Áp ngay nếu snapshot đã sẵn lúc dựng factory; tới muộn → $effect.pre gọi lại.
  ensureDefault();

  function selectDecadal(index: number): void {
    locked = true; // user đã tương tác → dừng auto-apply mặc định
    selection = selection.decadalIndex === index ? {} : { decadalIndex: index };
  }

  function selectYearly(year: number): void {
    if (selection.decadalIndex === undefined) {
      return; // không leo tầng khi chưa chọn đại vận
    }
    if (selection.yearlyYear === year) {
      selection = { decadalIndex: selection.decadalIndex }; // toggle off + reset nguyệt/nhật
      return;
    }
    selection = { decadalIndex: selection.decadalIndex, yearlyYear: year };
  }

  function selectMonthly(month: number): void {
    if (selection.yearlyYear === undefined) {
      return;
    }
    if (selection.monthlyMonth === month) {
      selection = { decadalIndex: selection.decadalIndex, yearlyYear: selection.yearlyYear };
      return;
    }
    selection = {
      decadalIndex: selection.decadalIndex,
      yearlyYear: selection.yearlyYear,
      monthlyMonth: month,
    };
  }

  function selectDaily(day: number): void {
    if (selection.monthlyMonth === undefined) {
      return;
    }
    if (selection.dailyDay === day) {
      selection = {
        decadalIndex: selection.decadalIndex,
        yearlyYear: selection.yearlyYear,
        monthlyMonth: selection.monthlyMonth,
      };
      return;
    }
    selection = { ...selection, dailyDay: day };
  }

  return {
    get value(): HoroscopeSelection {
      return selection;
    },
    ensureDefault,
    selectDecadal,
    selectYearly,
    selectMonthly,
    selectDaily,
  };
}

export type HoroscopeSelectionStore = ReturnType<typeof createHoroscopeSelection>;
