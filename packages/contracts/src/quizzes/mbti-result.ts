import { z } from 'zod';

// MBTI: 4 trục + điểm + nhãn + diễn giải ngắn.
export const mbtiAxisSchema = z.object({
  key: z.enum(['EI', 'SN', 'TF', 'JP']),
  score: z.number().min(0).max(100), // % hướng về cực thứ 2 (ví dụ 65 = 65% E, 35% I)
  label: z.string().min(1), // ví dụ "Hướng ngoại (E)"
});

export const mbtiResultSchema = z.object({
  type: z.string().min(4).max(4), // ví dụ "ENTP"
  axes: z.array(mbtiAxisSchema).length(4),
  narrative: z.string().min(1), // diễn giải ngắn (Việt)
});

export const mbtiAnswerSchema = z.object({
  questionId: z.string().min(1),
  choice: z.number().int().min(1).max(7), // 1..7 Likert
});

export type MbtiResult = z.infer<typeof mbtiResultSchema>;
export type MbtiAnswer = z.infer<typeof mbtiAnswerSchema>;
