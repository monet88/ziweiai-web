import { describe, expect, it } from 'vitest';
import { appendReferralQuery, sanitizeReferralCode } from './append-referral-query';

describe('sanitizeReferralCode', () => {
  it('chấp nhận mã alphanumeric 4–16 ký tự', () => {
    expect(sanitizeReferralCode('Ab12Cd34')).toBe('Ab12Cd34');
  });

  it('từ chối mã không hợp lệ', () => {
    expect(sanitizeReferralCode('!!')).toBeNull();
  });
});

describe('appendReferralQuery', () => {
  it('gắn ?ref= vào đường dẫn share/chart', () => {
    expect(appendReferralQuery('/share/charts/x', 'Ab12Cd34')).toBe('/share/charts/x?ref=Ab12Cd34');
    expect(appendReferralQuery('/charts/x', null)).toBe('/charts/x');
  });
});
