import { describe, expect, it } from 'vitest';
import { mbtiQuestionSchema, mbtiQuizRequestSchema } from './mbti-result';

describe('US-017b MBTI quiz schemas', () => {
  it('mbtiQuizRequestSchema chấp nhận mảng answers hợp lệ', () => {
    const ok = {
      answers: [
        { questionId: 'q1', choice: 1 },
        { questionId: 'q2', choice: 4 },
        { questionId: 'q3', choice: 7 },
        { questionId: 'q4', choice: 5 },
      ],
    };
    expect(mbtiQuizRequestSchema.safeParse(ok).success).toBe(true);
  });

  it('mbtiQuizRequestSchema từ chối khi quá ít câu trả lời', () => {
    const tooFew = { answers: [{ questionId: 'q1', choice: 1 }] };
    expect(mbtiQuizRequestSchema.safeParse(tooFew).success).toBe(false);
  });

  it('mbtiQuizRequestSchema từ chối choice ngoài thang Likert 1..7', () => {
    const bad = {
      answers: [
        { questionId: 'q1', choice: 0 },
        { questionId: 'q2', choice: 4 },
        { questionId: 'q3', choice: 7 },
        { questionId: 'q4', choice: 5 },
      ],
    };
    expect(mbtiQuizRequestSchema.safeParse(bad).success).toBe(false);
  });

  it('mbtiQuestionSchema parse câu hỏi hợp lệ và từ chối dimension lạ', () => {
    const ok = {
      id: 'q1',
      axis: 'JP',
      text: 'Khi đi chơi cả ngày, bạn sẽ',
      choiceA: { dimension: 'J', text: 'Lên kế hoạch trước' },
      choiceB: { dimension: 'P', text: 'Thích gì làm nấy' },
    };
    expect(mbtiQuestionSchema.safeParse(ok).success).toBe(true);

    const badDim = { ...ok, choiceA: { dimension: 'X', text: 'sai' } };
    expect(mbtiQuestionSchema.safeParse(badDim).success).toBe(false);
  });
});
