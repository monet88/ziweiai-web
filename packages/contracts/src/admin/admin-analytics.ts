import { z } from 'zod';

export const adminAnalyticsSchema = z.object({
  total_users: z.number(),
  total_xu_topup: z.number(),
  total_xu_consumed: z.number(),
  total_charts_created: z.number(),
  total_readings_generated: z.number(),
  feature_usage: z.array(z.object({
    feature: z.string(),
    consumed: z.number()
  })).default([]),
  daily_stats: z.array(z.object({
    date: z.string(),
    new_users: z.number().optional(),
    charts: z.number().optional(),
    xu_topup: z.number().optional(),
    xu_consumed: z.number().optional()
  })).default([]),
});

export type AdminAnalytics = z.infer<typeof adminAnalyticsSchema>;

export const adminAnalyticsResponseSchema = z.object({
  analytics: adminAnalyticsSchema,
});
export type AdminAnalyticsResponse = z.infer<typeof adminAnalyticsResponseSchema>;
