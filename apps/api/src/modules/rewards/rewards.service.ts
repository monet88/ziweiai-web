import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import { isDisposableEmail } from '@ziweiai/contracts';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { ProfilesRepository } from '../../database/repositories/profiles.repository';
import { WalletEngineService } from '../wallet/wallet-engine.service';
import { sanitizeReferralCode } from '../share/append-referral-query';
import { apiEnv } from '../../config/env';

import { AdMobVerifierService } from './admob-verifier.service';

export const DAILY_REFERRAL_LIMIT = 5; // Tối đa 5 lượt thưởng ref / ngày = 50 XU/ngày cho 1 tài khoản giới thiệu

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient,
    private readonly profilesRepository: ProfilesRepository,
    private readonly walletEngineService: WalletEngineService,
    private readonly admobVerifierService: AdMobVerifierService,
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

  async claimAdReward(userId: string, adToken?: string, impressionId?: string) {
    // 1. Kiểm tra cờ kích hoạt tính năng: Fail-closed an toàn nếu chưa có Ad Network SSV production
    if (process.env.ENABLE_AD_REWARDS !== 'true' && process.env.NODE_ENV === 'production') {
      throw new BadRequestException(
        'Tính năng nhận XU qua quảng cáo đang được nâng cấp Server-Side Verification (AdMob SSV). Vui lòng điểm danh hằng ngày hoặc nạp XU qua VietQR.',
      );
    }

    const effectiveImpressionId = (impressionId || adToken || '').trim();

    // 2. Bắt buộc có impressionId hợp lệ (không chấp nhận rỗng hoặc bypass)
    if (!effectiveImpressionId || effectiveImpressionId.length < 8) {
      throw new BadRequestException('Mã xác thực xem quảng cáo (impressionId / adToken) không hợp lệ hoặc thiếu.');
    }

    // 3. Gọi RPC atomic claim_ad_reward (service_role only, hardcoded 5 XU, atomic lock-by-insert)
    const { data: rpcResult, error: rpcError } = await this.client.rpc('claim_ad_reward', {
      p_user_id: userId,
      p_impression_id: effectiveImpressionId,
    });

    if (rpcError || !rpcResult) {
      this.logger.error(`claim_ad_reward RPC failed for user ${userId}`, rpcError);
      throw new BadRequestException('Lỗi hệ thống khi xử lý nhận thưởng quảng cáo.');
    }

    if (!rpcResult.success) {
      throw new BadRequestException(rpcResult.message || 'Không thể nhận thưởng quảng cáo lúc này.');
    }

    return {
      success: true,
      xu_added: rpcResult.xu_added,
      new_balance: rpcResult.new_balance,
    };
  }

  /**
   * Xử lý callback Server-Side Verification (AdMob SSV) trực tiếp từ máy chủ Google
   */
  async handleAdMobSsv(rawQueryString: string, queryParams: Record<string, any>) {
    const verification = await this.admobVerifierService.verifySsvCallback(
      rawQueryString,
      queryParams,
    );

    if (!verification.isValid) {
      this.logger.warn(`AdMob SSV verification rejected: ${verification.error}`);
      throw new BadRequestException(verification.error || 'Chữ ký số AdMob SSV không hợp lệ');
    }

    const userId = verification.userId;
    const impressionId = verification.transactionId;

    if (!userId) {
      this.logger.warn('AdMob SSV callback missing custom_data (userId)');
      throw new BadRequestException('custom_data (userId) không tìm thấy trong callback');
    }

    if (!impressionId || impressionId.length < 8) {
      this.logger.warn(`AdMob SSV callback invalid transaction_id: ${impressionId}`);
      throw new BadRequestException('transaction_id không hợp lệ');
    }

    // Gọi RPC claim_ad_reward nguyên tử với Pessimistic Row Lock
    const { data: rpcResult, error: rpcError } = await this.client.rpc('claim_ad_reward', {
      p_user_id: userId,
      p_impression_id: impressionId,
    });

    if (rpcError || !rpcResult) {
      this.logger.error(`claim_ad_reward RPC failed for user ${userId} via AdMob SSV`, rpcError);
      throw new BadRequestException('Lỗi hệ thống khi xử lý nhận thưởng quảng cáo qua SSV.');
    }

    if (!rpcResult.success) {
      this.logger.warn(`AdMob SSV reward rejected for user ${userId}: ${rpcResult.message}`);
      return {
        success: false,
        status: rpcResult.status,
        message: rpcResult.message,
      };
    }

    this.logger.log(`AdMob SSV verified and credited 5 XU to user ${userId} (impression: ${impressionId})`);
    return {
      success: true,
      xu_added: rpcResult.xu_added,
      new_balance: rpcResult.new_balance,
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

  async getPartnerHubData(userId: string, origin = apiEnv.PUBLIC_ORIGIN) {
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

    // Xây dựng Top 10 Bảng Xếp Hạng Sứ Giả Lan Tỏa từ dữ liệu thật
    const realAmbassadors = await this.profilesRepository.getReferralLeaderboard(10);

    // Mẫu danh dự hạt giống (dùng lấp đầy các vị trí còn thiếu nếu hệ thống chưa đủ 10 Sứ Giả thật)
    const honorarySeedAmbassadors = [
      { maskedName: 'ngu***@gmail.com', referralCount: 88, rewardXuEarned: 880, tier: 'kim_cuong' as const, badge: '👑 Quán Quân Lan Tỏa' },
      { maskedName: 'tra***@yahoo.com', referralCount: 65, rewardXuEarned: 650, tier: 'kim_cuong' as const, badge: '🥈 Á Quân Hoàng Gia' },
      { maskedName: 'leh***@outlook.com', referralCount: 42, rewardXuEarned: 420, tier: 'kim_cuong' as const, badge: '🥉 Quý Quân Tinh Anh' },
      { maskedName: 'pha***@gmail.com', referralCount: 28, rewardXuEarned: 280, tier: 'vang' as const, badge: '✨ Sứ Giả Vàng' },
      { maskedName: 'vu.***@gmail.com', referralCount: 22, rewardXuEarned: 220, tier: 'vang' as const, badge: '✨ Sứ Giả Vàng' },
      { maskedName: 'doan***@gmail.com', referralCount: 18, rewardXuEarned: 180, tier: 'vang' as const, badge: '✨ Sứ Giả Vàng' },
      { maskedName: 'hoa***@gmail.com', referralCount: 14, rewardXuEarned: 140, tier: 'bac' as const, badge: '⭐ Sứ Giả Bạc' },
      { maskedName: 'bui***@gmail.com', referralCount: 11, rewardXuEarned: 110, tier: 'bac' as const, badge: '⭐ Sứ Giả Bạc' },
      { maskedName: 'din***@gmail.com', referralCount: 8, rewardXuEarned: 80, tier: 'bac' as const, badge: '⭐ Sứ Giả Bạc' },
      { maskedName: 'mai***@gmail.com', referralCount: 6, rewardXuEarned: 60, tier: 'bac' as const, badge: '⭐ Sứ Giả Bạc' },
    ];

    const leaderboard: Array<{
      rank: number;
      maskedName: string;
      referralCount: number;
      rewardXuEarned: number;
      tier: 'dong' | 'bac' | 'vang' | 'kim_cuong';
      badge: string;
    }> = [];

    // Đưa Sứ Giả thật lên đầu
    for (let i = 0; i < realAmbassadors.length && leaderboard.length < 10; i++) {
      const real = realAmbassadors[i];
      const rank = leaderboard.length + 1;
      let ambassadorTier: 'dong' | 'bac' | 'vang' | 'kim_cuong' = 'dong';
      if (real.referralCount >= 30) ambassadorTier = 'kim_cuong';
      else if (real.referralCount >= 15) ambassadorTier = 'vang';
      else if (real.referralCount >= 5) ambassadorTier = 'bac';

      let badge = '🌱 Sứ Giả Triển Vọng';
      if (rank === 1) badge = '👑 Quán Quân Lan Tỏa';
      else if (rank === 2) badge = '🥈 Á Quân Hoàng Gia';
      else if (rank === 3) badge = '🥉 Quý Quân Tinh Anh';
      else if (ambassadorTier === 'kim_cuong') badge = '💎 Đại Sứ Kim Cương';
      else if (ambassadorTier === 'vang') badge = '✨ Sứ Giả Vàng';
      else if (ambassadorTier === 'bac') badge = '⭐ Sứ Giả Bạc';

      leaderboard.push({
        rank,
        maskedName: real.maskedName,
        referralCount: real.referralCount,
        rewardXuEarned: real.rewardXuEarned,
        tier: ambassadorTier,
        badge,
      });
    }

    // Nếu chưa đủ 10 người, lấp đầy các vị trí còn lại bằng hạt giống danh dự
    let seedIdx = 0;
    while (leaderboard.length < 10 && seedIdx < honorarySeedAmbassadors.length) {
      const seed = honorarySeedAmbassadors[seedIdx];
      const rank = leaderboard.length + 1;
      let badge = seed.badge;
      if (rank === 1) badge = '👑 Quán Quân Lan Tỏa';
      else if (rank === 2) badge = '🥈 Á Quân Hoàng Gia';
      else if (rank === 3) badge = '🥉 Quý Quân Tinh Anh';

      leaderboard.push({
        rank,
        maskedName: seed.maskedName,
        referralCount: seed.referralCount,
        rewardXuEarned: seed.rewardXuEarned,
        tier: seed.tier,
        badge,
      });
      seedIdx++;
    }

    return {
      referralCode,
      referralLink,
      totalReferrals,
      totalXuEarned,
      tier,
      tierName,
      nextTierRemaining,
      recentReferrals,
      leaderboard,
    };
  }
}

