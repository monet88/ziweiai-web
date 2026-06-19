import { describe, expect, it } from 'vitest';
import {
  buildDecadalChips,
  buildYearlyChips,
  buildMonthlyChips,
  buildDailyChips,
  computeDefaultDecadalIndex,
  parseDecadalRange,
} from './horoscope-chips';
import type { PalaceView } from './palace-view-builder';
import type { HoroscopeFrame } from '@ziweiai/contracts';
import type { HoroscopeSelection } from './horoscope-selection.svelte';

function palace(index: number, overrides: Partial<PalaceView> = {}): PalaceView {
  return {
    nameKey: `palace-${index}`,
    name: `Cung ${index}`,
    index,
    earthlyBranchKey: 'ziEarthly',
    stemBranch: 'Giáp Tý',
    isBodyPalace: false,
    isOriginalPalace: false,
    changsheng: null,
    decadalRange: null,
    ages: [],
    majorStars: [],
    minorStars: [],
    adjectiveStars: [],
    ...overrides,
  };
}

function item(index: number, palaceNameKeys: string[] = ['soulPalace']): HoroscopeFrame['yearly'] {
  return {
    index,
    heavenlyStemKey: 'jiaHeavenly',
    earthlyBranchKey: 'ziEarthly',
    palaceNameKeys,
    mutagenStarKeys: [],
  };
}

function frame(overrides: Partial<HoroscopeFrame> = {}): HoroscopeFrame {
  return {
    decadal: item(0),
    age: { index: 0, nominalAge: 36 },
    yearly: item(1),
    ...overrides,
  };
}

describe('parseDecadalRange', () => {
  it('parse "31-40" (hyphen)', () => {
    expect(parseDecadalRange('31-40')).toEqual({ startAge: 31, endAge: 40 });
  });

  it('parse "6–15" (en-dash như palace-view-builder)', () => {
    expect(parseDecadalRange('6–15')).toEqual({ startAge: 6, endAge: 15 });
  });

  it('null cho input null / không đọc được', () => {
    expect(parseDecadalRange(null)).toBeNull();
    expect(parseDecadalRange('abc')).toBeNull();
  });
});

describe('buildDecadalChips', () => {
  it('1 chip mỗi cung có decadalRange hợp lệ, sort tăng theo startAge', () => {
    const palaces = [
      palace(2, { decadalRange: '36–45', name: 'Phụ Mẫu' }),
      palace(0, { decadalRange: '6–15', name: 'Mệnh' }),
      palace(1, { decadalRange: '16–25', name: 'Huynh Đệ' }),
      palace(3, { decadalRange: null }), // bỏ qua — không có dải
    ];
    const chips = buildDecadalChips(palaces, {});
    expect(chips.map((c) => c.primary)).toEqual(['Mệnh', 'Huynh Đệ', 'Phụ Mẫu']);
    expect(chips[0].key).toBe('decadal-0');
    expect(chips[0].secondary).toContain('6–15');
  });

  it('selected = true cho cung trùng selection.decadalIndex', () => {
    const palaces = [palace(0, { decadalRange: '6–15' }), palace(1, { decadalRange: '16–25' })];
    const chips = buildDecadalChips(palaces, { decadalIndex: 1 });
    expect(chips.find((c) => c.key === 'decadal-1')?.selected).toBe(true);
    expect(chips.find((c) => c.key === 'decadal-0')?.selected).toBe(false);
  });
});

describe('buildYearlyChips', () => {
  it('đại vận 31–40 + birthYear 1990 = 10 năm 2021–2030', () => {
    const chips = buildYearlyChips({ decadalRange: '31–40', birthYear: 1990, selection: {} });
    expect(chips).toHaveLength(10);
    expect(chips[0].primary).toBe('2021');
    expect(chips[9].primary).toBe('2030');
    expect(chips[0].secondary).toBe('31 tuổi');
  });

  it('[] khi decadalRange không đọc được', () => {
    expect(buildYearlyChips({ decadalRange: null, birthYear: 1990, selection: {} })).toEqual([]);
  });

  it('selected = true cho năm trùng selection.yearlyYear', () => {
    const chips = buildYearlyChips({ decadalRange: '31–40', birthYear: 1990, selection: { yearlyYear: 2026 } });
    expect(chips.find((c) => c.primary === '2026')?.selected).toBe(true);
  });
});

