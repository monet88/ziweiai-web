import { z } from 'zod';

export const visionKindSchema = z.enum(['face', 'palm']);

export const visionAnalysisSchema = z.object({
  kind: visionKindSchema,
  imagePath: z.string().min(1), // Storage path (private bucket)
  narrative: z.string().min(1),
  traits: z.array(z.object({
    label: z.string().min(1),
    value: z.string().optional(),
  })).optional(),
});

export type VisionAnalysis = z.infer<typeof visionAnalysisSchema>;
export type VisionKind = z.infer<typeof visionKindSchema>;
