import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { SepayWebhookPayload, RevenueCatWebhookPayload } from '@ziweiai/contracts';
import { WalletEngineService } from '../wallet/wallet-engine.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient,
    private readonly walletEngine: WalletEngineService,
  ) {}

  async processTransaction(payload: SepayWebhookPayload): Promise<void> {
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

    // Calculate XU based on pricing tiers with bonus XU
    let xuAdded = Math.floor(payload.transferAmount / 1000);
    if (payload.transferAmount >= 500000) {
      xuAdded = Math.max(xuAdded, Math.floor(payload.transferAmount / 1000) + 100);
    } else if (payload.transferAmount >= 100000) {
      xuAdded = Math.max(xuAdded, Math.floor(payload.transferAmount / 1000) + 20);
    }

    if (xuAdded <= 0) {
      this.logger.warn(`Transfer amount too small to add XU: ${payload.transferAmount}`);
      return;
    }

    const memo = [payload.content, payload.code, payload.description].filter(Boolean).join(' ');
    const match = memo.match(/TVTT\s*([a-zA-Z0-9]{8})/i);

    if (!match) {
      this.logger.warn(`No valid TVTT code found in content: "${payload.content}". Recording unmatched transaction.`);
      await this.recordUnmatchedTransaction(payload, xuAdded);
      return;
    }

    const shortUuid = match[1].toLowerCase();

    // Resolve user by matching first 8 chars of user_id UUID using index range
    const isHex = /^[0-9a-f]{8}$/i.test(shortUuid);
    const minUuid = isHex ? `${shortUuid}-0000-0000-0000-000000000000` : null;
    const maxUuid = isHex ? `${shortUuid}-ffff-ffff-ffff-ffffffffffff` : null;

    let matchedUsers: { user_id: string }[] = [];

    if (minUuid && maxUuid) {
      const { data, error } = await this.client
        .from('profiles')
        .select('user_id')
        .gte('user_id', minUuid)
        .lte('user_id', maxUuid);

      if (error) {
        this.logger.error(`Failed to fetch profiles for short UUID prefix: ${shortUuid}`, error);
        await this.recordUnmatchedTransaction(payload, xuAdded);
        return;
      }
      matchedUsers = data || [];
    } else {
      const { data: userProfiles, error: userError } = await this.client
        .from('profiles')
        .select('user_id');

      if (userError || !userProfiles) {
        this.logger.error(`Failed to fetch profiles to match short UUID: ${shortUuid}`, userError);
        await this.recordUnmatchedTransaction(payload, xuAdded);
        return;
      }
      matchedUsers = userProfiles.filter((p) => p.user_id.toLowerCase().startsWith(shortUuid));
    }

    if (matchedUsers.length !== 1) {
      this.logger.warn(`Expected 1 user for prefix ${shortUuid}, found ${matchedUsers.length}. Recording unmatched transaction.`);
      await this.recordUnmatchedTransaction(payload, xuAdded);
      return;
    }

    const userId = matchedUsers[0].user_id;

    // Record transaction
    const { error: txError } = await this.client
      .from('transactions')
      .insert({
        owner_user_id: userId,
        amount_vnd: payload.transferAmount,
        xu_added: xuAdded,
        sepay_transaction_id: payload.id.toString(),
        content: payload.content || null,
      });

    if (txError) {
      this.logger.error(`Failed to insert transaction ${payload.id}`, txError);
      throw new BadRequestException('Database error');
    }

    // Add XU & log ledger
    const success = await this.walletEngine.addXU(userId, xuAdded, 'topup');

    if (!success) {
      this.logger.error(`Failed to add XU for user ${userId}`);
      throw new BadRequestException('Database error');
    }

    this.logger.log(`Successfully processed transaction ${payload.id}. Added ${xuAdded} XU to user ${userId}.`);
  }

  private async recordUnmatchedTransaction(payload: SepayWebhookPayload, xuAdded: number): Promise<void> {
    const { error: txError } = await this.client
      .from('transactions')
      .insert({
        owner_user_id: null,
        amount_vnd: payload.transferAmount,
        xu_added: xuAdded,
        sepay_transaction_id: payload.id.toString(),
        content: payload.content || payload.description || null,
      });

    if (txError) {
      this.logger.error(`Failed to record unmatched transaction ${payload.id}`, txError);
      throw new BadRequestException('Database error');
    }
    this.logger.log(`Recorded unmatched transaction ${payload.id} (${payload.transferAmount} VND) for admin reconciliation.`);
  }

  async processRevenueCatTransaction(payload: RevenueCatWebhookPayload): Promise<void> {
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
    const productId = event.product_id.toLowerCase();

    if (productId.includes('2000')) {
      xuAdded = 2000;
    } else if (productId.includes('600')) {
      xuAdded = 600;
    } else if (productId.includes('500')) {
      xuAdded = 500;
    } else if (productId.includes('120')) {
      xuAdded = 120;
    } else if (productId.includes('100')) {
      xuAdded = 100;
    } else if (productId.includes('50')) {
      xuAdded = 50;
    } else if (productId.includes('20')) {
      xuAdded = 20;
    } else {
      const match = productId.match(/(\d+)/);
      if (match) {
        xuAdded = parseInt(match[1], 10);
      } else {
        this.logger.warn(`Could not determine XU amount for product_id: ${event.product_id}`);
        return;
      }
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

    const success = await this.walletEngine.addXU(userId, xuAdded, 'topup');

    if (!success) {
      this.logger.error(`Failed to add XU for user ${userId}`);
      throw new BadRequestException('Database error');
    }

    this.logger.log(`Successfully processed RevenueCat transaction ${event.id}. Added ${xuAdded} XU to user ${userId}.`);
  }
}
