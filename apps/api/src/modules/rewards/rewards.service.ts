import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';
import { sanitizeReferralCode } from '../share/append-referral-query';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient,
    private readonly gateway: SupabasePersistenceGateway,
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

  async getReferralHistory(userId: string) {
    return this.gateway.listReferralsByReferrerId(userId);
  }
}
