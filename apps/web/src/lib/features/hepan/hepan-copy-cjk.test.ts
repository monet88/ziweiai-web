// US-017c: chốt bất biến ngôn ngữ cho copy Hợp Hôn. Mọi nhãn người dùng phải tiếng Việt Latin,
// 0 ký tự CJK (CJK_TEXT_PATTERN — guard runtime web). Thuật toán tương hợp có test CJK riêng
// trong @ziweiai/astro-engine (hepan-compatibility.test.ts).
import { describe, expect, it } from 'vitest';
import { CJK_TEXT_PATTERN } from '$lib/text/cjk';
import { viCopy } from '$lib/i18n/vi';

describe('Hợp Hôn copy — bất biến ngôn ngữ (US-017c)', () => {
  it('mọi chuỗi trong viCopy.hepan không chứa ký tự CJK', () => {
    for (const [key, value] of Object.entries(viCopy.hepan)) {
      expect(CJK_TEXT_PATTERN.test(value), `viCopy.hepan.${key} = "${value}" không được chứa CJK`).toBe(false);
    }
  });
});
