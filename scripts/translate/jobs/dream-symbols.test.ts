import { describe, expect, it } from 'vitest';
import { flattenDreamSymbols, type DreamSymbolSource } from './dream-symbols';

const sample: DreamSymbolSource[] = [
  {
    keywords: ['蛇', '毒蛇'],
    meaning: '蛇代表变化',
    positive: '智慧',
    negative: '威胁',
    advice: '保持警觉',
    category: '动物',
  },
  {
    keywords: ['龙'],
    meaning: '龙象征力量',
    category: '动物', // category trùng entry trên -> phải dedupe
  },
];

describe('flattenDreamSymbols', () => {
  it('dedupe chuỗi trùng (category lặp chỉ tạo 1 unit)', () => {
    const { units } = flattenDreamSymbols(sample);
    const texts = units.map((u) => u.text);
    // 2 keyword + meaning + positive + negative + advice (entry1) = 6; entry2: 1 keyword + meaning = 2;
    // category '动物' dùng chung -> tổng 6 + 2 + 1 = 9 unit duy nhất.
    expect(units.length).toBe(9);
    expect(texts.filter((t) => t === '动物').length).toBe(1);
  });

  it('rebuild dựng lại đúng cấu trúc + bỏ field optional vắng mặt', () => {
    const { units, rebuild } = flattenDreamSymbols(sample);
    // Fake dịch: vi = "vi:" + text gốc.
    const translated = new Map(units.map((u) => [u.id, `vi:${u.text}`]));
    const result = rebuild(translated);
    expect(result).toHaveLength(2);
    expect(result[0].keywords).toEqual(['vi:蛇', 'vi:毒蛇']);
    expect(result[0].meaning).toBe('vi:蛇代表变化');
    expect(result[0].category).toBe('vi:动物');
    expect(result[0].advice).toBe('vi:保持警觉');
    // entry2 không có positive/negative/advice -> field vắng mặt, không phải undefined.
    expect('positive' in result[1]).toBe(false);
    expect('advice' in result[1]).toBe(false);
    expect(result[1].category).toBe('vi:动物');
  });

  it('rebuild ném khi thiếu bản dịch', () => {
    const { rebuild } = flattenDreamSymbols(sample);
    expect(() => rebuild(new Map())).toThrow(/Thiếu bản dịch/);
  });
});
