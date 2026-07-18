import { z } from 'zod';

// GET /features (US-017): trạng thái cờ hệ mở rộng để web ẩn/hiện lối vào từng hệ.
// Khớp FeaturesController (apps/api/src/health/features.controller.ts).
// US-037/038/039 (backlog #45/#42/#47): thêm 3 hệ B6 net-new lenormand/dream/sticks.
// US-040 (backlog #48): thêm hệ Hoàng lịch (almanac).
export const featuresResponseSchema = z.object({
  hepan: z.boolean(),
  mangpai: z.boolean(),
  tarot: z.boolean(),
  mbti: z.boolean(),
  face: z.boolean(),
  palm: z.boolean(),
  lenormand: z.boolean(),
  dream: z.boolean(),
  sticks: z.boolean(),
  almanac: z.boolean(),
});

export type FeaturesResponse = z.infer<typeof featuresResponseSchema>;
