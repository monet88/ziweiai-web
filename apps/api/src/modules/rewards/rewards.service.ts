import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { ProfilesRepository } from '../../database/repositories/profiles.repository';
import { WalletEngineService } from '../wallet/wallet-engine.service';
import { sanitizeReferralCode } from '../share/append-referral-query';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient,
    private readonly profilesRepository: ProfilesRepository,
    private readonly walletEngineService: WalletEngineService,
  ) {}

  async dailyCheckin(userId: string, referralCode?: string) {
    // Call the RPC function we created in the database
    const { data: rewardXu, error } = await this.client.rpc('daily_checkin', {
      p_user_id: userId,
      p_referral_code: sanitizeReferralCode(referralCode) ?? null,
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

