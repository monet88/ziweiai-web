import { describe, expect, it } from 'vitest';
import { pairingRequestSchema, pairingCompatibilitySchema } from './pairing-snapshot';

// birthInput hợp lệ tối thiểu (shape khớp birthInputSchema, dùng lại từ backend-api.test).
const validBirth = {
  calendar: 'gregorian' as const,
  date: { year: 1990, month: 1, day: 1, isLeapMonth: null },
  time: { hour: 8, minute: 30, isUnknown: false },
  sexOrGenderForChart: 'female' as const,
  place: {
    label: 'Ho Chi Minh City',
    manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
  },
  locale: 'vi-VN',
  source: 'user-entered',
};

describe('US-017c pairing schemas', () => {
  it('pairingRequestSchema chấp nhận 2 birth-input + relationType hợp lệ', () => {
    const ok = { primary: validBirth, partner: validBirth, relationType: 'love' };
    expect(pairingRequestSchema.safeParse(ok).success).toBe(true);
  });

  it('pairingRequestSchema từ chối khi thiếu partner', () => {
    const bad = { primary: validBirth, relationType: 'love' };
    expect(pairingRequestSchema.safeParse(bad).success).toBe(false);
  });

  it('pairingRequestSchema từ chối relationType lạ', () => {
    const bad = { primary: validBirth, partner: validBirth, relationType: 'enemy' };
    expect(pairingRequestSchema.safeParse(bad).success).toBe(false);
  });

  it('pairingCompatibilitySchema yêu cầu overallScore + ít nhất 1 dimension + narrative', () => {
    const ok = {
      overallScore: 72,
      level: 'Khá hợp',
      dimensions: [{ name: 'Ngũ hành phối hợp', score: 80, description: 'Tương sinh, hỗ trợ nhau.' }],
      narrative: 'Nền tảng tương hợp tốt.',
    };
    expect(pairingCompatibilitySchema.safeParse(ok).success).toBe(true);

    const noDimensions = { ...ok, dimensions: [] };
    expect(pairingCompatibilitySchema.safeParse(noDimensions).success).toBe(false);

    const scoreTooHigh = { ...ok, overallScore: 120 };
    expect(pairingCompatibilitySchema.safeParse(scoreTooHigh).success).toBe(false);
  });
});
