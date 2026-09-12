import { z } from 'zod';
import { referralRecordSchema } from '../persistence/persistence-records';

export const partnerTierSchema = z.enum([
  'dong', // Sứ Giả Đồng (< 5 lượt)
  'bac', // Sứ Giả Bạc (5 - 14 lượt)
  'vang', // Sứ Giả Vàng (15 - 29 lượt)
  'kim_cuong', // Sứ Giả Kim Cương (30+ lượt)
]);

export type PartnerTier = z.infer<typeof partnerTierSchema>;

export const referralLeaderboardItemSchema = z.object({
  rank: z.number().int().min(1).max(10),
  maskedName: z.string().min(1),
  referralCount: z.number().int().nonnegative(),
  rewardXuEarned: z.number().int().nonnegative(),
  tier: partnerTierSchema,
  badge: z.string().min(1),
});

export type ReferralLeaderboardItem = z.infer<typeof referralLeaderboardItemSchema>;

export const referralPartnerHubResponseSchema = z.object({
  referralCode: z.string().min(1),
  referralLink: z.string().min(1),
  totalReferrals: z.number().int().nonnegative(),
  totalXuEarned: z.number().int().nonnegative(),
  tier: partnerTierSchema,
  tierName: z.string().min(1),
  nextTierRemaining: z.number().int().nonnegative(),
  recentReferrals: z.array(referralRecordSchema),
  leaderboard: z.array(referralLeaderboardItemSchema),
});

export type ReferralPartnerHubResponse = z.infer<typeof referralPartnerHubResponseSchema>;
