import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { SepayWebhookPayload, RevenueCatWebhookPayload } from '@ziweiai/contracts';

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

  /**
   * Process SePay VietQR deposit with TVTT short-UUID prefix matching, idempotency, transaction recording & XU credit.
   */
  async processSePayDeposit(payload: SepayWebhookPayload): Promise<void> {
    const match = payload.content.match(/TVTT\s*([a-zA-Z0-9]{8})/i);
    if (!match) {
      this.logger.warn(`No valid TVTT code found in content: ${payload.content}`);
      return;
    }

    const shortUuid = match[1].toLowerCase();

    // Idempotency check
    const { data: existingTx } = await this.client
      .from('transactions')
      .select('id')
      .eq('sepay_transaction_id', payload.id.toString())
      .single();

    if (existingTx) {
      this.logger.log(`Transaction ${payload.id} already processed. Skipping.`);
      return;
    }

    // Resolve user
    const { data: userProfiles, error: userError } = await this.client
      .from('profiles')
      .select('user_id')
      .ilike('user_id', `${shortUuid}-%`);

    if (userError || !userProfiles || userProfiles.length === 0) {
      this.logger.error(`Could not find user with short UUID prefix: ${shortUuid}`, userError);
      return;
    }

    if (userProfiles.length > 1) {
      this.logger.error(`Multiple users found for short UUID prefix: ${shortUuid}`);
      return;
    }

    const userId = userProfiles[0].user_id;
    const xuAdded = Math.floor(payload.transferAmount / 1000);

    if (xuAdded <= 0) {
      this.logger.warn(`Transfer amount too small to add XU: ${payload.transferAmount}`);
      return;
    }

    // Record transaction
    const { error: txError } = await this.client
      .from('transactions')
      .insert({
        owner_user_id: userId,
        amount_vnd: payload.transferAmount,
        xu_added: xuAdded,
        sepay_transaction_id: payload.id.toString(),
      });

    if (txError) {
      this.logger.error(`Failed to insert transaction ${payload.id}`, txError);
      throw new BadRequestException('Database error');
    }

    // Add XU & log ledger
    const { error: rpcError } = await this.client.rpc('add_xu', {
      user_id: userId,
      amount: xuAdded,
    });

    if (rpcError) {
      this.logger.error(`Failed to add XU for user ${userId}`, rpcError);
      throw new BadRequestException('Database error');
    }

    this.logger.log(`Successfully processed transaction ${payload.id}. Added ${xuAdded} XU to user ${userId}.`);
  }

  /**
   * Process RevenueCat IAP deposit.
   */
  async processRevenueCatDeposit(payload: RevenueCatWebhookPayload): Promise<void> {
    const event = payload.event;
    if (event.type !== 'INITIAL_PURCHASE' && event.type !== 'NON_RENEWING_PURCHASE') {
      this.logger.log(`Skipping RevenueCat event type ${event.type}`);
      return;
    }

    const { data: existingTx } = await this.client
      .from('transactions')
      .select('id')
      .eq('revenuecat_transaction_id', event.id)
      .single();

    if (existingTx) {
      this.logger.log(`RevenueCat transaction ${event.id} already processed. Skipping.`);
      return;
    }

    const userId = event.app_user_id;
    let xuAdded = 0;
    if (event.product_id.includes('100')) {
      xuAdded = 100;
    } else if (event.product_id.includes('500')) {
      xuAdded = 500;
    } else if (event.product_id.includes('2000')) {
      xuAdded = 2000;
    } else {
      this.logger.warn(`Could not determine XU amount for product_id: ${event.product_id}`);
      return;
    }

    const amountPaid = event.price_in_purchased_currency || event.price || 0;

    const { error: txError } = await this.client
      .from('transactions')
      .insert({
        owner_user_id: userId,
        amount_vnd: amountPaid,
        xu_added: xuAdded,
        revenuecat_transaction_id: event.id,
      });

    if (txError) {
      this.logger.error(`Failed to insert transaction ${event.id}`, txError);
      throw new BadRequestException('Database error');
    }

    const { error: rpcError } = await this.client.rpc('add_xu', {
      user_id: userId,
      amount: xuAdded,
    });

    if (rpcError) {
      this.logger.error(`Failed to add XU for user ${userId}`, rpcError);
      throw new BadRequestException('Database error');
    }

    this.logger.log(`Successfully processed RevenueCat transaction ${event.id}. Added ${xuAdded} XU to user ${userId}.`);
  }
}
