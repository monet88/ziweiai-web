import { describe, expect, it } from 'vitest';
import { drawDeterministic, TAROT_DECK } from './tarot-deck';

const HAN_TEXT_PATTERN = /\p{Script=Han}/u;

describe('tarot deck (US-017)', () => {
  it('có đủ 78 lá Rider-Waite', () => {
    expect(TAROT_DECK).toHaveLength(78);
  });

  it('không trùng id lá bài', () => {
    const ids = TAROT_DECK.map((card) => card.id);

    expect(new Set(ids).size).toBe(TAROT_DECK.length);
  });

  it('không chứa chữ Hán trong tên lá', () => {
    for (const card of TAROT_DECK) {
      expect(HAN_TEXT_PATTERN.test(card.name), `rò chữ Hán/CJK: ${card.name}`).toBe(false);
    }
  });

  it('drawDeterministic trả cùng kết quả với cùng seed', () => {
    expect(drawDeterministic('seed-1', 3)).toEqual(drawDeterministic('seed-1', 3));
  });

  it('không rút trùng lá trong một lượt draw', () => {
    const cards = drawDeterministic('spread-seed', 10);
    const ids = cards.map((card) => card.id);

    expect(new Set(ids).size).toBe(cards.length);
  });

  it('trả đúng số lá cho spread 3 lá và Celtic Cross', () => {
    expect(drawDeterministic('three-card', 3)).toHaveLength(3);
    expect(drawDeterministic('celtic-cross', 10)).toHaveLength(10);
  });
});
