import { z } from 'zod';

export const divinationChatRequestSchema = z.object({
  question: z.string().trim().min(1, 'Câu hỏi không được để trống').max(1000, 'Câu hỏi quá dài (tối đa 1000 ký tự)'),
  topic: z.string().optional(),
});

export const divinationChatResponseSchema = z.object({
  answer: z.string().min(1),
  costXu: z.number().default(1),
});

export type DivinationChatRequest = z.infer<typeof divinationChatRequestSchema>;
export type DivinationChatResponse = z.infer<typeof divinationChatResponseSchema>;

export const compatibilityExplainRequestSchema = z.object({
  person1: z.object({
    name: z.string().min(1),
    birthYear: z.number().int().min(1900).max(2100),
    gender: z.enum(['male', 'female']).default('male'),
    lunarYearCanChi: z.string().optional(),
    element: z.string().optional(),
  }),
  person2: z.object({
    name: z.string().min(1),
    birthYear: z.number().int().min(1900).max(2100),
    gender: z.enum(['male', 'female']).default('female'),
    lunarYearCanChi: z.string().optional(),
    element: z.string().optional(),
  }),
  overallScore: z.number().min(0).max(100),
  verdictTitle: z.string().optional(),
});

export const compatibilityExplainResponseSchema = z.object({
  explanation: z.string().min(1),
  costXu: z.number().default(15),
});

export type CompatibilityExplainRequest = z.infer<typeof compatibilityExplainRequestSchema>;
export type CompatibilityExplainResponse = z.infer<typeof compatibilityExplainResponseSchema>;
