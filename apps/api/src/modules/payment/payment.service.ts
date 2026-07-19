import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { SepayWebhookPayload, RevenueCatWebhookPayload } from '@ziweiai/contracts';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(@Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient) {}

  async processTransaction(payload: SepayWebhookPayload) {
    // 1. Extract short UUID from content
    // Expected format: TVTT 12345678 (where 12345678 are the first 8 chars of the user's UUID)
    const match = payload.content.match(/TVTT\s*([a-zA-Z0-9]{8})/i);
    if (!match) {
      this.logger.warn(`No valid TVTT code found in content: ${payload.content}`);
      // Return gracefully so SePay doesn't keep retrying if the user forgot to add the code
      return;
    }

    const shortUuid = match[1].toLowerCase();

    // 2. Check if transaction already processed (idempotency)
    const { data: existingTx } = await this.client
      .from('transactions')
      .select('id')
      .eq('sepay_transaction_id', payload.id.toString())
      .single();

    if (existingTx) {
      this.logger.log(`Transaction ${payload.id} already processed. Skipping.`);
      return;
    }

    // 3. Find the user by short UUID prefix
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

    // 4. Calculate XU (10,000 VND = 10 XU -> Rate is 1,000 VND = 1 XU)
    const xuAdded = Math.floor(payload.transferAmount / 1000);

    if (xuAdded <= 0) {
      this.logger.warn(`Transfer amount too small to add XU: ${payload.transferAmount}`);
      return;
    }

    // 5. Insert transaction and add XU
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

  async processRevenueCatTransaction(payload: RevenueCatWebhookPayload) {
    const event = payload.event;

    // Only process INITIAL_PURCHASE and NON_RENEWING_PURCHASE
    if (event.type !== 'INITIAL_PURCHASE' && event.type !== 'NON_RENEWING_PURCHASE') {
      this.logger.log(`Skipping RevenueCat event type ${event.type}`);
      return;
    }

    // 1. Check if transaction already processed (idempotency)
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

    // 2. Map product_id to XU amount
    let xuAdded = 0;
    // Basic mapping, can be moved to config or database later
    if (event.product_id.includes('100')) {
      xuAdded = 100;
    } else if (event.product_id.includes('500')) {
      xuAdded = 500;
    } else if (event.product_id.includes('2000')) {
      xuAdded = 2000;
    } else {
      this.logger.warn(`Could not determine XU amount for product_id: ${event.product_id}`);
      // Default fallback if we can't extract XU (or throw error)
      return;
    }

    // 3. Extract amount in VND/USD if needed, or default to 0 for logging
    const amountPaid = event.price_in_purchased_currency || event.price || 0;

    // 4. Insert transaction and add XU
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
