import { z } from 'zod';

export const numerologyExplainRequestSchema = z.object({
  lifePath: z.number().int().min(1),
  destiny: z.number().int().min(1),
  soulUrge: z.number().int().min(1),
  personality: z.number().int().min(1),
  fullName: z.string().trim().min(1),
});

export const numerologyExplainResponseSchema = z.object({
  narrative: z.string().min(1),
});

export type NumerologyExplainRequest = z.infer<typeof numerologyExplainRequestSchema>;
export type NumerologyExplainResponse = z.infer<typeof numerologyExplainResponseSchema>;
