import { describe, expect, it } from 'vitest';
import { viCopy } from '$lib/i18n/vi';

// Invariant kiểm tra: UI tiếng Việt không được chứa chữ Hán/CJK
const CJK_TEXT_PATTERN = /\p{Script=Han}/u;

describe('chuvanvuong i18n copy', () => {
  it('không chứa chữ Hán/CJK trong nhãn UI', () => {
    for (const [key, value] of Object.entries(viCopy.chuvanvuong)) {
      const text = String(value);
      expect(CJK_TEXT_PATTERN.test(text), `Rò chữ Hán/CJK ở chuvanvuong.${key}: "${text}"`).toBe(false);
    }
  });
});
