import { describe, expect, it } from 'vitest';
import { shouldUseSquareBoard } from './palace-grid-layout';
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
  it('dùng bàn vuông khi mọi cung có địa chi Tử Vi chuẩn (không phụ thuộc bề rộng)', () => {
    expect(shouldUseSquareBoard([createPalace('ziEarthly'), createPalace('chouEarthly')])).toBe(true);
  });

  it('legacy thiếu địa chi chuẩn → fallback lưới index', () => {
    expect(shouldUseSquareBoard([createPalace('legacyEarthlyBranch0')])).toBe(false);
  });

  it('mảng cung rỗng → false', () => {
    expect(shouldUseSquareBoard([])).toBe(false);
  });
});
