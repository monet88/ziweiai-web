// US-017h: chốt bất biến ngôn ngữ cho copy Tarot. Toàn bộ nhãn người dùng phải tiếng Việt Latin,
// 0 ký tự CJK (CJK_TEXT_PATTERN — guard runtime web). Đồng thời chốt nhãn tên lá trong deck
// backend (TAROT_DECK) cũng không lọt chữ Hán.
import { describe, expect, it } from 'vitest';
import { CJK_TEXT_PATTERN } from '$lib/text/cjk';
import { viCopy } from '$lib/i18n/vi';

describe('Tarot copy — bất biến ngôn ngữ (US-017h)', () => {
  it('mọi chuỗi trong viCopy.tarot không chứa ký tự CJK', () => {
    for (const [key, value] of Object.entries(viCopy.tarot)) {
      expect(CJK_TEXT_PATTERN.test(value), `viCopy.tarot.${key} = "${value}" không được chứa CJK`).toBe(false);
    }
  });
});
