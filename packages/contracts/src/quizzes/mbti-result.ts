import { z } from 'zod';

// MBTI: 4 trục + điểm + nhãn + diễn giải ngắn.
export const mbtiAxisSchema = z.object({
  key: z.enum(['EI', 'SN', 'TF', 'JP']),
  score: z.number().min(0).max(100), // % hướng về cực thứ 2 (ví dụ 65 = 65% E, 35% I)
  label: z.string().min(1), // ví dụ "Hướng ngoại (E)"
});

// 16 loại MBTI hợp lệ — chặn chuỗi 4 ký tự bất kỳ ("AAAA"/"1234") lọt qua schema.
export const mbtiTypes = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
] as const;

export const mbtiResultSchema = z.object({
  type: z.enum(mbtiTypes), // ví dụ "ENTP"
  axes: z.array(mbtiAxisSchema).length(4),
  narrative: z.string().min(1), // diễn giải ngắn (Việt)
});

export const mbtiAnswerSchema = z.object({
  questionId: z.string().min(1),
  choice: z.number().int().min(1).max(7), // 1..7 Likert
});

// 8 cực MBTI — dùng cho choice của mỗi câu hỏi (mỗi câu thuộc 1 trục, 2 lựa chọn 2 cực).
export const mbtiDimensionSchema = z.enum(['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P']);

// Một câu hỏi trắc nghiệm: 2 lựa chọn, mỗi lựa chọn nghiêng về một cực của cùng một trục.
// text tiếng Việt (bất biến 0 chữ Hán). axis = trục mà câu này đo.
export const mbtiQuestionSchema = z.object({
  id: z.string().min(1),
  axis: z.enum(['EI', 'SN', 'TF', 'JP']),
  text: z.string().min(1),
  choiceA: z.object({ dimension: mbtiDimensionSchema, text: z.string().min(1) }),
  choiceB: z.object({ dimension: mbtiDimensionSchema, text: z.string().min(1) }),
});

// Body POST /quizzes/mbti: mảng câu trả lời Likert. Tối thiểu 4 câu (đủ phủ 4 trục) để
// scoring có nghĩa; backend vẫn là nguồn kiểm tra cuối. questionId phải duy nhất — một câu
// trả lời trùng id sẽ bị cộng điểm nhiều lần ở scoring, làm lệch kết quả; chặn ngay tại schema.
export const mbtiQuizRequestSchema = z.object({
  answers: z
    .array(mbtiAnswerSchema)
    .min(4)
    .superRefine((answers, ctx) => {
      const seen = new Set<string>();
      answers.forEach((answer, index) => {
        if (seen.has(answer.questionId)) {
          ctx.addIssue({
            code: 'custom',
            path: [index, 'questionId'],
            message: 'Mỗi questionId chỉ được trả lời một lần.',
          });
        }
        seen.add(answer.questionId);
      });
    }),
});

export type MbtiResult = z.infer<typeof mbtiResultSchema>;
export type MbtiAnswer = z.infer<typeof mbtiAnswerSchema>;
export type MbtiDimension = z.infer<typeof mbtiDimensionSchema>;
export type MbtiQuestion = z.infer<typeof mbtiQuestionSchema>;
export type MbtiQuizRequest = z.infer<typeof mbtiQuizRequestSchema>;
