import { describe, expect, it } from 'vitest';
import { CJK_TEXT_PATTERN } from '$lib/text/cjk';
import { viCopy } from '$lib/i18n/vi';

describe('Numerology copy — bất biến ngôn ngữ', () => {
  it('mọi chuỗi trong viCopy.numerology không chứa ký tự CJK', () => {
    for (const [key, value] of Object.entries(viCopy.numerology)) {
      expect(CJK_TEXT_PATTERN.test(value), `viCopy.numerology.${key} = "${value}" không được chứa CJK`).toBe(false);
    }
  });
});
