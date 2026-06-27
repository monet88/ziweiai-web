import { describe, expect, it } from 'vitest';
import { flattenLenormand, type LenormandCardSource, type LenormandSpreadSource } from './lenormand';

const cards: LenormandCardSource[] = [
  { id: 1, name: '骑士', keywords: ['消息', '到来'], meaning: '消息抵达。' },
  { id: 2, name: '三叶草', keywords: ['机会', '消息'], meaning: '短期机会出现。' },
];

const spreads = new Map<string, LenormandSpreadSource>([
  ['single', { name: '单牌线索', positions: ['核心线索'] }],
  ['three', { name: '三牌事件线', positions: ['起因', '现状'] }],
]);

function fakeViMap(units: { id: string; text: string }[]): Map<string, string> {
  // Bản dịch giả: gắn tiền tố "vi:" để vừa sạch Hán vừa kiểm map id->text đúng.
  return new Map(units.map((u) => [u.id, `vi:${u.text}`]));
}

describe('flattenLenormand', () => {
  it('dedupe chuỗi lặp giữa các lá', () => {
    const { units } = flattenLenormand(cards, spreads);
    // '消息' xuất hiện ở lá 1 (keyword) và lá 2 (keyword) -> chỉ 1 unit.
    const texts = units.map((u) => u.text);
    expect(texts.filter((t) => t === '消息')).toHaveLength(1);
  });

  it('rebuild giữ nguyên id số + thứ tự lá và bộ trải', () => {
    const { units, rebuild } = flattenLenormand(cards, spreads);
    const dataset = rebuild(fakeViMap(units));
    expect(dataset.cards).toHaveLength(2);
    expect(dataset.cards[0].id).toBe(1);
    expect(dataset.cards[0].name).toBe('vi:骑士');
    expect(dataset.cards[0].keywords).toEqual(['vi:消息', 'vi:到来']);
    expect(dataset.cards[1].keywords[1]).toBe('vi:消息'); // dùng lại bản dịch deduped
    expect(dataset.spreads.map((s) => s.key)).toEqual(['single', 'three']);
    expect(dataset.spreads[1].positions).toEqual(['vi:起因', 'vi:现状']);
  });

  it('rebuild ném khi thiếu bản dịch', () => {
    const { rebuild } = flattenLenormand(cards, spreads);
    expect(() => rebuild(new Map())).toThrow(/Thiếu bản dịch/);
  });
});
