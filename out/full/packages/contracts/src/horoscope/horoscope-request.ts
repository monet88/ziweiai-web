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

/** Query cho `GET /charts/:id/daily?asOf=YYYY-MM-DD` (US-016). */
export const dailyFortuneRequestSchema = z.object({
  // Siết phạm vi tháng (01-12) + ngày (01-31) — chặn `2026-13-40` lọt vào engine. Validate
  // ngày-trong-tháng cụ thể (Feb 30…) để engine xử lý; đây chỉ chặn input ngoài phạm vi thô.
  asOf: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/),
});

export type DailyFortuneRequest = z.infer<typeof dailyFortuneRequestSchema>;

/** Query cho `GET /charts/:id/monthly?asOf=YYYY-MM` (US-016). */
export const monthlyFortuneRequestSchema = z.object({
  asOf: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
});

export type MonthlyFortuneRequest = z.infer<typeof monthlyFortuneRequestSchema>;

/** Query cho `POST /charts/:id/annual-report?year=YYYY` (US-016). */
export const annualReportRequestSchema = z.object({
  year: z.number().int().min(1900).max(2100),
});

export type AnnualReportRequest = z.infer<typeof annualReportRequestSchema>;
