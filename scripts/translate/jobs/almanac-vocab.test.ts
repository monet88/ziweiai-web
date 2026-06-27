import { describe, expect, it } from 'vitest';
import { containsCjkText } from '../core';
import { flattenAlmanacVocab, harvestAlmanacVocab } from './almanac-vocab';

describe('flattenAlmanacVocab', () => {
  it('mỗi chuỗi Hán độc nhất thành một unit, id ổn định theo thứ tự', () => {
    const { units } = flattenAlmanacVocab(['宜', '忌', '建']);
    expect(units).toEqual([
      { id: 'almanac.t0', text: '宜' },
      { id: 'almanac.t1', text: '忌' },
      { id: 'almanac.t2', text: '建' },
    ]);
  });

  it('rebuild dựng lại bảng {han: vi} đúng cặp', () => {
    const { units, rebuild } = flattenAlmanacVocab(['宜', '忌']);
    const translated = new Map(units.map((u) => [u.id, `vi:${u.text}`]));
    const table = rebuild(translated);
    expect(table).toEqual({ 宜: 'vi:宜', 忌: 'vi:忌' });
  });

  it('rebuild ném khi thiếu bản dịch', () => {
    const { rebuild } = flattenAlmanacVocab(['宜']);
    expect(() => rebuild(new Map())).toThrow(/Thiếu bản dịch/);
  });
});

describe('harvestAlmanacVocab', () => {
  // Chạy thư viện thật trên một dải ngày nhỏ: chốt rằng harvest gom được tập từ
  // vựng Hán hữu hạn ổn định (không phụ thuộc network). Dùng 1 năm cho test nhanh.
  const vocab = harvestAlmanacVocab(2024, 2024);

  it('thu được tập chuỗi Hán không rỗng, đã dedupe + sort ổn định', () => {
    expect(vocab.length).toBeGreaterThan(100);
    expect(new Set(vocab).size).toBe(vocab.length);
    const sorted = [...vocab].sort((a, b) => a.localeCompare(b, 'zh'));
    expect(vocab).toEqual(sorted);
  });

  it('mọi chuỗi harvest đều là Hán/CJK (nguồn chưa dịch)', () => {
    expect(vocab.every((value) => containsCjkText(value))).toBe(true);
  });

  it('bao gồm các mốc cố định: 12 trực, can chi, con giáp', () => {
    expect(vocab).toContain('建');
    expect(vocab).toContain('甲子');
    expect(vocab).toContain('鼠');
  });
});
