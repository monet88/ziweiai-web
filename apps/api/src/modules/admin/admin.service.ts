import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { WalletEngineService } from '../wallet/wallet-engine.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient,
    private readonly walletEngine: WalletEngineService,
  ) {}

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

  async listUsers(search?: string) {
    let query = this.client
      .from('profiles')
      .select('user_id, display_name, xu_balance, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`user_id.ilike.${term},display_name.ilike.${term}`);
    }

    const { data: profiles, error } = await query;
    if (error) {
      this.logger.error('Failed to list users', error);
      throw new BadRequestException('Could not list users');
    }

    // Try fetching emails from auth.users via admin client if available
    let authUsers: any[] = [];
    try {
      const { data } = await this.client.auth.admin.listUsers();
      if (data && data.users) {
        authUsers = data.users;
      }
    } catch {
      // Ignore if auth admin is not permitted or restricted
    }

    const emailMap = new Map(authUsers.map((u) => [u.id, u.email]));

    return (profiles || []).map((p) => ({
      ...p,
      email: emailMap.get(p.user_id) || p.display_name || null,
      is_anonymous: !emailMap.get(p.user_id) && !p.display_name,
    }));
  }

  async topupUser(userId: string, amount: number, actorEmail?: string) {
    if (!userId || amount === 0) {
      throw new BadRequestException('Invalid userId or amount');
    }

    if (amount > 0) {
      const success = await this.walletEngine.addXU(userId, amount, 'admin_topup', actorEmail);
      if (!success) throw new BadRequestException('Failed to add XU');
    } else {
      const success = await this.walletEngine.deductXU(userId, Math.abs(amount), 'admin_deduct');
      if (!success) throw new BadRequestException('Failed to deduct XU (Insufficient balance or user not found)');
    }

    this.logger.log(`Admin topup/deduct ${amount} XU for user ${userId} by ${actorEmail || 'system'}`);
    return { success: true, userId, amount };
  }

  async cleanupAnonUsers() {
    this.logger.log('Cleaning up anonymous/unused profiles...');
    const { data: profiles, error } = await this.client
      .from('profiles')
      .select('user_id, display_name')
      .is('display_name', null)
      .limit(500);

    if (error || !profiles) {
      throw new BadRequestException('Could not query anon users');
    }

    let deletedCount = 0;
    for (const p of profiles) {
      try {
        await this.client.auth.admin.deleteUser(p.user_id);
        deletedCount++;
      } catch {
        // Skip user deletion failures gracefully
      }
    }

    this.logger.log(`Cleaned up ${deletedCount} anonymous users.`);
    return { success: true, deletedCount };
  }

  async getAnalytics(startDate?: string, endDate?: string) {
    const params: any = {};
    if (startDate) params.p_start_date = startDate;
    if (endDate) params.p_end_date = endDate;

    const { data, error } = await this.client.rpc('get_admin_analytics', params);
    if (error) {
      this.logger.error('Failed to get admin analytics', error);
      throw new BadRequestException('Could not get admin analytics');
    }
    return { analytics: data };
  }

  async getReferralAnalytics() {
    const { data: referrals, error } = await this.client
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      this.logger.error('Failed to fetch referrals', error);
      return { totalReferrals: 0, topReferrers: [], recentReferrals: [] };
    }

    const referrerCounts = new Map<string, number>();
    for (const ref of referrals || []) {
      const count = referrerCounts.get(ref.referrer_id) || 0;
      referrerCounts.set(ref.referrer_id, count + 1);
    }

    const topReferrers = Array.from(referrerCounts.entries())
      .map(([referrerId, count]) => ({ referrerId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalReferrals: (referrals || []).length,
      topReferrers,
      recentReferrals: referrals || [],
    };
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

    const { data: profile, error: profileErr } = await this.client
      .from('profiles')
      .select('user_id')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (profileErr || !profile) {
      throw new NotFoundException(`Target user ${targetUserId} not found`);
    }

    const { error: updateErr } = await this.client
      .from('transactions')
      .update({ owner_user_id: targetUserId })
      .eq('id', transactionId);

    if (updateErr) {
      this.logger.error(`Failed to reconcile tx ${transactionId}`, updateErr);
      throw new BadRequestException('Could not update transaction owner');
    }

    const xuToAdd = tx.xu_added || Math.floor((tx.amount_vnd || 0) / 1000);
    if (xuToAdd > 0) {
      const success = await this.walletEngine.addXU(targetUserId, xuToAdd, 'admin_reconcile');
      if (!success) {
        this.logger.error(`Failed to add XU for user ${targetUserId}`);
        throw new BadRequestException('Failed to add XU to user');
      }
    }

    this.logger.log(`Successfully reconciled transaction ${transactionId} -> User ${targetUserId} (+${xuToAdd} XU)`);
    return { success: true, transactionId, targetUserId, xuAdded: xuToAdd };
  }
}
