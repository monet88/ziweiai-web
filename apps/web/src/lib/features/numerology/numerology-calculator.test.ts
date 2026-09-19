import { describe, expect, it } from 'vitest';
import {
  calculateNumerology,
  reduceToSingleDigit,
  removeVietnameseDiacritics,
} from './numerology-calculator';

describe('numerology calculator', () => {
  it('correctly reduces numbers while preserving master numbers 11, 22, 33', () => {
    expect(reduceToSingleDigit(15)).toBe(6); // 1 + 5 = 6
    expect(reduceToSingleDigit(29)).toBe(11); // 2 + 9 = 11 (Master)
    expect(reduceToSingleDigit(22)).toBe(22); // 22 (Master)
    expect(reduceToSingleDigit(33)).toBe(33); // 33 (Master)
    expect(reduceToSingleDigit(38)).toBe(11); // 3 + 8 = 11 (Master)
    expect(reduceToSingleDigit(49)).toBe(4); // 4 + 9 = 13 -> 1 + 3 = 4
  });

  it('correctly strips Vietnamese diacritics', () => {
    const raw = 'Nguyễn Đăng Khoa';
    const stripped = removeVietnameseDiacritics(raw);
    expect(stripped.toLowerCase()).toBe('nguyen dang khoa');
  });

  it('calculates 4 core numbers correctly for a sample profile', () => {
    // DOB: 1990-05-15 (Day: 15->6, Month: 5->5, Year: 1990->1+9+9+0=19->1+9=10->1) => 6+5+1 = 12 -> 3
    const dob = new Date(1990, 4, 15);
    const result = calculateNumerology('Nguyễn Văn An', dob);

    expect(result.lifePath).toBe(3);
    expect(result.destiny).toBeGreaterThan(0);
    expect(result.soulUrge).toBeGreaterThan(0);
    expect(result.personality).toBeGreaterThan(0);
  });
});
