import { Injectable, Logger, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import { isDisposableEmail } from '@ziweiai/contracts';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { ProfilesRepository } from '../../database/repositories/profiles.repository';
import { WalletEngineService } from '../wallet/wallet-engine.service';
import { sanitizeReferralCode } from '../share/append-referral-query';
import { apiEnv } from '../../config/env';

import { AdMobVerifierService } from './admob-verifier.service';

export const DAILY_REFERRAL_LIMIT = 10; // Tối đa 10 lượt thưởng ref / ngày = 100 XU/ngày cho 1 tài khoản giới thiệu

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

      if (userProfile?.display_name) {
        const email = userProfile.display_name;
        const localPart = email.split('@')[0] || '';
        if (isDisposableEmail(email) || localPart.includes('+')) {
          this.logger.warn(`User ${userId} using disposable email or alias (${email}). Bypassing referral reward.`);
          effectiveReferralCode = null;
        }
      }
      if (effectiveReferralCode) {
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
      throw new BadRequestException(error.message || 'Lỗi hệ thống khi điểm danh');
    }

    const added = typeof rewardXu === 'number' ? rewardXu : 0;
    return { success: added > 0, xu_added: added };
  }

  async claimAdReward(_userId: string, _adToken?: string, _impressionId?: string) {
    // Chặn đứng direct client-side ad reward. Phần thưởng quảng cáo CHỈ được phát thông qua Google AdMob SSV callback (/rewards/admob-ssv).
    throw new ForbiddenException(
      'Nhận thưởng quảng cáo trực tiếp từ client đã bị vô hiệu hóa vì lý do an ninh. Phần thưởng quảng cáo chỉ được xử lý qua Google AdMob SSV callback.',
    );
  }

  async claimWelcomeBonus(userId: string, userEmail?: string) {
    if (userEmail) {
      if (isDisposableEmail(userEmail)) {
        throw new BadRequestException('Email không hợp lệ hoặc thuộc danh sách dịch vụ email tạm thời.');
      }
      // Chặn trick alias dấu + (vd: user+1@gmail.com) để chống Sybil farm quà tân thủ
      const localPart = userEmail.split('@')[0] || '';
      if (localPart.includes('+')) {
        throw new BadRequestException('Địa chỉ email chứa bí danh (alias) không đủ điều kiện nhận quà tân thủ.');
      }
    }

    const { data: rewardXu, error } = await this.client.rpc('claim_welcome_bonus', {
      p_user_id: userId,
    });

    if (error) {
      this.logger.warn(`claim_welcome_bonus failed for user ${userId}: ${error.message}`);
      throw new BadRequestException(error.message || 'Không thể nhận thưởng 15 XU tân thủ lúc này.');
    }

    const added = typeof rewardXu === 'number' ? rewardXu : 15;
    return { success: true, xu_added: added };
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
    const rewardToday = nextStreak % 7 === 0 ? 3 : 1;

    return {
      canCheckin,
      streak,
      lastCheckinDate: lastCheckin,
      rewardToday,
    };
  }

  async getReferralHistory(userId: string) {
    try {
      return await this.profilesRepository.listReferralsByReferrerId(userId);
    } catch (e: any) {
      this.logger.warn(`listReferralsByReferrerId error for user ${userId}: ${e.message}`);
      return [];
    }
  }

  async getPartnerHubData(userId: string, origin = apiEnv.PUBLIC_ORIGIN) {
    let profile: any = null;
    try {
      profile = await this.profilesRepository.findProfileByUserId(userId);
    } catch (e: any) {
      this.logger.warn(`findProfileByUserId failed in getPartnerHubData for ${userId}: ${e.message}`);
    }

    const referralCode = profile?.referralCode || `ref_${userId.slice(0, 8)}`;
    const referralLink = `${origin}/?ref=${referralCode}`;

    let recentReferrals: any[] = [];
    try {
      recentReferrals = await this.profilesRepository.listReferralsByReferrerId(userId);
    } catch (e: any) {
      this.logger.warn(`listReferralsByReferrerId failed for ${userId}: ${e.message}`);
    }

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
    let realAmbassadors: any[] = [];
    try {
      realAmbassadors = await this.profilesRepository.getReferralLeaderboard(10);
    } catch (e: any) {
      this.logger.warn(`getReferralLeaderboard failed in getPartnerHubData: ${e.message}`);
    }

    // Mẫu danh dự hạt giống (dùng lấp đầy các vị trí còn thiếu nếu hệ thống chưa đủ 10 Sứ Giả thật)
    // Cân chỉnh mức lượt mời thực tế để user thật dễ dàng cạnh tranh leo bảng vinh danh
    const honorarySeedAmbassadors = [
      { maskedName: 'ngu***@gmail.com', referralCount: 18, rewardXuEarned: 180, tier: 'vang' as const },
      { maskedName: 'tra***@yahoo.com', referralCount: 14, rewardXuEarned: 140, tier: 'bac' as const },
      { maskedName: 'leh***@outlook.com', referralCount: 11, rewardXuEarned: 110, tier: 'bac' as const },
      { maskedName: 'pha***@gmail.com', referralCount: 9, rewardXuEarned: 90, tier: 'bac' as const },
      { maskedName: 'vu.***@gmail.com', referralCount: 7, rewardXuEarned: 70, tier: 'bac' as const },
      { maskedName: 'doan***@gmail.com', referralCount: 5, rewardXuEarned: 50, tier: 'bac' as const },
      { maskedName: 'hoa***@gmail.com', referralCount: 4, rewardXuEarned: 40, tier: 'dong' as const },
      { maskedName: 'bui***@gmail.com', referralCount: 3, rewardXuEarned: 30, tier: 'dong' as const },
      { maskedName: 'din***@gmail.com', referralCount: 2, rewardXuEarned: 20, tier: 'dong' as const },
      { maskedName: 'mai***@gmail.com', referralCount: 1, rewardXuEarned: 10, tier: 'dong' as const },
    ];

    // Tạo danh sách kết hợp: ưu tiên toàn bộ Sứ Giả thật, lấp đầy bằng hạt giống
    const combinedCandidates: Array<{
      maskedName: string;
      referralCount: number;
      rewardXuEarned: number;
      tier: 'dong' | 'bac' | 'vang' | 'kim_cuong';
    }> = [];

    for (const real of realAmbassadors) {
      let ambassadorTier: 'dong' | 'bac' | 'vang' | 'kim_cuong' = 'dong';
      if (real.referralCount >= 30) ambassadorTier = 'kim_cuong';
      else if (real.referralCount >= 15) ambassadorTier = 'vang';
      else if (real.referralCount >= 5) ambassadorTier = 'bac';

      combinedCandidates.push({
        maskedName: real.maskedName,
        referralCount: real.referralCount,
        rewardXuEarned: real.rewardXuEarned,
        tier: ambassadorTier,
      });
    }

    // Nếu chưa đủ 10 người, lấy thêm các hạt giống danh dự từ trên xuống
    const neededSeeds = Math.max(0, 10 - combinedCandidates.length);
    for (let i = 0; i < neededSeeds && i < honorarySeedAmbassadors.length; i++) {
      combinedCandidates.push(honorarySeedAmbassadors[i]);
    }

    // Sắp xếp giảm dần tuyệt đối theo referralCount DESC, phụ theo rewardXuEarned DESC
    combinedCandidates.sort(
      (a, b) => b.referralCount - a.referralCount || b.rewardXuEarned - a.rewardXuEarned,
    );

    const leaderboard = combinedCandidates.slice(0, 10).map((cand, index) => {
      const rank = index + 1;
      let badge = '🌱 Sứ Giả Triển Vọng';
      if (rank === 1) badge = '👑 Quán Quân Lan Tỏa';
      else if (rank === 2) badge = '🥈 Á Quân Hoàng Gia';
      else if (rank === 3) badge = '🥉 Quý Quân Tinh Anh';
      else if (cand.tier === 'kim_cuong') badge = '💎 Đại Sứ Kim Cương';
      else if (cand.tier === 'vang') badge = '✨ Sứ Giả Vàng';
      else if (cand.tier === 'bac') badge = '⭐ Sứ Giả Bạc';
      else badge = '🥉 Sứ Giả Đồng';

      return {
        rank,
        maskedName: cand.maskedName,
        referralCount: cand.referralCount,
        rewardXuEarned: cand.rewardXuEarned,
        tier: cand.tier,
        badge,
      };
    });

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

