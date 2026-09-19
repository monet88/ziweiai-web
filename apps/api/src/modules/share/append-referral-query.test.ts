import { describe, expect, it } from 'vitest';
import { appendReferralQuery, sanitizeReferralCode } from './append-referral-query';

describe('sanitizeReferralCode', () => {
  it('chấp nhận mã alphanumeric 4–16 ký tự và chuẩn hóa uppercase', () => {
    expect(sanitizeReferralCode('Ab12Cd34')).toBe('AB12CD34');
    expect(sanitizeReferralCode('  CODE1234  ')).toBe('CODE1234');
    expect(sanitizeReferralCode('smokeref1')).toBe('SMOKEREF1');
  });

  it('từ chối mã không hợp lệ', () => {
    expect(sanitizeReferralCode(null)).toBeNull();
    expect(sanitizeReferralCode('')).toBeNull();
    expect(sanitizeReferralCode('ab')).toBeNull();
    expect(sanitizeReferralCode('bad code!')).toBeNull();
    expect(sanitizeReferralCode('a'.repeat(17))).toBeNull();
    expect(sanitizeReferralCode(['Ab12Cd34'])).toBeNull();
  });
});

describe('appendReferralQuery', () => {
  it('gắn ?ref= khi URL chưa có query', () => {
    expect(appendReferralQuery('https://tuvitoantap.vercel.app/charts/x', 'Ab12Cd34')).toBe(
      'https://tuvitoantap.vercel.app/charts/x?ref=AB12CD34',
    );
  });

  it('gắn &ref= khi URL đã có query', () => {
    expect(appendReferralQuery('https://example.com/charts/x?foo=1', 'Ab12Cd34')).toBe(
      'https://example.com/charts/x?foo=1&ref=AB12CD34',
    );
  });

  it('giữ nguyên URL khi ref invalid/missing', () => {
    const base = 'https://tuvitoantap.vercel.app/charts/x';
    expect(appendReferralQuery(base, null)).toBe(base);
    expect(appendReferralQuery(base, '!!')).toBe(base);
    expect(appendReferralQuery(base, ['Ab12Cd34'])).toBe(base);
  });
});
