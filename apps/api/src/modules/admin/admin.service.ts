import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase-client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(@Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient) {}

  async getRecentTransactions() {
    const { data, error } = await this.client
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      this.logger.error('Failed to fetch transactions', error);
      throw new BadRequestException('Could not fetch transactions');
    }

    return data ?? [];
  }

  async reconcileTransaction(transactionId: string, targetUserId: string) {
    const { data: tx, error: txFetchErr } = await this.client
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txFetchErr || !tx) {
      throw new NotFoundException(`Transaction with id ${transactionId} not found`);
    }

    // Verify user exists in profiles
    const { data: profile, error: profileErr } = await this.client
      .from('profiles')
      .select('user_id')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (profileErr || !profile) {
      throw new NotFoundException(`Target user ${targetUserId} not found`);
    }

    // Update owner_user_id on transaction
    const { error: updateErr } = await this.client
      .from('transactions')
      .update({ owner_user_id: targetUserId })
      .eq('id', transactionId);

    if (updateErr) {
      this.logger.error(`Failed to reconcile tx ${transactionId}`, updateErr);
      throw new BadRequestException('Could not update transaction owner');
    }

    // Call add_xu RPC
    const xuToAdd = tx.xu_added || Math.floor((tx.amount_vnd || 0) / 1000);
    if (xuToAdd > 0) {
      const { error: rpcError } = await this.client.rpc('add_xu', {
        user_id: targetUserId,
        amount: xuToAdd,
      });

      if (rpcError) {
        this.logger.error(`Failed to add XU for user ${targetUserId}`, rpcError);
        throw new BadRequestException('Failed to add XU to user');
      }
    }

    this.logger.log(`Successfully reconciled transaction ${transactionId} -> User ${targetUserId} (+${xuToAdd} XU)`);
    return { success: true, transactionId, targetUserId, xuAdded: xuToAdd };
  }
}
