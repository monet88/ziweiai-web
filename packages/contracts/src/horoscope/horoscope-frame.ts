import { z } from 'zod';
import { horoscopeAgeItemSchema, horoscopeItemSchema } from '../chart/chart-snapshot';

/**
 * Khung vận hạn server tính, web tiêu thụ (decision 0011).
 *
 * Mở rộng tương thích ngược từ `horoscopeSchema` (chỉ decadal/age/yearly):
 * thêm `monthly?` + `daily?` ở mức optional nên snapshot cũ vẫn parse OK.
 * KHÔNG sửa `chart-snapshot.ts` — chỉ reuse 2 schema item đã có ở đó.
 */
export const horoscopeFrameSchema = z.object({
  decadal: horoscopeItemSchema,
  age: horoscopeAgeItemSchema,
  yearly: horoscopeItemSchema,
  monthly: horoscopeItemSchema.optional(),
  daily: horoscopeItemSchema.optional(),
});

export type HoroscopeFrame = z.infer<typeof horoscopeFrameSchema>;
