import { describe, expect, it } from 'vitest';
import {
  LENORMAND_SPREAD_CARD_COUNTS,
  lenormandDrawSchema,
  lenormandSpreadSchema,
} from './lenormand-draw';

describe('lenormandSpreadSchema', () => {
  it('parses the 5 spread keys', () => {
    for (const spread of ['single', 'three', 'relationship', 'decision', 'nine'] as const) {
      expect(lenormandSpreadSchema.safeParse(spread).success).toBe(true);
    }
  });

  it('rejects an unknown spread', () => {
    expect(lenormandSpreadSchema.safeParse('celtic').success).toBe(false);
  });

  it('has a card count for every spread', () => {
    for (const spread of lenormandSpreadSchema.options) {
      expect(LENORMAND_SPREAD_CARD_COUNTS[spread]).toBeGreaterThan(0);
    }
  });
});

describe('lenormandDrawSchema', () => {
  const validDraw = {
    question: 'Tôi nên tập trung điều gì?',
    spread: 'three' as const,
    spreadName: 'Chuỗi sự kiện ba lá bài',
    cards: [
      {
        id: 1,
        name: 'Kỵ Sĩ',
        keywords: ['Tin tức', 'Đến nơi'],
        meaning: 'Tin tức đến, mọi việc bắt đầu chuyển động.',
        position: 0,
        positionLabel: 'Nguyên nhân',
      },
    ],
    narrative: 'Bài đọc Lenormand.',
  };

  it('accepts a valid draw', () => {
    expect(lenormandDrawSchema.safeParse(validDraw).success).toBe(true);
  });

  it('rejects a card id outside 1..36', () => {
    const bad = { ...validDraw, cards: [{ ...validDraw.cards[0], id: 99 }] };
    expect(lenormandDrawSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects an empty narrative', () => {
    expect(lenormandDrawSchema.safeParse({ ...validDraw, narrative: '' }).success).toBe(false);
  });
});
