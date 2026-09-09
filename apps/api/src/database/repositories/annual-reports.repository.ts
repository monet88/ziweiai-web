import { Injectable } from '@nestjs/common';
import { type AnnualReportRecord } from '../persistence-mappers';
import { SupabaseBaseRepository } from './supabase-base.repository';
import { toAnnualReportRecord } from '../persistence-mappers';

@Injectable()
export class AnnualReportsRepository extends SupabaseBaseRepository {
  async findAnnualReportByChartAndYear(
    ownerUserId: string,
    chartSnapshotId: string,
    year: number,
  ): Promise<AnnualReportRecord | null> {
    const { data, error } = await this.client
      .from('annual_reports')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('chart_snapshot_id', chartSnapshotId)
      .eq('year', year)
      .maybeSingle();
    this.throwIfError(error);
    return data ? toAnnualReportRecord(data) : null;
  }

  async findLatestAnnualReportByChartId(
    ownerUserId: string,
    chartSnapshotId: string,
  ): Promise<AnnualReportRecord | null> {
    const { data, error } = await this.client
      .from('annual_reports')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('chart_snapshot_id', chartSnapshotId)
      .order('year', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    this.throwIfError(error);
    return data ? toAnnualReportRecord(data) : null;
  }

  async findLatestAnnualReportsForCharts(
    ownerUserId: string,
    chartSnapshotIds: string[],
  ): Promise<Record<string, AnnualReportRecord>> {
    if (chartSnapshotIds.length === 0) {
      return {};
    }

    const uniqueIds = [...new Set(chartSnapshotIds)];
    const { data, error } = await this.client
      .from('annual_reports')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .in('chart_snapshot_id', uniqueIds)
      .order('chart_snapshot_id', { ascending: true })
      .order('year', { ascending: false })
      .order('created_at', { ascending: false });
    this.throwIfError(error);

    const latestByChartId: Record<string, AnnualReportRecord> = {};
    for (const row of data ?? []) {
      const record = toAnnualReportRecord(row);
      if (!latestByChartId[record.chartSnapshotId]) {
        latestByChartId[record.chartSnapshotId] = record;
      }
    }

    return latestByChartId;
  }

  async createAnnualReport(params: {
    ownerUserId: string;
    chartSnapshotId: string;
    year: number;
    markdown: string;
    providerMetadata: Record<string, string>;
  }): Promise<AnnualReportRecord> {
    const { data, error } = await this.client
      .from('annual_reports')
      .insert({
        owner_user_id: params.ownerUserId,
        chart_snapshot_id: params.chartSnapshotId,
        year: params.year,
        markdown: params.markdown,
        provider_metadata: params.providerMetadata,
      })
      .select('*')
      .single();

    if (error && (error as { code?: string }).code === '23505') {
      const existing = await this.findAnnualReportByChartAndYear(params.ownerUserId, params.chartSnapshotId, params.year);
      if (existing) {
        return existing;
      }
      throw new Error('Không thể ghi báo cáo năm do xung đột ghi đồng thời. Vui lòng thử lại.');
    }
    this.throwIfError(error);
    return toAnnualReportRecord(data);
  }
}
