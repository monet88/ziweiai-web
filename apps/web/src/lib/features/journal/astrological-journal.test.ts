import { describe, it, expect } from 'vitest';
import {
  astrologicalJournalEntrySchema,
  createJournalEntryRequestSchema,
  astrologicalJournalListResponseSchema,
} from '@ziweiai/contracts';

describe('astrological-journal contracts and validation', () => {
  it('should validate a valid journal entry', () => {
    const validEntry = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: 'user-uuid-1',
      date: '2026-09-12',
      lunarDateStr: '15/08 Bính Ngọ',
      canChiDay: 'Giáp Dần',
      mood: 'HAN_HOAN',
      eventNotes: 'Một ngày làm việc hiệu quả và đắc ý.',
      actualRating: 5,
      resonanceScore: 88,
      resonanceInsight: 'Tâm thức hòa quyện tuyệt vời với khí vận ngày.',
      createdAt: '2026-09-12T08:00:00.000Z',
      updatedAt: '2026-09-12T08:00:00.000Z',
    };

    const parsed = astrologicalJournalEntrySchema.safeParse(validEntry);
    expect(parsed.success).toBe(true);
  });

  it('should validate journal list response schema with streak', () => {
    const response = {
      entries: [],
      currentStreakDays: 7,
      averageResonanceScore: 82,
      totalEntriesCount: 14,
    };

    const parsed = astrologicalJournalListResponseSchema.safeParse(response);
    expect(parsed.success).toBe(true);
  });

  it('should reject invalid date format in create request', () => {
    const invalidRequest = {
      date: '12-09-2026', // wrong format, expects YYYY-MM-DD
      mood: 'BINH_AN',
      eventNotes: 'Test note',
      actualRating: 4,
    };

    const parsed = createJournalEntryRequestSchema.safeParse(invalidRequest);
    expect(parsed.success).toBe(false);
  });
});
