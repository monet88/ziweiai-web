import { Injectable } from '@nestjs/common';
import { type ProfileRecord, type ReferralRecord } from '@ziweiai/contracts';
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
    return data ? data.map(toReferralRecord) : [];
  }
}
