import { describe, expect, it } from 'vitest';
import { shouldUseWidePalaceGrid } from './palace-grid-layout';
import type { PalaceView } from './palace-view-builder';

function createPalace(branchKey: string): PalaceView {
  return {
    nameKey: 'soulPalace',
    name: 'Mệnh',
    index: 0,
    earthlyBranchKey: branchKey,
    stemBranch: 'Giáp Tý',
    isBodyPalace: false,
    isOriginalPalace: false,
    changsheng: null,
    decadalRange: null,
    ages: [],
    majorStars: [],
    minorStars: [],
    adjectiveStars: [],
  };
}

describe('palace grid layout', () => {
  it('keeps wide layout only for canonical ziwei earthly branches', () => {
    expect(shouldUseWidePalaceGrid(true, [createPalace('ziEarthly'), createPalace('chouEarthly')])).toBe(true);
    expect(shouldUseWidePalaceGrid(true, [createPalace('legacyEarthlyBranch0')])).toBe(false);
    expect(shouldUseWidePalaceGrid(false, [createPalace('ziEarthly')])).toBe(false);
  });
});
