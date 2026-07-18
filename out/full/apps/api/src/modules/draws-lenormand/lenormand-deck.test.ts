import { describe, expect, it } from 'vitest';
import {
  LENORMAND_DECK,
  drawLenormandDeterministic,
  getLenormandSpread,
} from './lenormand-deck';

const HAN_TEXT_PATTERN = /\p{Script=Han}/u;

describe('lenormand deck (US-037)', () => {
  it('có đủ 36 lá', () => {
    expect(LENORMAND_DECK).toHaveLength(36);
  });

  it('không trùng id lá', () => {
    const ids = LENORMAND_DECK.map((card) => card.id);
    expect(new Set(ids).size).toBe(LENORMAND_DECK.length);
  });

  it('không chứa chữ Hán trong tên/từ khóa/nghĩa lá (bất biến B6-0)', () => {
    for (const card of LENORMAND_DECK) {
      const blob = [card.name, card.meaning, ...card.keywords].join(' ');
      expect(HAN_TEXT_PATTERN.test(blob), `rò chữ Hán/CJK: ${blob}`).toBe(false);
    }
  });

  it('drawLenormandDeterministic trả cùng kết quả với cùng seed', () => {
    expect(drawLenormandDeterministic('seed-1', 5)).toEqual(drawLenormandDeterministic('seed-1', 5));
  });

  it('không rút trùng lá trong một lượt', () => {
    const cards = drawLenormandDeterministic('spread-seed', 9);
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
  });

  it('getLenormandSpread trả bố cục đúng số vị trí', () => {
    expect(getLenormandSpread('nine').positions).toHaveLength(9);
    expect(getLenormandSpread('single').positions).toHaveLength(1);
  });
});
