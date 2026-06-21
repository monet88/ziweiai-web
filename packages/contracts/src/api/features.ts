import { z } from 'zod';

// GET /features (US-017): trạng thái 6 cờ hệ mở rộng để web ẩn/hiện lối vào từng hệ.
// Khớp FeaturesController (apps/api/src/health/features.controller.ts).
export const featuresResponseSchema = z.object({
  hepan: z.boolean(),
  mangpai: z.boolean(),
  tarot: z.boolean(),
  mbti: z.boolean(),
  face: z.boolean(),
  palm: z.boolean(),
});

export type FeaturesResponse = z.infer<typeof featuresResponseSchema>;
