import { describe, expect, it } from 'vitest';
import {
  numerologyExplainRequestSchema,
  numerologyExplainResponseSchema,
} from './numerology';

describe('numerology contracts', () => {
  it('validates a valid numerology explain request', () => {
    const valid = {
      lifePath: 7,
      destiny: 11,
      soulUrge: 3,
      personality: 8,
      fullName: 'Nguyễn Văn A',
    };
    const parsed = numerologyExplainRequestSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid request with empty name or non-positive numbers', () => {
    const invalid = {
      lifePath: 0,
      destiny: 11,
      soulUrge: 3,
      personality: 8,
      fullName: '   ',
    };
    const parsed = numerologyExplainRequestSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates a valid numerology explain response', () => {
    const valid = { narrative: 'Bản luận giải Thần số học chi tiết...' };
    const parsed = numerologyExplainResponseSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });
});
