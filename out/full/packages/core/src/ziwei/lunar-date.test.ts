import { describe, expect, it } from 'vitest';
import { CJK_TEXT_PATTERN } from '../text/cjk-guard';
import { normalizeLegacyLunarDate, toSexagenaryYearVi } from './lunar-date';

describe('normalizeLegacyLunarDate', () => {
  it('formats a Han lunar date into a numeric Vietnamese string', () => {
    expect(normalizeLegacyLunarDate('二〇〇〇年十一月初一')).toBe('01/11/2000 Canh Thìn');
  });

  it('parses month 11/12 without cross-matching shorter month keys', () => {
    expect(normalizeLegacyLunarDate('二〇〇〇年十二月三十')).toBe('30/12/2000 Canh Thìn');
  });

  it('keeps the leap-month flag by stripping the 闰 prefix', () => {
    expect(normalizeLegacyLunarDate('一九九二年闰十一月初一')).toBe('01/11/1992 (nhuận) Nhâm Thân');
  });

  it('returns the original value when the string is not a known Han lunar date', () => {
    expect(normalizeLegacyLunarDate('01/01/1990')).toBe('01/01/1990');
    expect(normalizeLegacyLunarDate('not-a-date')).toBe('not-a-date');
  });

  it('produces no Han characters for a recognized lunar date', () => {
    expect(normalizeLegacyLunarDate('二〇〇五年腊月初一')).not.toMatch(CJK_TEXT_PATTERN);
  });
});

describe('toSexagenaryYearVi', () => {
  it('maps a year to its heavenly stem and earthly branch', () => {
    expect(toSexagenaryYearVi(1992)).toBe('Nhâm Thân');
    expect(toSexagenaryYearVi(2000)).toBe('Canh Thìn');
  });
});
