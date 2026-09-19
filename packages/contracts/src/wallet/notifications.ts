import { z } from 'zod';

export const inAppNotificationTypeSchema = z.enum([
  'topup_success',
  'checkin_reward',
  'referral_reward',
  'feature_spent',
  'ai_ready',
  'system_reminder',
]);

export const inAppNotificationSchema = z.object({
  id: z.string(),
  type: inAppNotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  amountXu: z.number().optional(),
  link: z.string().optional(),
  createdAt: z.string(),
  isRead: z.boolean().default(false),
});

export type InAppNotification = z.infer<typeof inAppNotificationSchema>;

export const inAppNotificationsResponseSchema = z.object({
  data: z.array(inAppNotificationSchema),
  unreadCount: z.number(),
});

export type InAppNotificationsResponse = z.infer<typeof inAppNotificationsResponseSchema>;

export const dailyCheckinStatusSchema = z.object({
  canCheckin: z.boolean(),
  streak: z.number(),
  lastCheckinDate: z.string().nullable(),
  rewardToday: z.number(),
});

export type DailyCheckinStatus = z.infer<typeof dailyCheckinStatusSchema>;
