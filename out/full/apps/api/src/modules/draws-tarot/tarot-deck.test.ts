import { describe, expect, it } from 'vitest';
import { drawDeterministic, TAROT_DECK } from './tarot-deck';

const HAN_TEXT_PATTERN = /\p{Script=Han}/u;
const RNG_MAX_OUTPUT_SEED = String.fromCharCode(5_898, 63_488);
const ZERO_STATE_SEED = String.fromCharCode(60_881, 9_566, 45_958);

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

  it('không tạo chỉ số ngoài deck khi RNG trả uint32 tối đa', () => {
    const cards = drawDeterministic(RNG_MAX_OUTPUT_SEED, 3);

    expect(cards).toHaveLength(3);
    expect(cards[0]?.id).toBe('pentacles_king');
    expect(cards.every((card) => typeof card.id === 'string' && card.id.length > 0)).toBe(true);
  });

  it('sửa state 0 của xorshift để không rơi vào chuỗi suy biến', () => {
    const cards = drawDeterministic(ZERO_STATE_SEED, 3);

    expect(cards).toHaveLength(3);
    expect(cards.map((card) => card.id)).toEqual(['wands_three', 'cups_three', 'pentacles_seven']);
    expect(cards.some((card) => !card.reversed)).toBe(true);
  });
});
