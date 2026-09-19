import { z } from 'zod';

export const synthesisFocusAreaSchema = z.enum([
  'general',
  'career',
  'wealth',
  'relationship',
  'health',
]);
export type SynthesisFocusArea = z.infer<typeof synthesisFocusAreaSchema>;

export const astrologicalSynthesisRequestSchema = z.object({
  chartId: z.string().uuid({ message: 'chartId phải là UUID hợp lệ' }),
  includeBazi: z.boolean().default(true),
  includeNumerology: z.boolean().default(true),
  focusAreas: z.array(synthesisFocusAreaSchema).default(['general', 'career', 'wealth', 'relationship', 'health']),
});
export type AstrologicalSynthesisRequest = z.infer<typeof astrologicalSynthesisRequestSchema>;

export const multiDisciplineInsightSchema = z.object({
  discipline: z.enum(['ziwei', 'bazi', 'numerology']),
  title: z.string(),
  keyFindings: z.array(z.string()),
  elementBalance: z.string(),
  potentialRisk: z.string(),
  opportunity: z.string(),
});
export type MultiDisciplineInsight = z.infer<typeof multiDisciplineInsightSchema>;

export const astrologicalSynthesisResponseSchema = z.object({
  chartId: z.string().uuid(),
  createdAt: z.string(),
  consensusScore: z.number().min(0).max(100),
  summary: z.string(),
  heavenAspect: z.object({
    title: z.string(),
    detail: z.string(),
    starsSummary: z.array(z.string()),
  }),
  earthAspect: z.object({
    title: z.string(),
    detail: z.string(),
    elementsSummary: z.array(z.string()),
  }),
  humanAspect: z.object({
    title: z.string(),
    detail: z.string(),
    lifePathSummary: z.string(),
  }),
  disciplines: z.array(multiDisciplineInsightSchema),
  actionableStrategy: z.object({
    doList: z.array(z.string()),
    dontList: z.array(z.string()),
    strategicTiming: z.string(),
    auspiciousElements: z.array(z.string()),
  }),
  metadata: z.object({
    generatedAt: z.string(),
    modelUsed: z.string().optional(),
    isCached: z.boolean().optional(),
  }),
});
export type AstrologicalSynthesisResponse = z.infer<typeof astrologicalSynthesisResponseSchema>;
