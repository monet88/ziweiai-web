import { describe, expect, it } from 'vitest';
import { matchDreamSymbols, DREAM_SYMBOL_COUNT } from './dream-symbol-matcher';

const HAN_TEXT_PATTERN = /\p{Script=Han}/u;

describe('dream symbol matcher (US-038)', () => {
  it('nạp đủ 56 biểu tượng', () => {
    expect(DREAM_SYMBOL_COUNT).toBe(56);
  });

  it('khớp biểu tượng theo từ khóa tiếng Việt (không phân biệt hoa thường)', () => {
    const matched = matchDreamSymbols('Đêm qua tôi mơ thấy một con RẮN bò trong vườn');
    expect(matched.length).toBeGreaterThan(0);
    expect(matched[0]?.keywords.some((kw) => kw.toLowerCase() === 'rắn')).toBe(true);
  });

  it('trả mảng rỗng khi không khớp biểu tượng nào', () => {
    expect(matchDreamSymbols('xyz qwerty không có biểu tượng gì cả')).toEqual([]);
  });

  it('không trả trùng biểu tượng và giới hạn tối đa 6', () => {
    const matched = matchDreamSymbols('rắn rồng cá mèo chó chim hổ ngựa nước lửa núi');
    expect(matched.length).toBeLessThanOrEqual(6);
    const firstKeywords = matched.map((s) => s.keywords[0]);
    expect(new Set(firstKeywords).size).toBe(firstKeywords.length);
  });

  it('không biểu tượng nào chứa chữ Hán', () => {
    for (const symbol of matchDreamSymbols('rắn rồng cá')) {
      const blob = [symbol.meaning, symbol.category, symbol.positive, symbol.negative, symbol.advice, ...symbol.keywords]
        .filter((v): v is string => typeof v === 'string')
        .join(' ');
      expect(HAN_TEXT_PATTERN.test(blob), `rò chữ Hán: ${blob}`).toBe(false);
    }
  });
});
