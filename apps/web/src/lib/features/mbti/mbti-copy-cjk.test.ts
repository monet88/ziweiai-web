// US-017b: chốt bất biến ngôn ngữ cho copy MBTI. Toàn bộ nhãn người dùng phải tiếng Việt
// Latin, 0 ký tự CJK (dùng CJK_TEXT_PATTERN — guard runtime web). Bộ câu hỏi MBTI_QUESTIONS
// đã có test CJK riêng trong @ziweiai/contracts (mbti-questions.test.ts).
import { describe, expect, it } from 'vitest';
import { CJK_TEXT_PATTERN } from '$lib/text/cjk';
import { viCopy } from '$lib/i18n/vi';

describe('MBTI copy — bất biến ngôn ngữ (US-017b)', () => {
  it('mọi chuỗi trong viCopy.mbti không chứa ký tự CJK', () => {
    for (const [key, value] of Object.entries(viCopy.mbti)) {
      expect(CJK_TEXT_PATTERN.test(value), `viCopy.mbti.${key} = "${value}" không được chứa CJK`).toBe(false);
    }
  });
});
