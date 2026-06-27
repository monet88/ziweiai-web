import { describe, expect, it } from 'vitest';
import { viCopy } from '$lib/i18n/vi';

// Bat bien ngon ngu: nhan UI he Hoang lich phai la tieng Viet Latin, 0 ky tu CJK.
const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

describe('almanac i18n copy (US-040)', () => {
  it('khong chua chu Han/CJK trong nhan UI', () => {
    for (const [key, value] of Object.entries(viCopy.almanac)) {
      expect(CJK_TEXT_PATTERN.test(value), `ro chu Han/CJK o almanac.${key}: "${value}"`).toBe(false);
    }
  });
});
