import { describe, expect, it } from 'vitest';
import { viCopy } from '$lib/i18n/vi';

// Bat bien ngon ngu: nhan UI he Xin xam phai la tieng Viet Latin, 0 ky tu CJK.
const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

describe('stick i18n copy (US-039)', () => {
  it('khong chua chu Han/CJK trong nhan UI', () => {
    for (const [key, value] of Object.entries(viCopy.stick)) {
      expect(CJK_TEXT_PATTERN.test(value), `ro chu Han/CJK o stick.${key}: "${value}"`).toBe(false);
    }
  });
});
