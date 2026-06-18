import { z } from 'zod';

/** Mốc thời gian vận hạn được phép tính trong 1 request. */
export const horoscopeScopeSchema = z.enum(['decadal', 'yearly', 'monthly', 'daily']);

export type HoroscopeScope = z.infer<typeof horoscopeScopeSchema>;

/**
 * Body cho `POST /charts/:id/horoscope`.
 *
 * `scopes` chỉ cần là subset không rỗng — US-015/US-016 gọi đơn scope
 * (`['yearly']` / `['monthly']` / `['daily']`); US-014 gọi cả 4 tầng.
 */
export const horoscopeRequestSchema = z.object({
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scopes: z.array(horoscopeScopeSchema).nonempty(),
});

export type HoroscopeRequest = z.infer<typeof horoscopeRequestSchema>;
