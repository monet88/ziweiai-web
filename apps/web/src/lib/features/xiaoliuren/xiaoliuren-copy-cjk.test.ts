import { describe, expect, it } from 'vitest';
import { viCopy } from '$lib/i18n/vi';

// Bất biến ngôn ngữ: nhãn UI hệ Tiểu Lục Nhâm phải là tiếng Việt Latin, 0 ký tự CJK.
const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

describe('xiaoliuren i18n copy (Issue #65)', () => {
  it('khong chua chu Han/CJK trong nhan UI', () => {
    for (const [key, value] of Object.entries(viCopy.xiaoliuren)) {
      const text = String(value);
      expect(CJK_TEXT_PATTERN.test(text), `ro chu Han/CJK o xiaoliuren.${key}: "${text}"`).toBe(false);
    }
  });
});
