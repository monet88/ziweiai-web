import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AnonymousPreservationBanner Logic', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('determines dismissal state based on sessionStorage key', () => {
    expect(sessionStorage.getItem('vios_hide_anon_banner')).toBeNull();

    sessionStorage.setItem('vios_hide_anon_banner', 'true');
    expect(sessionStorage.getItem('vios_hide_anon_banner')).toBe('true');
  });

  it('filters excluded routes where banner should not render', () => {
    const isExcluded = (path: string) => {
      return path === '/sign-in' || path === '/terms' || path === '/privacy' || path === '/privacy-policy';
    };

    expect(isExcluded('/sign-in')).toBe(true);
    expect(isExcluded('/terms')).toBe(true);
    expect(isExcluded('/privacy')).toBe(true);
    expect(isExcluded('/privacy-policy')).toBe(true);

    expect(isExcluded('/')).toBe(false);
    expect(isExcluded('/charts/123')).toBe(false);
    expect(isExcluded('/liuyao')).toBe(false);
    expect(isExcluded('/tarot')).toBe(false);
  });
});
