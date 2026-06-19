import { describe, expect, it } from 'vitest';
import { buildHoroscopeOverlay, EMPTY_HOROSCOPE_OVERLAY } from './horoscope-overlay';
import type { HoroscopeFrame } from '@ziweiai/contracts';
import type { HoroscopeSelection } from './horoscope-selection.svelte';

function item(index: number): HoroscopeFrame['yearly'] {
  return {
    index,
    heavenlyStemKey: 'jiaHeavenly',
    earthlyBranchKey: 'ziEarthly',
    palaceNameKeys: ['soulPalace'],
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

describe('buildHoroscopeOverlay — overlay rỗng', () => {
  it('selection {} → mọi index null', () => {
    const overlay = buildHoroscopeOverlay({
      selection: {},
      yearlyFrame: null,
      monthlyFrame: null,
      dailyFrame: null,
    });
    expect(overlay).toEqual(EMPTY_HOROSCOPE_OVERLAY);
  });
});

describe('buildHoroscopeOverlay — đại vận', () => {
  it('decadalPalaceIndex = selection.decadalIndex (không cần frame)', () => {
    const overlay = buildHoroscopeOverlay({
      selection: { decadalIndex: 4 },
      yearlyFrame: null,
      monthlyFrame: null,
      dailyFrame: null,
    });
    expect(overlay.decadalPalaceIndex).toBe(4);
    expect(overlay.yearlyPalaceIndex).toBeNull();
  });
});

describe('buildHoroscopeOverlay — lưu niên', () => {
  it('yearlyPalaceIndex = frame.yearly.index khi đã chọn năm + frame về', () => {
    const sel: HoroscopeSelection = { decadalIndex: 4, yearlyYear: 2026 };
    const overlay = buildHoroscopeOverlay({
      selection: sel,
      yearlyFrame: frame({ yearly: item(7) }),
      monthlyFrame: null,
      dailyFrame: null,
    });
    expect(overlay.decadalPalaceIndex).toBe(4);
    expect(overlay.yearlyPalaceIndex).toBe(7);
  });

  it('yearlyPalaceIndex null khi đã chọn năm nhưng frame chưa về', () => {
    const overlay = buildHoroscopeOverlay({
      selection: { decadalIndex: 4, yearlyYear: 2026 },
      yearlyFrame: null,
      monthlyFrame: null,
      dailyFrame: null,
    });
    expect(overlay.yearlyPalaceIndex).toBeNull();
  });
});

describe('buildHoroscopeOverlay — lưu nguyệt', () => {
  it('monthlyPalaceIndex = frame.monthly.index khi có frame.monthly', () => {
    const sel: HoroscopeSelection = { decadalIndex: 4, yearlyYear: 2026, monthlyMonth: 6 };
    const overlay = buildHoroscopeOverlay({
      selection: sel,
      yearlyFrame: frame({ yearly: item(7) }),
      monthlyFrame: frame({ monthly: item(9) }),
      dailyFrame: null,
    });
    expect(overlay.monthlyPalaceIndex).toBe(9);
  });

  it('monthlyPalaceIndex null khi frame thiếu monthly', () => {
    const overlay = buildHoroscopeOverlay({
      selection: { decadalIndex: 4, yearlyYear: 2026, monthlyMonth: 6 },
      yearlyFrame: null,
      monthlyFrame: frame(), // không có monthly
      dailyFrame: null,
    });
    expect(overlay.monthlyPalaceIndex).toBeNull();
  });
});

describe('buildHoroscopeOverlay — lưu nhật', () => {
  it('dailyPalaceIndex = frame.daily.index khi có frame.daily', () => {
    const sel: HoroscopeSelection = {
      decadalIndex: 4,
      yearlyYear: 2026,
      monthlyMonth: 6,
      dailyDay: 15,
    };
    const overlay = buildHoroscopeOverlay({
      selection: sel,
      yearlyFrame: frame({ yearly: item(7) }),
      monthlyFrame: frame({ monthly: item(9) }),
      dailyFrame: frame({ daily: item(2) }),
    });
    expect(overlay).toEqual({
      decadalPalaceIndex: 4,
      yearlyPalaceIndex: 7,
      monthlyPalaceIndex: 9,
      dailyPalaceIndex: 2,
    });
  });

  it('dailyPalaceIndex null khi frame thiếu daily', () => {
    const overlay = buildHoroscopeOverlay({
      selection: { decadalIndex: 4, yearlyYear: 2026, monthlyMonth: 6, dailyDay: 15 },
      yearlyFrame: null,
      monthlyFrame: null,
      dailyFrame: frame(), // không có daily
    });
    expect(overlay.dailyPalaceIndex).toBeNull();
  });
});

describe('buildHoroscopeOverlay — index 0 không bị nuốt (?? guard)', () => {
  it('decadalPalaceIndex = 0 giữ nguyên (không thành null)', () => {
    const overlay = buildHoroscopeOverlay({
      selection: { decadalIndex: 0 },
      yearlyFrame: null,
      monthlyFrame: null,
      dailyFrame: null,
    });
    expect(overlay.decadalPalaceIndex).toBe(0);
  });

  it('yearlyPalaceIndex = 0 giữ nguyên khi frame.yearly.index = 0', () => {
    const overlay = buildHoroscopeOverlay({
      selection: { decadalIndex: 4, yearlyYear: 2026 },
      yearlyFrame: frame({ yearly: item(0) }),
      monthlyFrame: null,
      dailyFrame: null,
    });
    expect(overlay.yearlyPalaceIndex).toBe(0);
  });
});
