import { describe, expect, it } from 'vitest';
import { horoscopeFrameSchema, type BirthInput } from '@ziweiai/contracts';
import { IztroChartAdapter } from './adapters/iztro-chart-adapter';
import { computeZiweiHoroscope } from './ziwei-horoscope';

// Bộ phát hiện CJK mở rộng — giữ đồng bộ với phase-3.test.ts (astro-engine không phụ
// thuộc @ziweiai/core nên định nghĩa cục bộ).
const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}　-〿＀-￯]/u;

const ziweiBirth: BirthInput = {
  calendar: 'gregorian',
  date: { year: 1990, month: 6, day: 15, isLeapMonth: null },
  time: { hour: 12, minute: 0, isUnknown: false },
  sexOrGenderForChart: 'male',
  place: {
    label: 'Hà Nội',
    manual: { latitude: 21.0285, longitude: 105.8542, timezone: 'Asia/Ho_Chi_Minh' },
  },
  locale: 'vi-VN',
  source: 'test-fixture',
};

async function buildZiweiSnapshot() {
  const adapter = new IztroChartAdapter();
  return adapter.calculateChart(ziweiBirth, { viewYear: 2026 });
}

describe('computeZiweiHoroscope', () => {
  it('trả frame parse được bằng horoscopeFrameSchema cho asOf cố định', async () => {
    const snapshot = await buildZiweiSnapshot();
    const frame = computeZiweiHoroscope({
      snapshot,
      asOf: '2026-06-17',
      scopes: ['decadal', 'yearly', 'monthly', 'daily'],
    });

    const parsed = horoscopeFrameSchema.parse(frame);
    expect(parsed.decadal.index).toBeGreaterThanOrEqual(0);
    expect(parsed.decadal.index).toBeLessThanOrEqual(11);
    expect(parsed.monthly).toBeDefined();
    expect(parsed.daily).toBeDefined();
  });

  it('deterministic: cùng input cho cùng output', async () => {
    const snapshot = await buildZiweiSnapshot();
    const a = computeZiweiHoroscope({ snapshot, asOf: '2026-06-17', scopes: ['decadal', 'yearly'] });
    const b = computeZiweiHoroscope({ snapshot, asOf: '2026-06-17', scopes: ['decadal', 'yearly'] });
    expect(a).toEqual(b);
  });

  it('chỉ thêm monthly/daily khi scopes yêu cầu', async () => {
    const snapshot = await buildZiweiSnapshot();
    const frame = computeZiweiHoroscope({ snapshot, asOf: '2026-06-17', scopes: ['decadal', 'yearly'] });
    expect(frame.monthly).toBeUndefined();
    expect(frame.daily).toBeUndefined();
  });

  it('output KHÔNG chứa ký tự CJK (đã ánh xạ sang ChartKey)', async () => {
    const snapshot = await buildZiweiSnapshot();
    const frame = computeZiweiHoroscope({
      snapshot,
      asOf: '2026-06-17',
      scopes: ['decadal', 'yearly', 'monthly', 'daily'],
    });
    expect(CJK_TEXT_PATTERN.test(JSON.stringify(frame))).toBe(false);
  });

  it('throw khi snapshot không phải zi-wei-dou-shu', async () => {
    const snapshot = await buildZiweiSnapshot();
    const baziLike = { ...snapshot, chartSystem: 'ba-zi' as const };
    expect(() =>
      computeZiweiHoroscope({ snapshot: baziLike, asOf: '2026-06-17', scopes: ['decadal'] }),
    ).toThrow();
  });
});
