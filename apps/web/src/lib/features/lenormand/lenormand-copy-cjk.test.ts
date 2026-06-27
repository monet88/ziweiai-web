import { describe, expect, it } from 'vitest';
import { viCopy } from '$lib/i18n/vi';

// US-037: chốt bất biến ngôn ngữ — toàn bộ nhãn UI Lenormand là tiếng Việt Latin, 0 ký tự CJK.
const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

describe('lenormand copy (US-037)', () => {
  it('không chứa chữ Hán/CJK trong nhãn UI', () => {
    for (const [key, value] of Object.entries(viCopy.lenormand)) {
      expect(CJK_TEXT_PATTERN.test(value), `rò chữ Hán/CJK ở lenormand.${key}: "${value}"`).toBe(false);
    }
  });
});
