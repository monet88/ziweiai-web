import { describe, expect, it } from 'vitest';
import { mbtiResultSchema, MBTI_QUESTIONS, type MbtiAnswer } from '@ziweiai/contracts';
import { scoreMbti } from './mbti-scoring';

// Helper: trả lời TẤT CẢ câu của một trục bằng cực choiceA (choice=1, +3 cho cực A) hoặc
// choiceB (choice=7, +3 cho cực B). Các câu trục khác để trung lập (choice=4) để không nhiễu.
function answerAxisToward(axis: 'EI' | 'SN' | 'TF' | 'JP', side: 'A' | 'B'): MbtiAnswer[] {
  return MBTI_QUESTIONS.map((q) => ({
    questionId: q.id,
    choice: q.axis === axis ? (side === 'A' ? 1 : 7) : 4,
  }));
}

describe('scoreMbti (US-017b)', () => {
  it('dồn mọi trục về cực đầu (E/S/T/J) cho ra ESTJ với điểm 100', () => {
    const answers = MBTI_QUESTIONS.map((q) => {
      // choiceA của mỗi câu nghiêng về một cực; chọn choice sao cho cực ĐẦU của trục thắng.
      const firstPole = { EI: 'E', SN: 'S', TF: 'T', JP: 'J' }[q.axis];
      // Nếu choiceA chính là cực đầu -> choice=1 (+3 cho A); ngược lại choice=7 (+3 cho B).
      return { questionId: q.id, choice: q.choiceA.dimension === firstPole ? 1 : 7 };
    });
    const result = scoreMbti(answers);
    expect(result.type).toBe('ESTJ');
    for (const axis of result.axes) {
      expect(axis.score).toBe(100);
    }
  });

  it('dồn mọi trục về cực sau (I/N/F/P) cho ra INFP', () => {
    const answers = MBTI_QUESTIONS.map((q) => {
      const secondPole = { EI: 'I', SN: 'N', TF: 'F', JP: 'P' }[q.axis];
      return { questionId: q.id, choice: q.choiceA.dimension === secondPole ? 1 : 7 };
    });
    expect(scoreMbti(answers).type).toBe('INFP');
  });

  it('tie-break: toàn bộ trung lập (choice=4) -> chọn cực đầu, score 50, type ESTJ', () => {
    const answers = MBTI_QUESTIONS.map((q) => ({ questionId: q.id, choice: 4 }));
    const result = scoreMbti(answers);
    expect(result.type).toBe('ESTJ');
    for (const axis of result.axes) {
      expect(axis.score).toBe(50);
    }
  });

  it('chỉ nghiêng trục EI về I, các trục khác trung lập -> ký tự đầu là I', () => {
    const result = scoreMbti(answerAxisToward('EI', 'B').map((a, i) =>
      // câu trục EI: choiceB nghiêng I hay E tuỳ câu; dùng helper hướng cực thứ 2 của trục.
      ({ ...a, choice: MBTI_QUESTIONS[i].axis === 'EI' ? (MBTI_QUESTIONS[i].choiceA.dimension === 'I' ? 1 : 7) : 4 }),
    ));
    expect(result.type.startsWith('I')).toBe(true);
    const eiAxis = result.axes.find((a) => a.key === 'EI');
    expect(eiAxis?.label).toContain('Hướng nội');
  });

  it('kết quả (kèm narrative) hợp lệ theo mbtiResultSchema', () => {
    const answers = MBTI_QUESTIONS.map((q) => ({ questionId: q.id, choice: 4 }));
    const scored = scoreMbti(answers);
    expect(mbtiResultSchema.safeParse({ ...scored, narrative: 'Luận giải mẫu.' }).success).toBe(true);
  });

  it('bỏ qua câu trả lời có questionId không khớp bộ câu hỏi', () => {
    const answers: MbtiAnswer[] = [
      { questionId: 'khong-ton-tai', choice: 1 },
      { questionId: 'cung-khong', choice: 7 },
    ];
    const result = scoreMbti(answers);
    // Không câu nào cộng điểm -> mọi trục hòa 0/0 -> cực đầu, 50%.
    expect(result.type).toBe('ESTJ');
    expect(result.axes.every((a) => a.score === 50)).toBe(true);
  });
});
