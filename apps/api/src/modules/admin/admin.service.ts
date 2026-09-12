import { Injectable, Logger, BadRequestException, NotFoundException, Inject, Optional } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { WalletEngineService } from '../wallet/wallet-engine.service';
import { AdminRepository } from '../../database/repositories/admin.repository';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient,
    private readonly walletEngine: WalletEngineService,
    @Optional() private readonly adminRepo?: AdminRepository,
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

  async banUser(userId: string, isBanned: boolean, actorEmail?: string) {
    if (this.adminRepo) {
      return this.adminRepo.adminBanUser(userId, isBanned, actorEmail);
    }
    const { error } = await this.client
      .from('profiles')
      .update({ is_banned: isBanned, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) {
      this.logger.error(`Failed to update ban status for user ${userId}`, error);
      throw new BadRequestException('Could not update ban status');
    }
    return true;
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
    const params: any = {
      p_start_date: startDate || null,
      p_end_date: endDate || null,
    };

    try {
      const { data, error } = await this.client.rpc('get_admin_analytics', params);
      if (!error && data) {
        return { analytics: data };
      }
      this.logger.warn(`RPC get_admin_analytics failed: ${error?.message || 'null data'}, falling back to direct table queries`);
    } catch (rpcErr: any) {
      this.logger.warn(`RPC get_admin_analytics error: ${rpcErr?.message}, falling back to direct table queries`);
    }

    // Resilient fallback query when RPC is missing or fails on production
    try {
      const { count: totalUsers } = await this.client
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      let txQuery = this.client
        .from('xu_transactions')
        .select('amount, transaction_type, created_at');

      if (startDate) txQuery = txQuery.gte('created_at', startDate);
      if (endDate) txQuery = txQuery.lte('created_at', endDate);

      const { data: txs } = await txQuery.order('created_at', { ascending: false }).limit(2000);

      let totalXuTopup = 0;
      let totalXuConsumed = 0;
      const featureMap = new Map<string, number>();
      const dailyMap = new Map<string, { date: string; new_users: number; xu_topup: number; xu_consumed: number }>();

      // Seed 30 recent days
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        dailyMap.set(dateStr, { date: dateStr, new_users: 0, xu_topup: 0, xu_consumed: 0 });
      }

      for (const tx of txs || []) {
        const amt = Number(tx.amount || 0);
        const day = (tx.created_at || '').slice(0, 10);
        if (amt > 0) {
          totalXuTopup += amt;
          if (dailyMap.has(day)) {
            dailyMap.get(day)!.xu_topup += amt;
          }
        } else if (amt < 0) {
          const absAmt = Math.abs(amt);
          totalXuConsumed += absAmt;
          const feat = tx.transaction_type || 'ai_usage';
          featureMap.set(feat, (featureMap.get(feat) || 0) + absAmt);
          if (dailyMap.has(day)) {
            dailyMap.get(day)!.xu_consumed += absAmt;
          }
        }
      }

      const featureUsage = Array.from(featureMap.entries()).map(([feature, consumed]) => ({
        feature,
        consumed,
      }));

      const dailyStats = Array.from(dailyMap.values());

      return {
        analytics: {
          total_users: totalUsers || 0,
          total_xu_topup: totalXuTopup,
          total_xu_consumed: totalXuConsumed,
          total_charts_created: 0,
          total_readings_generated: 0,
          feature_usage: featureUsage,
          daily_stats: dailyStats,
        },
      };
    } catch (fallbackErr: any) {
      this.logger.error('Failed fallback analytics query', fallbackErr);
      return {
        analytics: {
          total_users: 0,
          total_xu_topup: 0,
          total_xu_consumed: 0,
          total_charts_created: 0,
          total_readings_generated: 0,
          feature_usage: [],
          daily_stats: [],
        },
      };
    }
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
    const userIds = new Set<string>();

    for (const ref of referrals || []) {
      if (ref.referrer_id) {
        userIds.add(ref.referrer_id);
        const count = referrerCounts.get(ref.referrer_id) || 0;
        referrerCounts.set(ref.referrer_id, count + 1);
      }
      const target = ref.referee_id || ref.referred_id;
      if (target) {
        userIds.add(target);
      }
    }

    // Lookup user display names
    const profileMap = new Map<string, string>();
    const idArray = Array.from(userIds);
    if (idArray.length > 0) {
      try {
        const { data: profiles } = await this.client
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', idArray);
        for (const p of profiles || []) {
          if (p.user_id && p.display_name) {
            profileMap.set(p.user_id, p.display_name);
          }
        }
      } catch (profileErr) {
        this.logger.warn('Failed to query profiles for referrals', profileErr);
      }
    }

    // Lookup user emails from auth
    const emailMap = new Map<string, string>();
    try {
      const { data: authData } = await this.client.auth.admin.listUsers();
      if (authData && authData.users) {
        for (const u of authData.users) {
          if (u.id && u.email) {
            emailMap.set(u.id, u.email);
          }
        }
      }
    } catch {
      // Ignored if restricted
    }

    const topReferrers = Array.from(referrerCounts.entries())
      .map(([referrerId, count]) => ({
        referrerId,
        count,
        email: emailMap.get(referrerId) || null,
        displayName: profileMap.get(referrerId) || null,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const sanitizedRecent = (referrals || []).map((ref) => {
      const refId = ref.referrer_id || '';
      const targetId = ref.referee_id || ref.referred_id || '';
      return {
        ...ref,
        referrer_id: refId,
        referee_id: targetId,
        referred_id: targetId,
        referrer_email: emailMap.get(refId) || null,
        referrer_name: profileMap.get(refId) || null,
        referee_email: emailMap.get(targetId) || null,
        referee_name: profileMap.get(targetId) || null,
      };
    });

    return {
      totalReferrals: (referrals || []).length,
      topReferrers,
      recentReferrals: sanitizedRecent,
    };
  }

  async getAuditLogs(
    page: number = 1,
    limit: number = 50,
    action?: string,
    startDate?: string,
    endDate?: string,
  ) {
    try {
      if (this.adminRepo) {
        const { data: rawLogs, count } = await this.adminRepo.adminGetAuditLogs(
          page,
          limit,
          action,
          startDate,
          endDate,
        );

        const logs = (rawLogs || []).map((l: any) => ({
          ...l,
          actor_email: l.actor_email || l.admin_email || 'admin@system',
          metadata: l.metadata || l.payload || l.details || null,
        }));

        return { logs, count, page, limit };
      }
    } catch (err: any) {
      this.logger.warn(`Failed to fetch audit logs via repo: ${err.message}. Trying direct query...`);
    }

    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      let query = this.client
        .from('admin_audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (action) query = query.eq('action', action);
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      const { data: rawLogs, count } = await query;
      const logs = (rawLogs || []).map((l: any) => ({
        ...l,
        actor_email: l.actor_email || l.admin_email || 'admin@system',
        metadata: l.metadata || l.payload || l.details || null,
      }));

      return { logs: logs || [], count: count || 0, page, limit };
    } catch (queryErr: any) {
      this.logger.error('Failed to query admin_audit_logs', queryErr);
      return { logs: [], count: 0, page, limit };
    }
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

  async getConfigs(): Promise<Record<string, any>> {
    const defaultConfigs: Record<string, any> = {
      dailyCheckinXu: 5,
      rateVndToXu: 1000,
      features: {
        face: true,
        palm: true,
        annualReport: true,
        hepan: true,
        mangpai: true,
        tarot: true,
        sticks: true,
        almanac: true,
      },
    };

    try {
      if (this.adminRepo) {
        const stored = await this.adminRepo.getSystemConfigs();
        return {
          ...defaultConfigs,
          ...stored,
          features: {
            ...defaultConfigs.features,
            ...(stored.features || {}),
          },
        };
      }
    } catch (err: any) {
      this.logger.warn(`Could not read system_configs from DB: ${err.message}. Returning default configs.`);
    }

    return defaultConfigs;
  }

  async updateConfig(key: string, value: any, adminEmail: string = 'admin@system.local') {
    if (!key || typeof key !== 'string') {
      throw new BadRequestException('Config key must be a non-empty string');
    }

    try {
      if (this.adminRepo) {
        await this.adminRepo.updateSystemConfig(key, value, adminEmail);
      }
    } catch (err: any) {
      this.logger.error(`Failed to update system config [${key}]: ${err.message}`);
      throw new BadRequestException(`Could not update config: ${err.message}`);
    }

    this.logger.log(`Updated config [${key}] by ${adminEmail}`);
    return { success: true, key, value };
  }
}
