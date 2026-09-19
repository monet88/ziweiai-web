import { describe, it, expect } from 'vitest';
import { referralPartnerHubResponseSchema } from '@ziweiai/contracts';

describe('ReferralPartnerHub Contract Validation', () => {
  const sampleHubData = {
    referralCode: 'ref_vip123',
    referralLink: 'https://tuvitoantap.vercel.app/?ref=ref_vip123',
    totalReferrals: 12,
    totalXuEarned: 120,
    tier: 'bac' as const,
    tierName: 'Sứ Giả Hoàng Triều — Hạng Bạc',
    nextTierRemaining: 3,
    recentReferrals: [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        referrerId: '123e4567-e89b-12d3-a456-426614174000',
        refereeId: '123e4567-e89b-12d3-a456-426614174002',
        rewardXu: 10,
        status: 'completed' as const,
        createdAt: '2026-09-01T12:00:00Z',
        completedAt: '2026-09-01T12:05:00Z',
        refereeEmailMasked: 'ban***@gmail.com',
      },
    ],
    leaderboard: [
      {
        rank: 1,
        maskedName: 'ngu***@gmail.com',
        referralCount: 88,
        rewardXuEarned: 880,
        tier: 'kim_cuong' as const,
        badge: '👑 Quán Quân Lan Tỏa',
      },
    ],
  };

  it('parse thành công payload ReferralPartnerHubResponse hợp lệ', () => {
    const parsed = referralPartnerHubResponseSchema.parse(sampleHubData);
    expect(parsed.referralCode).toBe('ref_vip123');
    expect(parsed.totalReferrals).toBe(12);
    expect(parsed.tier).toBe('bac');
    expect(parsed.leaderboard[0]?.rank).toBe(1);
  });

  it('ném lỗi khi thiếu các trường bắt buộc', () => {
    const invalidData = {
      ...sampleHubData,
      tier: 'invalid_tier',
    };
    expect(() => referralPartnerHubResponseSchema.parse(invalidData)).toThrow();
  });
});
