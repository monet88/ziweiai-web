import { describe, expect, it } from 'vitest';
import type { HoroscopeFrame } from '@ziweiai/contracts';
import { buildPalaceFlowFlags, buildPalaceFlowFlagsMap } from './palace-flow-flags';
import type { PalaceView } from './palace-view-builder';

function palace(index: number, overrides: Partial<PalaceView> = {}): PalaceView {
  return {
    nameKey: `palace-${index}`,
    name: `Cung ${index}`,
    index,
    earthlyBranchKey: 'ziEarthly',
    stemBranch: 'Giáp Tý',
    isBodyPalace: false,
    isOriginalPalace: false,
    changsheng: null,
    decadalRange: '24–33',
    ages: [],
    majorStars: [],
    minorStars: [],
    adjectiveStars: [],
    ...overrides,
  };
}

function item(index: number): HoroscopeFrame['decadal'] {
  return {
    index,
    heavenlyStemKey: 'jiaHeavenly',
    earthlyBranchKey: 'ziEarthly',
    palaceNameKeys: [],
    mutagenStarKeys: [],
  };
}

const fullFrame: HoroscopeFrame = {
  decadal: item(0),
  age: { index: 0, nominalAge: 36 },
  yearly: item(1),
  monthly: item(2),
  daily: item(0),
};

describe('buildPalaceFlowFlags', () => {
  it('trả 4 tầng khi 1 cung trùng cả 4 (decadal+daily ở index 0, +yearly/monthly nếu trùng)', () => {
    // index 0 khớp decadal + daily; thêm 1 frame mà cả 4 cùng index 0:
    const allSame: HoroscopeFrame = {
      decadal: item(0),
      age: { index: 0, nominalAge: 36 },
      yearly: item(0),
      monthly: item(0),
      daily: item(0),
    };
    const flags = buildPalaceFlowFlags(palace(0), allSame);
    expect(flags.decadal).toEqual({ stemBranch: 'Giáp Tý', agesRange: '24–33' });
    expect(flags.yearly).toEqual({ stemBranch: 'Giáp Tý' });
    expect(flags.monthly).toEqual({ stemBranch: 'Giáp Tý' });
    expect(flags.daily).toEqual({ stemBranch: 'Giáp Tý' });
  });

  it('chỉ trả decadal khi cung chỉ khớp tầng đại vận', () => {
    const flags = buildPalaceFlowFlags(palace(0), { ...fullFrame, daily: item(9) });
    expect(flags.decadal).toBeDefined();
    expect(flags.yearly).toBeUndefined();
    expect(flags.monthly).toBeUndefined();
    expect(flags.daily).toBeUndefined();
  });

  it('trả {} khi không tầng nào khớp', () => {
    const flags = buildPalaceFlowFlags(palace(7), fullFrame);
    expect(flags).toEqual({});
  });

  it('bỏ qua monthly/daily khi frame thiếu (snapshot legacy chỉ decadal/yearly)', () => {
    const legacy: HoroscopeFrame = {
      decadal: item(0),
      age: { index: 0, nominalAge: 36 },
      yearly: item(0),
    };
    const flags = buildPalaceFlowFlags(palace(0), legacy);
    expect(flags.decadal).toBeDefined();
    expect(flags.yearly).toBeDefined();
    expect(flags.monthly).toBeUndefined();
    expect(flags.daily).toBeUndefined();
  });

  it('agesRange null khi PalaceView không có decadalRange', () => {
    const flags = buildPalaceFlowFlags(palace(0, { decadalRange: null }), fullFrame);
    expect(flags.decadal).toEqual({ stemBranch: 'Giáp Tý', agesRange: null });
  });

  it('throw khi can-chi key lạ (fail-fast translateZiweiKey)', () => {
    const badFrame: HoroscopeFrame = {
      ...fullFrame,
      decadal: { ...item(0), heavenlyStemKey: 'khongTonTai_xyz' },
    };
    expect(() => buildPalaceFlowFlags(palace(0), badFrame)).toThrow();
  });
});

describe('buildPalaceFlowFlagsMap', () => {
  it('trả map rỗng khi frame null', () => {
    expect(buildPalaceFlowFlagsMap([palace(0), palace(1)], null).size).toBe(0);
  });

  it('chỉ chứa ô có ≥ 1 tầng khớp', () => {
    const palaces = [palace(0), palace(1), palace(5)];
    const map = buildPalaceFlowFlagsMap(palaces, fullFrame);
    expect(map.has(0)).toBe(true); // decadal + daily
    expect(map.has(1)).toBe(true); // yearly
    expect(map.has(2)).toBe(false); // monthly ở index 2 nhưng không có palace index 2
    expect(map.has(5)).toBe(false);
  });
});
