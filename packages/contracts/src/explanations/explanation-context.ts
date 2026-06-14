import { z } from 'zod';
import { calculationConfidenceSchema, ruleSourceSchema } from '../chart/chart-metadata';

export const explanationContextSchema = z.object({
  chartSystem: ruleSourceSchema.shape.system,
  visibleMessageKeys: z.array(z.string().min(1)),
  confidence: calculationConfidenceSchema,
  sourceLabel: z.string().min(1),
});

export type ExplanationContext = z.infer<typeof explanationContextSchema>;
