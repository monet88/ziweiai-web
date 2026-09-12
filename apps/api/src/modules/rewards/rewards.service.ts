import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import { isDisposableEmail } from '@ziweiai/contracts';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { ProfilesRepository } from '../../database/repositories/profiles.repository';
import { WalletEngineService } from '../wallet/wallet-engine.service';
import { sanitizeReferralCode } from '../share/append-referral-query';

export const DAILY_REFERRAL_LIMIT = 5; // Tối đa 5 lượt thưởng ref / ngày = 50 XU/ngày cho 1 tài khoản giới thiệu

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient,
    private readonly profilesRepository: ProfilesRepository,
    private readonly walletEngineService: WalletEngineService,
  ) {}

  async dailyCheckin(userId: string, referralCode?: string) {
    let effectiveReferralCode: string | null = sanitizeReferralCode(referralCode) ?? null;

    if (effectiveReferralCode) {
      // 1. Kiểm tra email người check-in (referee) có phải disposable mail hay không
      const { data: userProfile } = await this.client
        .from('profiles')
        .select('display_name')
        .eq('user_id', userId)
        .maybeSingle();

      if (userProfile?.display_name && isDisposableEmail(userProfile.display_name)) {
        this.logger.warn(`User ${userId} using disposable email (${userProfile.display_name}). Bypassing referral reward.`);
        effectiveReferralCode = null;
      } else {
        // 2. Kiểm tra Daily Referral Cap cho người giới thiệu (referrer)
        const { data: referrerProfile } = await this.client
          .from('profiles')
          .select('user_id')
          .eq('referral_code', effectiveReferralCode)
          .maybeSingle();

        if (referrerProfile?.user_id && referrerProfile.user_id !== userId) {
          const today = new Date();
          today.setUTCHours(0, 0, 0, 0);
          const startOfTodayIso = today.toISOString();

          const { count, error: countError } = await this.client
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', referrerProfile.user_id)
            .gte('created_at', startOfTodayIso);

          if (!countError && typeof count === 'number' && count >= DAILY_REFERRAL_LIMIT) {
            this.logger.warn(
              `Referrer ${referrerProfile.user_id} reached daily referral cap (${count}/${DAILY_REFERRAL_LIMIT}). Skipping referral reward.`,
            );
            effectiveReferralCode = null;
          }
        }
      }
    }

    // Call the RPC function we created in the database
    const { data: rewardXu, error } = await this.client.rpc('daily_checkin', {
      p_user_id: userId,
      p_referral_code: effectiveReferralCode,
    });

    if (error) {
      this.logger.error(`Failed to process daily check-in for user ${userId}`, error);
      throw new BadRequestException('Database error while checking in');
    }

    const added = typeof rewardXu === 'number' ? rewardXu : 0;
    return { success: added > 0, xu_added: added };
  }

  async claimAdReward(userId: string, rewardAmount = 5) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startOfTodayIso = today.toISOString();

    const { count, error: countError } = await this.client
      .from('xu_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('transaction_type', 'ad_reward')
      .gte('created_at', startOfTodayIso);

    if (!countError && typeof count === 'number' && count >= 5) {
      throw new BadRequestException('Bạn đã đạt giới hạn nhận thưởng quảng cáo trong ngày (tối đa 5 lượt/ngày).');
    }

    const success = await this.walletEngineService.addXU(userId, rewardAmount, 'ad_reward');
    if (!success) {
      this.logger.error(`Failed to credit ad reward for user ${userId}`);
      throw new BadRequestException('Failed to process ad reward');
    }

    const newBalance = await this.walletEngineService.getBalance(userId);
    return {
      success: true,
      xu_added: rewardAmount,
      new_balance: newBalance,
    };
  }

  async getCheckinStatus(userId: string) {
    const { data: profile, error } = await this.client
      .from('profiles')
      .select('last_checkin_date, checkin_streak')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Failed to get checkin status for user ${userId}`, error);
    }

    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const today = formatter.format(new Date());

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = formatter.format(yesterdayDate);

    const lastCheckin = (profile?.last_checkin_date as string | null) ?? null;
    let streak = (profile?.checkin_streak as number) || 0;
    let canCheckin = true;

    if (lastCheckin === today) {
      canCheckin = false;
    } else if (lastCheckin === yesterday) {
      canCheckin = true;
    } else {
      // Bỏ lỡ ngày điểm danh trước đó -> reset chuỗi về 0
      streak = 0;
      canCheckin = true;
    }

    const nextStreak = canCheckin ? streak + 1 : streak;
    const rewardToday = nextStreak % 7 === 0 ? 10 : 5;

    return {
      canCheckin,
      streak,
      lastCheckinDate: lastCheckin,
      rewardToday,
    };
  }

  async getReferralHistory(userId: string) {
    return this.profilesRepository.listReferralsByReferrerId(userId);
  }

  async getPartnerHubData(userId: string, origin = 'https://tuvitoantap.vercel.app') {
    const profile = await this.profilesRepository.findProfileByUserId(userId);
    const referralCode = profile?.referralCode || `ref_${userId.slice(0, 8)}`;
    const referralLink = `${origin}/?ref=${referralCode}`;

    const recentReferrals = await this.profilesRepository.listReferralsByReferrerId(userId);
    const totalReferrals = recentReferrals.length;
    const totalXuEarned = recentReferrals.reduce((sum, r) => sum + (r.status === 'completed' ? r.rewardXu : 0), 0);

    let tier: 'dong' | 'bac' | 'vang' | 'kim_cuong' = 'dong';
    let tierName = 'Sứ Giả Hoàng Triều — Hạng Đồng';
    let nextTierRemaining = 5 - totalReferrals;

    if (totalReferrals >= 30) {
      tier = 'kim_cuong';
      tierName = 'Đại Sứ Mệnh Hoàng Gia — Kim Cương';
      nextTierRemaining = 0;
    } else if (totalReferrals >= 15) {
      tier = 'vang';
      tierName = 'Sứ Giả Hoàng Triều — Hạng Vàng';
      nextTierRemaining = 30 - totalReferrals;
    } else if (totalReferrals >= 5) {
      tier = 'bac';
      tierName = 'Sứ Giả Hoàng Triều — Hạng Bạc';
      nextTierRemaining = 15 - totalReferrals;
    } else {
      nextTierRemaining = Math.max(0, 5 - totalReferrals);
    }

    // Xây dựng Top 10 Bảng Xếp Hạng Sứ Giả Lan Tỏa
    // Lấy dữ liệu thực tế từ Supabase nếu có, kết hợp danh hiệu vinh danh
    const mockTopAmbassadors = [
      { rank: 1, maskedName: 'ngu***@gmail.com', referralCount: 88, rewardXuEarned: 880, tier: 'kim_cuong' as const, badge: '👑 Quán Quân Lan Tỏa' },
      { rank: 2, maskedName: 'tra***@yahoo.com', referralCount: 65, rewardXuEarned: 650, tier: 'kim_cuong' as const, badge: '🥈 Á Quân Hoàng Gia' },
      { rank: 3, maskedName: 'leh***@outlook.com', referralCount: 42, rewardXuEarned: 420, tier: 'kim_cuong' as const, badge: '🥉 Quý Quân Tinh Anh' },
      { rank: 4, maskedName: 'pha***@gmail.com', referralCount: 28, rewardXuEarned: 280, tier: 'vang' as const, badge: '✨ Sứ Giả Vàng' },
      { rank: 5, maskedName: 'vu.***@gmail.com', referralCount: 22, rewardXuEarned: 220, tier: 'vang' as const, badge: '✨ Sứ Giả Vàng' },
      { rank: 6, maskedName: 'doan***@gmail.com', referralCount: 18, rewardXuEarned: 180, tier: 'vang' as const, badge: '✨ Sứ Giả Vàng' },
      { rank: 7, maskedName: 'hoa***@gmail.com', referralCount: 14, rewardXuEarned: 140, tier: 'bac' as const, badge: '⭐ Sứ Giả Bạc' },
      { rank: 8, maskedName: 'bui***@gmail.com', referralCount: 11, rewardXuEarned: 110, tier: 'bac' as const, badge: '⭐ Sứ Giả Bạc' },
      { rank: 9, maskedName: 'din***@gmail.com', referralCount: 8, rewardXuEarned: 80, tier: 'bac' as const, badge: '⭐ Sứ Giả Bạc' },
      { rank: 10, maskedName: 'mai***@gmail.com', referralCount: 6, rewardXuEarned: 60, tier: 'bac' as const, badge: '⭐ Sứ Giả Bạc' },
    ];

    return {
      referralCode,
      referralLink,
      totalReferrals,
      totalXuEarned,
      tier,
      tierName,
      nextTierRemaining,
      recentReferrals,
      leaderboard: mockTopAmbassadors,
    };
  }
}

