// Tam phương tứ chính tính thuần trên index vòng 0–11. Test phủ: thứ tự trả về
// [self, +6, +4, -4], wrap quanh vòng (kể cả -4 thành số âm), và quan hệ đối xứng/membership.
import { describe, expect, it } from 'vitest';
import { getPalaceAspectIndices, isPalaceInAspect } from './palace-aspect';

describe('getPalaceAspectIndices', () => {
  it('trả [self, +6, +4, -4] cho cung giữa vòng (không wrap)', () => {
    expect(getPalaceAspectIndices(5)).toEqual([5, 11, 9, 1]);
  });

  it('wrap quanh vòng 12 cho index 0 (-4 → 8, +6 → 6, +4 → 4)', () => {
    expect(getPalaceAspectIndices(0)).toEqual([0, 6, 4, 8]);
  });

  it('wrap đúng ở cuối vòng (index 10)', () => {
    expect(getPalaceAspectIndices(10)).toEqual([10, 4, 2, 6]);
  });

  it('chuẩn hoá index ngoài khoảng về vòng 0–11', () => {
    expect(getPalaceAspectIndices(12)).toEqual(getPalaceAspectIndices(0));
    expect(getPalaceAspectIndices(-1)).toEqual(getPalaceAspectIndices(11));
  });
});

describe('isPalaceInAspect', () => {
  it('chính cung và đối cung đều thuộc aspect của nhau', () => {
    expect(isPalaceInAspect(2, 2)).toBe(true);
    expect(isPalaceInAspect(2, 8)).toBe(true); // đối cung +6
    expect(isPalaceInAspect(8, 2)).toBe(true); // đối xứng
  });

  it('tam hợp (+4 / -4) thuộc aspect', () => {
    expect(isPalaceInAspect(2, 6)).toBe(true);
    expect(isPalaceInAspect(2, 10)).toBe(true);
  });

  it('cung ngoài tam phương tứ chính trả false', () => {
    expect(isPalaceInAspect(2, 3)).toBe(false);
    expect(isPalaceInAspect(2, 5)).toBe(false);
  });
});
