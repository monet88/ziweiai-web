import { describe, expect, it } from 'vitest';
import { getStarColors, getStarTitle, MINOR_MALEFIC_KEYS } from './star-color';
import type { StarTokenView } from './palace-view-builder';

describe('getStarColors (US-012)', () => {
  it('returns nulls for star without brightness/mutagen (legacy or minimal)', () => {
    const star: StarTokenView = {
      key: 'ziweiMaj',
      name: 'Tử Vi',
      group: 'major',
      brightness: null,
      mutagen: null,
    };

    const result = getStarColors(star);
    expect(result.nameColor).toBeNull();
    expect(result.brightnessColor).toBeNull();
    expect(result.mutagenColor).toBeNull();
    expect(result.isMalefic).toBe(false);
  });

  it('maps all 7 brightness keys to CSS var tokens', () => {
    const brightnessKeys = ['miao', 'wang', 'de', 'li', 'ping', 'bu', 'xian'] as const;
    for (const bk of brightnessKeys) {
      const star: StarTokenView = {
        key: 'test',
        name: 'Test',
        group: 'major',
        brightness: 'X',
        mutagen: null,
        brightnessKey: bk,
      };
      const result = getStarColors(star);
      expect(result.brightnessColor).toBe(`var(--star-brightness-${bk})`);
    }
  });

  it('maps all 4 mutagen keys to CSS var tokens', () => {
    const mutagenKeys = ['lu', 'quyen', 'khoa', 'ky'] as const;
    for (const mk of mutagenKeys) {
      const star: StarTokenView = {
        key: 'test',
        name: 'Test',
        group: 'major',
        brightness: null,
        mutagen: 'X',
        mutagenKey: mk,
      };
      const result = getStarColors(star);
      expect(result.mutagenColor).toBe(`var(--star-mutagen-${mk})`);
    }
  });

  it('marks minor malefic stars as isMalefic and provides nameColor', () => {
    for (const key of MINOR_MALEFIC_KEYS) {
      const star: StarTokenView = {
        key,
        name: 'Hung Tinh',
        group: 'minor',
        brightness: null,
        mutagen: null,
      };
      const result = getStarColors(star);
      expect(result.isMalefic).toBe(true);
      expect(result.nameColor).toBe('var(--star-malefic-name)');
    }
  });

  it('does not mark non-malefic minor stars as malefic', () => {
    const star: StarTokenView = {
      key: 'zuofuMin',
      name: 'Tả Phù',
      group: 'minor',
      brightness: null,
      mutagen: null,
    };
    const result = getStarColors(star);
    expect(result.isMalefic).toBe(false);
    expect(result.nameColor).toBeNull();
  });

  it('combines brightness + mutagen colors for a star that has both', () => {
    const star: StarTokenView = {
      key: 'ziweiMaj',
      name: 'Tử Vi',
      group: 'major',
      brightness: 'Miếu',
      mutagen: 'Lộc',
      brightnessKey: 'miao',
      mutagenKey: 'lu',
    };
    const result = getStarColors(star);
    expect(result.brightnessColor).toBe('var(--star-brightness-miao)');
    expect(result.mutagenColor).toBe('var(--star-mutagen-lu)');
    expect(result.isMalefic).toBe(false);
  });
});

describe('getStarTitle (US-012)', () => {
  it('returns undefined when no brightness and no mutagen', () => {
    const star: StarTokenView = {
      key: 'test',
      name: 'Test',
      group: 'major',
      brightness: null,
      mutagen: null,
    };
    expect(getStarTitle(star)).toBeUndefined();
  });

  it('builds Vietnamese tooltip for brightness only', () => {
    const star: StarTokenView = {
      key: 'test',
      name: 'Test',
      group: 'major',
      brightness: 'Miếu',
      mutagen: null,
      brightnessKey: 'miao',
    };
    const title = getStarTitle(star);
    expect(title).toBe('Miếu — sáng nhất');
  });

  it('builds Vietnamese tooltip for mutagen only', () => {
    const star: StarTokenView = {
      key: 'test',
      name: 'Test',
      group: 'major',
      brightness: null,
      mutagen: 'Lộc',
      mutagenKey: 'lu',
    };
    const title = getStarTitle(star);
    expect(title).toBe('Lộc — tài lộc, hanh thông');
  });

  it('joins brightness + mutagen with middle dot when both present', () => {
    const star: StarTokenView = {
      key: 'test',
      name: 'Test',
      group: 'major',
      brightness: 'Vượng',
      mutagen: 'Kỵ',
      brightnessKey: 'wang',
      mutagenKey: 'ky',
    };
    const title = getStarTitle(star);
    expect(title).toBe('Vượng — rất sáng · Kỵ — trở ngại, cần thận trọng');
  });
});
