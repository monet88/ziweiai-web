import { describe, expect, it } from 'vitest';
import { flattenSticks, type StickSource } from './divination-sticks';

// Fixture: 2 quẻ với cấu trúc lồng sâu giống nguồn thật (level lặp để test dedupe,
// detailedInterpretations lồng object, id number giữ literal, chuỗi rỗng giữ literal).
const sticks: StickSource[] = [
  {
    id: 1,
    level: '上上',
    title: '大吉',
    poem: '诗句一',
    categories: { career: '事业顺', love: '' },
    detailedInterpretations: { home: '家宅吉', business: '生意吉' },
  },
  {
    id: 2,
    level: '上上', // lặp -> dedupe chung unit với quẻ 1
    title: '中平',
    poem: '诗句二',
    categories: { career: '事业平' },
    detailedInterpretations: { home: '家宅平' },
  },
];

// Fake dịch: prefix "vi:" cho mọi unit, giữ sạch Hán.
function fakeTranslate(units: { id: string; text: string }[]): Map<string, string> {
  return new Map(units.map((u) => [u.id, `vi:${u.text}`]));
}

describe('flattenSticks', () => {
  it('dedupe chuỗi lặp (level 上上 chung 1 unit)', () => {
    const { units } = flattenSticks(sticks);
    const levelUnits = units.filter((u) => u.text === '上上');
    expect(levelUnits).toHaveLength(1);
  });

  it('không tạo unit cho id number hay chuỗi rỗng', () => {
    const { units } = flattenSticks(sticks);
    expect(units.some((u) => u.text === '1' || u.text === '2')).toBe(false);
    expect(units.some((u) => u.text === '')).toBe(false);
  });

  it('rebuild giữ nguyên cây + id number + chuỗi rỗng, dịch mọi leaf chuỗi', () => {
    const { units, rebuild } = flattenSticks(sticks);
    const rebuilt = rebuild(fakeTranslate(units));
    expect(rebuilt).toHaveLength(2);
    expect(rebuilt[0].id).toBe(1);
    expect(rebuilt[0].level).toBe('vi:上上');
    expect(rebuilt[1].level).toBe('vi:上上');
    const cats0 = rebuilt[0].categories as Record<string, string>;
    expect(cats0.career).toBe('vi:事业顺');
    expect(cats0.love).toBe(''); // chuỗi rỗng giữ nguyên
    const detail0 = rebuilt[0].detailedInterpretations as Record<string, string>;
    expect(detail0.home).toBe('vi:家宅吉');
    expect(detail0.business).toBe('vi:生意吉');
  });

  it('rebuild ném khi thiếu bản dịch', () => {
    const { rebuild } = flattenSticks(sticks);
    expect(() => rebuild(new Map())).toThrow(/Thiếu bản dịch/);
  });
});
