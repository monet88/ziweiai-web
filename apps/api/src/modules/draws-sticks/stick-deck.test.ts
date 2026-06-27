import { describe, expect, it } from 'vitest';
import { divinationStickSchema } from '@ziweiai/contracts';
import { drawStickDeterministic, STICK_DECK, STICK_COUNT } from './stick-deck';

const HAN_TEXT_PATTERN = /\p{Script=Han}/u;

describe('stick deck (US-039)', () => {
  it('có đủ 100 quẻ xăm', () => {
    expect(STICK_COUNT).toBe(100);
  });

  it('mọi quẻ parse qua contract schema', () => {
    for (const stick of STICK_DECK) {
      expect(divinationStickSchema.safeParse(stick).success, `quẻ ${stick.id}`).toBe(true);
    }
  });

  it('id quẻ duy nhất', () => {
    const ids = STICK_DECK.map((stick) => stick.id);
    expect(new Set(ids).size).toBe(STICK_DECK.length);
  });

  it('không chứa chữ Hán trong nội dung quẻ', () => {
    for (const stick of STICK_DECK) {
      const blob = [stick.title, stick.poem, stick.interpretation, stick.advice, stick.story ?? ''].join(' ');
      expect(HAN_TEXT_PATTERN.test(blob), `rò chữ Hán ở quẻ ${stick.id}`).toBe(false);
    }
  });

  it('drawStickDeterministic trả cùng quẻ với cùng seed', () => {
    expect(drawStickDeterministic('seed-1')).toEqual(drawStickDeterministic('seed-1'));
  });

  it('rút được quẻ hợp lệ (nằm trong bộ)', () => {
    const stick = drawStickDeterministic('seed-xyz');
    expect(STICK_DECK.some((candidate) => candidate.id === stick.id)).toBe(true);
  });
});
