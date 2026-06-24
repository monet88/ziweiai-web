import { describe, expect, it } from 'vitest';
import { mbtiQuestionSchema } from './mbti-result';
import { MBTI_QUESTIONS, MBTI_QUESTION_BY_ID } from './mbti-questions';

// Đồng bộ apps/web/src/lib/text/cjk.ts: chặn Hán + Hiragana/Katakana/Hangul/Bopomofo + dấu câu
// CJK + fullwidth. Bộ câu hỏi đã dịch tiếng Việt nên KHÔNG được rò bất kỳ ký tự CJK nào.
const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

describe('MBTI_QUESTIONS (US-017b)', () => {
  it('mỗi câu hỏi hợp lệ theo mbtiQuestionSchema', () => {
    for (const question of MBTI_QUESTIONS) {
      expect(mbtiQuestionSchema.safeParse(question).success, `câu ${question.id} phải hợp lệ`).toBe(true);
    }
  });

  it('id duy nhất và map tra cứu khớp số lượng', () => {
    const ids = new Set(MBTI_QUESTIONS.map((q) => q.id));
    expect(ids.size).toBe(MBTI_QUESTIONS.length);
    expect(MBTI_QUESTION_BY_ID.size).toBe(MBTI_QUESTIONS.length);
  });

  it('mỗi trục có đủ câu (>= 4) để scoring có nghĩa', () => {
    const perAxis: Record<string, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };
    for (const question of MBTI_QUESTIONS) {
      perAxis[question.axis] += 1;
    }
    for (const axis of ['EI', 'SN', 'TF', 'JP'] as const) {
      expect(perAxis[axis], `trục ${axis} phải có >= 4 câu`).toBeGreaterThanOrEqual(4);
    }
  });

  it('hai lựa chọn của mỗi câu nằm đúng hai cực của trục câu đó', () => {
    const poles: Record<string, [string, string]> = { EI: ['E', 'I'], SN: ['S', 'N'], TF: ['T', 'F'], JP: ['J', 'P'] };
    for (const question of MBTI_QUESTIONS) {
      const [a, b] = poles[question.axis];
      const dims = [question.choiceA.dimension, question.choiceB.dimension].sort();
      expect([a, b].sort(), `câu ${question.id} phải đo đúng trục ${question.axis}`).toEqual(dims);
    }
  });

  it('không rò chữ Hán/CJK trong toàn bộ text câu hỏi (bất biến ngôn ngữ)', () => {
    for (const question of MBTI_QUESTIONS) {
      const texts = [question.text, question.choiceA.text, question.choiceB.text];
      for (const text of texts) {
        expect(CJK_TEXT_PATTERN.test(text), `text "${text}" không được chứa CJK`).toBe(false);
      }
    }
  });
});

