import { z } from 'zod';

export const destinyAuspiciousLevelSchema = z.enum([
  'dai_cat',
  'cat',
  'binh_hoa',
  'tieu_hung',
  'dai_hung',
]);

export type DestinyAuspiciousLevel = z.infer<typeof destinyAuspiciousLevelSchema>;

export const destinyMonthScoreSchema = z.object({
  month: z.number().int().min(1).max(12),
  solarMonth: z.string().min(1), // e.g. "02/2026"
  lunarMonthName: z.string().min(1), // e.g. "Tháng Giêng", "Tháng Hai"
  ganZhi: z.string().min(1), // Can Chi tháng âm, e.g. "Canh Dần"
  palaceName: z.string().min(1), // Cung nguyệt hạn, e.g. "Mệnh", "Quan Lộc"
  auspiciousScore: z.number().int().min(0).max(100),
  level: destinyAuspiciousLevelSchema,
  mutagens: z.array(z.string()), // Tứ hóa lưu nguyệt
  highlights: z.array(z.string()), // Điểm nhấn sao cát/hung
  advice: z.string().min(1), // Lời khuyên hành động/hóa giải
});

export type DestinyMonthScore = z.infer<typeof destinyMonthScoreSchema>;

export const destinyTimelineResponseSchema = z.object({
  chartId: z.string().uuid(),
  year: z.number().int().min(1900).max(2100),
  yearGanZhi: z.string().min(1), // e.g. "Bính Ngọ 2026"
  annualOverview: z.string().min(1),
  averageScore: z.number().int().min(0).max(100),
  luckiestMonth: z.number().int().min(1).max(12),
  cautiousMonth: z.number().int().min(1).max(12),
  months: z.array(destinyMonthScoreSchema).length(12),
});

export type DestinyTimelineResponse = z.infer<typeof destinyTimelineResponseSchema>;
