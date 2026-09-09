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

  async getReferralHistory(userId: string) {
    return this.profilesRepository.listReferralsByReferrerId(userId);
  }
}

