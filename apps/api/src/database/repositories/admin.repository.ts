import { Injectable } from '@nestjs/common';
import { SupabaseBaseRepository } from './supabase-base.repository';

@Injectable()
export class AdminRepository extends SupabaseBaseRepository {
  async adminListUsers(): Promise<any[]> {
    const { data: profiles, error: profileError } = await this.client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    this.throwIfError(profileError);

    let authUsers: any[] = [];
    try {
      const { data: authData, error: authError } = await this.client.auth.admin.listUsers({ perPage: 1000 });
      if (!authError && authData?.users) {
        authUsers = authData.users;
      }
    } catch {
      // Fallback
    }

    const emailMap = new Map(authUsers.map(u => [u.id, u.email]));
    const nameMap = new Map(authUsers.map(u => [u.id, u.user_metadata?.full_name]));

    return (profiles || []).map(p => ({
      ...p,
      email: emailMap.get(p.user_id) || null,
      full_name: p.display_name || nameMap.get(p.user_id) || null,
    }));
  }

  async adminTopupXU(userId: string, amount: number, actorEmail?: string): Promise<boolean> {
    const { data, error } = await this.client.rpc('log_xu_transaction', {
      p_user_id: userId,
      p_amount: amount,
      p_transaction_type: 'admin_topup',
      p_actor_email: actorEmail || null
    });
    this.throwIfError(error);
    
    if (actorEmail) {
      await this.logAdminAction(actorEmail, 'TOPUP_XU', userId, { amount });
    }
    
    return data === true;
  }

  async adminBanUser(userId: string, isBanned: boolean, actorEmail?: string): Promise<boolean> {
    const { error: authError } = await this.client.auth.admin.updateUserById(userId, {
      ban_duration: isBanned ? '876000h' : 'none',
    });
    this.throwIfError(authError);

    const { error: dbError } = await this.client
      .from('profiles')
      .update({ is_banned: isBanned, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    this.throwIfError(dbError);

    if (actorEmail) {
      await this.logAdminAction(actorEmail, isBanned ? 'BAN_USER' : 'UNBAN_USER', userId, {});
    }

    return true;
  }

  async adminListTransactions(
    page: number = 1,
    limit: number = 50,
    type?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ data: any[]; count: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.client
      .from('xu_transactions')
      .select('*, profiles!inner(email, full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (type) {
      if (type === 'topup') {
        query = query.gt('amount', 0);
      } else if (type === 'consume') {
        query = query.lt('amount', 0);
      } else {
        query = query.eq('transaction_type', type);
      }
    }
    
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data: logs, count, error } = await query;
    this.throwIfError(error);
    return { data: logs || [], count: count || 0 };
  }

  async adminGetAnalytics(startDate?: string, endDate?: string): Promise<any> {
    const params: any = {};
    if (startDate) params.p_start_date = startDate;
    if (endDate) params.p_end_date = endDate;

    const { data, error } = await this.client.rpc('get_admin_analytics', params);
    this.throwIfError(error);
    return data;
  }

  async checkAdminRole(email: string): Promise<'SUPER_ADMIN' | 'MODERATOR' | null> {
    const { data, error } = await this.client
      .from('admin_roles')
      .select('role')
      .eq('email', email)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking admin role:', error);
      return null;
    }
    
    return data?.role || null;
  }

  async logAdminAction(adminEmail: string, action: string, targetId: string | null, payload: any): Promise<void> {
    const { error } = await this.client
      .from('admin_audit_logs')
      .insert({
        admin_email: adminEmail,
        action,
        target_id: targetId,
        payload,
      });
    
    if (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  async adminGetAuditLogs(
    page: number = 1,
    limit: number = 50,
    action?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ data: any[]; count: number }> {
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

    const { data: logs, count, error } = await query;
    this.throwIfError(error);
    return { data: logs || [], count: count || 0 };
  }

  async getSystemConfigs(): Promise<Record<string, any>> {
    const { data, error } = await this.client
      .from('system_configs')
      .select('key, value');
    
    this.throwIfError(error);
    
    const configs: Record<string, any> = {};
    for (const row of data || []) {
      configs[row.key] = row.value;
    }
    
    return configs;
  }

  async updateSystemConfig(key: string, value: any, adminEmail: string): Promise<void> {
    const { error } = await this.client
      .from('system_configs')
      .upsert({
        key,
        value,
        updated_by: adminEmail,
        updated_at: new Date().toISOString(),
      });
      
    this.throwIfError(error);
    await this.logAdminAction(adminEmail, 'UPDATE_CONFIG', key, { value });
  }
}
