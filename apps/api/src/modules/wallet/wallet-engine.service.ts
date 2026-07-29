import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase-client';

@Injectable()
export class WalletEngineService {
  private readonly logger = new Logger(WalletEngineService.name);

  constructor(@Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient) {}

  /**
   * Get user's current XU balance from profile
   */
  async getBalance(userId: string): Promise<number> {
    const { data: profile, error } = await this.client
      .from('profiles')
      .select('xu_balance')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      this.logger.error(`Failed to fetch wallet balance for user ${userId}`, error);
      throw new Error(`Profile not found for user ${userId}`);
    }

    return profile.xu_balance ?? 0;
  }

  /**
   * Deduct XU atomically using log_xu_transaction RPC.
   * Returns true if successful, false if balance is insufficient or user not found.
   */
  async deductXU(userId: string, amount: number, transactionType = 'ai_usage'): Promise<boolean> {
    if (amount <= 0) return true;

    const { data, error } = await this.client.rpc('log_xu_transaction', {
      p_user_id: userId,
      p_amount: -amount,
      p_transaction_type: transactionType,
    });

    if (error) {
      this.logger.error(`deductXU failed for user ${userId} (-${amount})`, error);
      return false;
    }

    return data === true;
  }

  /**
   * Add XU atomically using log_xu_transaction RPC, fallback to add_xu if needed.
   */
  async addXU(
    userId: string,
    amount: number,
    transactionType = 'topup',
    actorEmail?: string,
  ): Promise<boolean> {
    if (amount <= 0) return true;

    const { data, error } = await this.client.rpc('log_xu_transaction', {
      p_user_id: userId,
      p_amount: amount,
      p_transaction_type: transactionType,
      p_actor_email: actorEmail || null,
    });

    if (error) {
      const { error: rpcError } = await this.client.rpc('add_xu', {
        user_id: userId,
        amount,
      });

      if (rpcError) {
        this.logger.error(`addXU failed for user ${userId} (+${amount})`, rpcError);
        return false;
      }
      return true;
    }

    return data === true;
  }

}

