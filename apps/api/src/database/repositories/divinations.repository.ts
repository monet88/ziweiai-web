import { Injectable } from '@nestjs/common';
import { type DivinationContextRecord, type DivinationPurposeKey } from '@ziweiai/contracts';
import { SupabaseBaseRepository } from './supabase-base.repository';
import { toDivinationContextRecord } from '../persistence-mappers';

@Injectable()
export class DivinationsRepository extends SupabaseBaseRepository {
  async createDivinationContext(params: {
    ownerUserId: string;
    chartSnapshotId: string;
    question: string;
    purposeKey: DivinationPurposeKey;
    purposeCustom: string | null;
    castAt: string;
  }): Promise<DivinationContextRecord> {
    const { data, error } = await this.client
      .from('divination_context')
      .insert({
        owner_user_id: params.ownerUserId,
        chart_snapshot_id: params.chartSnapshotId,
        question: params.question,
        purpose_key: params.purposeKey,
        purpose_custom: params.purposeCustom,
        cast_at: params.castAt,
      })
      .select('*')
      .single();
    this.throwIfError(error);
    return toDivinationContextRecord(data);
  }

  async findDivinationContextBySnapshotId(
    ownerUserId: string,
    chartSnapshotId: string,
  ): Promise<DivinationContextRecord | null> {
    const { data, error } = await this.client
      .from('divination_context')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('chart_snapshot_id', chartSnapshotId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    this.throwIfError(error);
    return data ? toDivinationContextRecord(data) : null;
  }

  async findDivinationContextsByChartIds(
    ownerUserId: string,
    chartSnapshotIds: string[],
  ): Promise<Record<string, DivinationContextRecord>> {
    if (chartSnapshotIds.length === 0) {
      return {};
    }
    const uniqueIds = [...new Set(chartSnapshotIds)];
    const { data, error } = await this.client
      .from('divination_context')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .in('chart_snapshot_id', uniqueIds)
      .order('created_at', { ascending: false });
    this.throwIfError(error);

    const byChartId: Record<string, DivinationContextRecord> = {};
    for (const row of data ?? []) {
      const record = toDivinationContextRecord(row);
      if (!byChartId[record.chartSnapshotId]) {
        byChartId[record.chartSnapshotId] = record;
      }
    }
    return byChartId;
  }
}
