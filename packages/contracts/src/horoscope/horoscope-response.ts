import { z } from 'zod';
import { horoscopeItemSchema } from '../chart/chart-snapshot';
import { horoscopeFrameSchema } from './horoscope-frame';

/** Envelope trả về của `POST /charts/:id/horoscope`. */
export const horoscopeResponseSchema = z.object({
  chartId: z.uuid(),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  frame: horoscopeFrameSchema,
});

export type HoroscopeResponse = z.infer<typeof horoscopeResponseSchema>;

/**
 * Vận ngày (US-016): `GET /charts/:id/daily?asOf=YYYY-MM-DD`.
 *
 * `frame` tái dùng `horoscopeFrameSchema` (nhánh `daily` được điền). `summary` là
 * đoạn văn template tiếng Việt do server render (KHÔNG LLM), nên min(1) đảm bảo không rỗng.
 */
export const dailyFortuneResponseSchema = z.object({
  chartId: z.uuid(),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  frame: horoscopeFrameSchema,
  summary: z.string().min(1),
});

export type DailyFortuneResponse = z.infer<typeof dailyFortuneResponseSchema>;

/** Vận tháng (US-016): `GET /charts/:id/monthly?asOf=YYYY-MM`. */
export const monthlyFortuneResponseSchema = z.object({
  chartId: z.uuid(),
  asOf: z.string().regex(/^\d{4}-\d{2}$/),
  frame: horoscopeFrameSchema,
  summary: z.string().min(1),
});

export type MonthlyFortuneResponse = z.infer<typeof monthlyFortuneResponseSchema>;

/**
 * Khung báo cáo năm: lưu niên + đúng 12 lưu nguyệt.
 *
 * KHÔNG tái dùng `horoscopeFrameSchema` vì frame đó chỉ có 1 `monthly` đơn lẻ;
 * báo cáo năm cần mảng 12 tháng nên định nghĩa riêng.
 */
export const annualReportFrameSchema = z.object({
  yearly: horoscopeItemSchema,
  monthly: z.array(horoscopeItemSchema).length(12),
});

export type AnnualReportFrame = z.infer<typeof annualReportFrameSchema>;

/** Báo cáo năm (US-016): `POST /charts/:id/annual-report?year=YYYY` → Markdown LLM tiếng Việt. */
export const annualReportResponseSchema = z.object({
  chartId: z.uuid(),
  year: z.number().int(),
  frame: annualReportFrameSchema,
  markdown: z.string().min(1),
});

export type AnnualReportResponse = z.infer<typeof annualReportResponseSchema>;
