// US-017e/f: chốt bất biến ngôn ngữ cho copy Xem Tướng (face) + Xem Tay (palm). Toàn bộ nhãn người
// dùng phải tiếng Việt Latin, 0 ký tự CJK (CJK_TEXT_PATTERN — guard runtime web).
import { describe, expect, it } from 'vitest';
import { CJK_TEXT_PATTERN } from '$lib/text/cjk';
import { viCopy } from '$lib/i18n/vi';

describe('Vision copy — bất biến ngôn ngữ (US-017e)', () => {
  it('mọi chuỗi trong viCopy.face không chứa ký tự CJK', () => {
    for (const [key, value] of Object.entries(viCopy.face)) {
      expect(CJK_TEXT_PATTERN.test(value), `viCopy.face.${key} = "${value}" không được chứa CJK`).toBe(false);
    }
  });

  it('mọi chuỗi trong viCopy.palm không chứa ký tự CJK', () => {
    for (const [key, value] of Object.entries(viCopy.palm)) {
      expect(CJK_TEXT_PATTERN.test(value), `viCopy.palm.${key} = "${value}" không được chứa CJK`).toBe(false);
    }
  });
});
