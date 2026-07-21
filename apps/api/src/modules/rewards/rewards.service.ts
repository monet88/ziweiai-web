import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase-client';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(@Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient) {}

  async dailyCheckin(userId: string) {
    // Call the RPC function we created in the database
    const { data: success, error } = await this.client.rpc('daily_checkin', {
      user_id: userId,
    });

    if (error) {
      this.logger.error(`Failed to process daily check-in for user ${userId}`, error);
      throw new BadRequestException('Database error while checking in');
    }

    return { success, xu_added: success ? 5 : 0 };
  }
}
