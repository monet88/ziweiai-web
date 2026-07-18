import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { SepayWebhookPayload } from '@ziweiai/contracts';

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
}
