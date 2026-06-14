import { z } from 'zod';

export const healthStatusSchema = z.enum(['ok']);

export const healthResponseSchema = z.object({
  service: z.string().min(1),
  status: healthStatusSchema,
  timestamp: z.string().datetime(),
  version: z.string().min(1),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
