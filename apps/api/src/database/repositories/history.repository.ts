import { Injectable } from '@nestjs/common';
import { type HistoryViewRecord } from '@ziweiai/contracts';
import { SupabaseBaseRepository } from './supabase-base.repository';
import { toHistoryViewRecord, type SupabaseRow } from '../persistence-mappers';

@Injectable()
export class HistoryRepository extends SupabaseBaseRepository {
  async createHistoryView(params: {
    ownerUserId: string;
    chartSnapshotId: string | null;
    explanationResultId: string | null;
    visionResultId?: string | null;
  }): Promise<HistoryViewRecord> {
    const { data, error } = await this.client
      .from('history_views')
      .insert({
        owner_user_id: params.ownerUserId,
        chart_snapshot_id: params.chartSnapshotId,
        explanation_result_id: params.explanationResultId,
        vision_result_id: params.visionResultId ?? null,
      })
      .select('*')
      .single();
    this.throwIfError(error);
    return toHistoryViewRecord(data);
  }

  async listHistoryViews(ownerUserId: string, limit: number): Promise<HistoryViewRecord[]> {
    const { data, error } = await this.client
      .from('history_views')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .order('viewed_at', { ascending: false })
      .limit(limit);
    this.throwIfError(error);
    return (data ?? []).map((row: SupabaseRow) => toHistoryViewRecord(row));
  }
}
