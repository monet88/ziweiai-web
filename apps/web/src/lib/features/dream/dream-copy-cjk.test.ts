import { describe, expect, it } from 'vitest';
import { viCopy } from '$lib/i18n/vi';

// Bất biến ngôn ngữ: nhãn UI hệ Giải mộng phải là tiếng Việt Latin, 0 ký tự CJK.
const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

describe('dream i18n copy (US-038)', () => {
  it('không chứa chữ Hán/CJK trong nhãn UI', () => {
    for (const [key, value] of Object.entries(viCopy.dream)) {
      expect(CJK_TEXT_PATTERN.test(value), `rò chữ Hán/CJK ở dream.${key}: "${value}"`).toBe(false);
    }
  });
});
