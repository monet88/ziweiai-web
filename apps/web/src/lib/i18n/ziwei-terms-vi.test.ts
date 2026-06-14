import { describe, expect, it } from 'vitest';
import { CJK_TEXT_PATTERN } from '../text/cjk';
import { translateZiweiKey, tryTranslateZiweiKey, ziweiTermsVi } from './ziwei-terms-vi';

// Mọi giá trị trong từ điển phải là tiếng Việt — không một ký tự CJK nào lọt vào.
describe('ziweiTermsVi dictionary integrity', () => {
  it('contains no CJK characters (Han/Kana/Hangul/fullwidth) in any translation value', () => {
    const joined = Object.values(ziweiTermsVi).join('|');
    expect(joined).not.toMatch(CJK_TEXT_PATTERN);
  });

  it('covers every brightness, mutagen, stem and branch key the engine can emit', () => {
    const requiredKeys = [
      'miao',
      'wang',
      'de',
      'li',
      'ping',
      'bu',
      'xian',
      'lu',
      'quyen',
      'khoa',
      'ky',
      'jiaHeavenly',
      'guiHeavenly',
      'ziEarthly',
      'haiEarthly',
      'soulPalace',
      'originalPalace',
      'ziweiMaj',
      'water2nd',
    ];

    for (const key of requiredKeys) {
      expect(tryTranslateZiweiKey(key), `missing VN translation for ${key}`).toBeTruthy();
    }
  });

  it('translates the corrected brightness term xian as "Hãm"', () => {
    expect(translateZiweiKey('xian')).toBe('Hãm');
  });
});

describe('translateZiweiKey fail-fast', () => {
  it('throws on a missing key during dev/test instead of leaking a raw token', () => {
    expect(() => translateZiweiKey('definitelyMissingKey')).toThrowError(/Thiếu bản dịch/);
  });
});
