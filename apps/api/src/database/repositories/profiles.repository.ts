import { Injectable } from '@nestjs/common';
import { type ProfileRecord, type ReferralRecord, maskEmail } from '@ziweiai/contracts';
import { SupabaseBaseRepository } from './supabase-base.repository';
import { toProfileRecord, toReferralRecord } from '../persistence-mappers';

@Injectable()
export class ProfilesRepository extends SupabaseBaseRepository {
  async findProfileByUserId(userId: string): Promise<ProfileRecord | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    this.throwIfError(error);
    return data ? toProfileRecord(data) : null;
  }

  async listReferralsByReferrerId(userId: string): Promise<ReferralRecord[]> {
    const { data, error } = await this.client
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });
    this.throwIfError(error);
    if (!data || data.length === 0) {
      return [];
    }

    const refereeIds = Array.from(new Set(data.map((r: any) => r.referee_id).filter(Boolean)));
    const refereeNameMap = new Map<string, string>();

    if (refereeIds.length > 0) {
      const { data: refereeProfiles, error: profileError } = await this.client
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', refereeIds);
      if (!profileError && refereeProfiles) {
        for (const p of refereeProfiles) {
          if (p.user_id && p.display_name) {
            refereeNameMap.set(p.user_id, p.display_name);
          }
        }
      }
    }

    return data.map((row: any) => {
      const rawNameOrEmail = refereeNameMap.get(row.referee_id);
      const masked = rawNameOrEmail ? maskEmail(rawNameOrEmail) : 'Người dùng ẩn danh';
      return toReferralRecord(row, masked);
    });
  }

  async updateFcmToken(userId: string, token: string, platform?: string): Promise<void> {
    const { error } = await this.client
      .from('profiles')
      .update({
        fcm_token: token,
        device_platform: platform || 'mobile',
        fcm_updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    this.throwIfError(error);
  }

  async listActiveFcmTokens(): Promise<Array<{ userId: string; token: string; platform?: string }>> {
    const { data, error } = await this.client
      .from('profiles')
      .select('user_id, fcm_token, device_platform')
      .not('fcm_token', 'is', null)
      .neq('fcm_token', '');
    this.throwIfError(error);
    if (!data) return [];
    return data.map((row: any) => ({
      userId: row.user_id,
      token: row.fcm_token,
      platform: row.device_platform,
    }));
  }

  async getReferralLeaderboard(limit = 10): Promise<Array<{
    referrerId: string;
    maskedName: string;
    referralCount: number;
    rewardXuEarned: number;
  }>> {
    // 1. Thử gọi RPC get_referral_leaderboard
    try {
      const { data, error } = await this.client.rpc('get_referral_leaderboard', { p_limit: limit });
      if (!error && Array.isArray(data)) {
        return data.map((row: any) => ({
          referrerId: row.referrer_id,
          maskedName: maskEmail(row.masked_name || 'Sứ Giả Ẩn Danh'),
          referralCount: Number(row.referral_count) || 0,
          rewardXuEarned: Number(row.reward_xu_earned) || 0,
        }));
      }
    } catch {
      // Fallback nếu RPC chưa tồn tại trên remote Supabase
    }

    // 2. Resilience Fallback: Truy vấn trực tiếp từ bảng referrals
    const { data: referrals, error: refError } = await this.client
      .from('referrals')
      .select('referrer_id, reward_xu, status')
      .eq('status', 'completed');

    if (refError || !referrals || referrals.length === 0) {
      return [];
    }

    const counts = new Map<string, { count: number; totalXu: number }>();
    for (const r of referrals) {
      if (!r.referrer_id) continue;
      const current = counts.get(r.referrer_id) || { count: 0, totalXu: 0 };
      current.count += 1;
      current.totalXu += Number(r.reward_xu) || 10;
      counts.set(r.referrer_id, current);
    }

    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1].count - a[1].count || b[1].totalXu - a[1].totalXu)
      .slice(0, limit);

    if (sorted.length === 0) return [];

    const referrerIds = sorted.map(([id]) => id);
    const { data: profiles } = await this.client
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', referrerIds);

    const nameMap = new Map<string, string>();
    if (profiles) {
      for (const p of profiles) {
        if (p.user_id && p.display_name) {
          nameMap.set(p.user_id, p.display_name);
        }
      }
    }

    return sorted.map(([id, stats]) => ({
      referrerId: id,
      maskedName: maskEmail(nameMap.get(id) || 'Sứ Giả Ẩn Danh'),
      referralCount: stats.count,
      rewardXuEarned: stats.totalXu,
    }));
  }
}