describe('buildMonthlyChips', () => {
  it('12 chip tháng; tên cung đích chỉ hiện cho tháng đang chọn', () => {
    const sel: HoroscopeSelection = { decadalIndex: 0, yearlyYear: 2026, monthlyMonth: 6 };
    const chips = buildMonthlyChips({
      selection: sel,
      monthlyFrame: frame({ monthly: item(4, ['careerPalace']) }),
    });
    expect(chips).toHaveLength(12);
    expect(chips[5].primary).toBe('Tháng 6');
    expect(chips[5].selected).toBe(true);
    expect(chips[5].secondary).toBe('Quan Lộc'); // dịch careerPalace
    expect(chips[0].secondary).toBe('—'); // tháng không chọn = placeholder
  });

  it('thiếu frame.monthly = 12 chip placeholder', () => {
    const chips = buildMonthlyChips({
      selection: { decadalIndex: 0, yearlyYear: 2026, monthlyMonth: 6 },
      monthlyFrame: frame(), // không có monthly
    });
    expect(chips).toHaveLength(12);
    expect(chips.every((c) => c.secondary === '—')).toBe(true);
  });
});

describe('buildDailyChips', () => {
  it('2026-06 = 30 chip', () => {
    const chips = buildDailyChips({ year: 2026, month: 6, selection: {}, dailyFrame: null });
    expect(chips).toHaveLength(30);
    expect(chips[0].primary).toBe('1');
    expect(chips[29].primary).toBe('30');
  });

  it('2026-02 = 28 chip (non-leap)', () => {
    const chips = buildDailyChips({ year: 2026, month: 2, selection: {}, dailyFrame: null });
    expect(chips).toHaveLength(28);
  });

  it('2024-02 = 29 chip (leap)', () => {
    const chips = buildDailyChips({ year: 2024, month: 2, selection: {}, dailyFrame: null });
    expect(chips).toHaveLength(29);
  });

  it('tên cung đích hiện cho ngày đang chọn khi có frame.daily', () => {
    const sel: HoroscopeSelection = { decadalIndex: 0, yearlyYear: 2026, monthlyMonth: 6, dailyDay: 15 };
    const chips = buildDailyChips({
      year: 2026,
      month: 6,
      selection: sel,
      dailyFrame: frame({ daily: item(7, ['wealthPalace']) }),
    });
    expect(chips[14].selected).toBe(true);
    expect(chips[14].secondary).toBe('Tài Bạch');
  });
});

describe('computeDefaultDecadalIndex', () => {
  it('chọn đại vận chứa tuổi nominal hiện tại (2026 - 1990 = 36 → dải 36–45)', () => {
    const palaces = [
      palace(0, { decadalRange: '6–15' }),
      palace(5, { decadalRange: '36–45' }),
      palace(2, { decadalRange: '26–35' }),
    ];
    expect(computeDefaultDecadalIndex(palaces, 1990, new Date(2026, 5, 18))).toBe(5);
  });

  it('null khi không cung nào có dải', () => {
    const palaces = [palace(0), palace(1)];
    expect(computeDefaultDecadalIndex(palaces, 1990, new Date(2026, 5, 18))).toBeNull();
  });

  it('null khi tuổi nằm ngoài mọi dải', () => {
    const palaces = [palace(0, { decadalRange: '6–15' })];
    expect(computeDefaultDecadalIndex(palaces, 1990, new Date(2026, 5, 18))).toBeNull();
  });
});
