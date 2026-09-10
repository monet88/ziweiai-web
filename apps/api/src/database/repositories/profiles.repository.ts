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
}
