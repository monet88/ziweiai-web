import { describe, expect, it } from 'vitest';
import type { HoroscopeScope } from '@ziweiai/contracts';
import { buildHoroscopeQueryOptions, formatAsOf } from './horoscope-query';

const YEARLY: HoroscopeScope[] = ['yearly'];
const MONTHLY: HoroscopeScope[] = ['monthly'];

describe('formatAsOf', () => {
  it('dựng ISO YYYY-MM-DD với padding (local, không toISOString)', () => {
    expect(formatAsOf(2026, 6, 15)).toBe('2026-06-15');
    expect(formatAsOf(2026, 1, 5)).toBe('2026-01-05');
    expect(formatAsOf(2026, 12, 31)).toBe('2026-12-31');
  });
});

describe('buildHoroscopeQueryOptions — queryKey', () => {
  function base() {
    return {
      token: 'tok-1',
      chartId: 'chart-1',
      asOf: '2026-06-15',
      scopes: YEARLY,
      isAuthenticated: true,
    };
  }

  it('queryKey gắn token + chartId + asOf + scopes (tách cache theo phiên)', () => {
    const opts = buildHoroscopeQueryOptions(base());
    expect(opts.queryKey).toEqual(['horoscope', 'tok-1', 'chart-1', '2026-06-15', 'yearly']);
  });

  it('queryKey đổi khi asOf đổi → refetch', () => {
    const a = buildHoroscopeQueryOptions({ ...base(), asOf: '2026-06-15' });
    const b = buildHoroscopeQueryOptions({ ...base(), asOf: '2027-06-15' });
    expect(a.queryKey).not.toEqual(b.queryKey);
  });

  it('queryKey đổi khi scopes đổi (yearly vs monthly không cache chéo)', () => {
    const y = buildHoroscopeQueryOptions({ ...base(), scopes: YEARLY });
    const m = buildHoroscopeQueryOptions({ ...base(), scopes: MONTHLY });
    expect(y.queryKey).not.toEqual(m.queryKey);
  });

  it('queryKey đổi khi token đổi (đổi user không tái dùng frame cũ)', () => {
    const a = buildHoroscopeQueryOptions({ ...base(), token: 'tok-1' });
    const b = buildHoroscopeQueryOptions({ ...base(), token: 'tok-2' });
    expect(a.queryKey).not.toEqual(b.queryKey);
  });
});

describe('buildHoroscopeQueryOptions — enabled guard', () => {
  function base() {
    return {
      token: 'tok-1' as string | null,
      chartId: 'chart-1',
      asOf: '2026-06-15' as string | null,
      scopes: YEARLY,
      isAuthenticated: true,
    };
  }

  it('enabled = true khi đủ token + chartId + asOf + authenticated', () => {
    expect(buildHoroscopeQueryOptions(base()).enabled).toBe(true);
  });

  it('enabled = false khi chưa có token', () => {
    expect(buildHoroscopeQueryOptions({ ...base(), token: null }).enabled).toBe(false);
  });

  it('enabled = false khi asOf = null (tầng chưa chọn)', () => {
    expect(buildHoroscopeQueryOptions({ ...base(), asOf: null }).enabled).toBe(false);
  });

  it('enabled = false khi chưa authenticated', () => {
    expect(buildHoroscopeQueryOptions({ ...base(), isAuthenticated: false }).enabled).toBe(false);
  });

  it('enabled = false khi chartId rỗng', () => {
    expect(buildHoroscopeQueryOptions({ ...base(), chartId: '' }).enabled).toBe(false);
  });
});
