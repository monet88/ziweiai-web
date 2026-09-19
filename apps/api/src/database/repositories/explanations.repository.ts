import { Injectable } from '@nestjs/common';
import { type ExplanationRequestRecord, type ExplanationResultRecord, type PromptStorageMode, type CacheScope } from '@ziweiai/contracts';
import { SupabaseBaseRepository } from './supabase-base.repository';
import { toExplanationRequestRecord, toExplanationResultRecord, type SupabaseRow } from '../persistence-mappers';

@Injectable()
export class ExplanationsRepository extends SupabaseBaseRepository {
  async findExplanationRequestByIdempotencyKey(ownerUserId: string, idempotencyKey: string): Promise<ExplanationRequestRecord | null> {
    const { data, error } = await this.client
      .from('explanation_requests')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    this.throwIfError(error);
    return data ? toExplanationRequestRecord(data) : null;
  }

  async createExplanationRequest(params: {
    ownerUserId: string;
    chartSnapshotId: string;
    idempotencyKey: string;
    providerName: string;
    promptStorageMode: PromptStorageMode;
    failureRetainsUntil: string | null;
  }): Promise<ExplanationRequestRecord> {
    const { data, error } = await this.client
      .from('explanation_requests')
      .insert({
        owner_user_id: params.ownerUserId,
        chart_snapshot_id: params.chartSnapshotId,
        idempotency_key: params.idempotencyKey,
        request_state: 'pending',
        provider_name: params.providerName,
        prompt_storage_mode: params.promptStorageMode,
        failure_retains_until: params.failureRetainsUntil,
      })
      .select('*')
      .single();
    this.throwIfError(error);
    return toExplanationRequestRecord(data);
  }

  async updateExplanationRequest(params: {
    ownerUserId: string;
    requestId: string;
    requestState: ExplanationRequestRecord['requestState'];
    failureRetainsUntil?: string | null;
  }): Promise<ExplanationRequestRecord> {
    const patch: Record<string, string | null> = {
      request_state: params.requestState,
      updated_at: new Date().toISOString(),
    };
    if (params.failureRetainsUntil !== undefined) {
      patch.failure_retains_until = params.failureRetainsUntil;
    }

    const { data, error } = await this.client
      .from('explanation_requests')
      .update(patch)
      .eq('owner_user_id', params.ownerUserId)
      .eq('id', params.requestId)
      .select('*')
      .single();
    this.throwIfError(error);
    return toExplanationRequestRecord(data);
  }

  async tryClaimExplanationRequest(params: {
    ownerUserId: string;
    requestId: string;
    expectedUpdatedAt: string;
    nextState: ExplanationRequestRecord['requestState'];
    failureRetainsUntil?: string | null;
  }): Promise<ExplanationRequestRecord | null> {
    const patch: Record<string, string | null> = {
      request_state: params.nextState,
      updated_at: new Date().toISOString(),
    };
    if (params.failureRetainsUntil !== undefined) {
      patch.failure_retains_until = params.failureRetainsUntil;
    }

    const { data, error } = await this.client
      .from('explanation_requests')
      .update(patch)
      .eq('owner_user_id', params.ownerUserId)
      .eq('id', params.requestId)
      .eq('updated_at', params.expectedUpdatedAt)
      .select('*')
      .maybeSingle();
    this.throwIfError(error);
    return data ? toExplanationRequestRecord(data) : null;
  }

  async findExplanationResultByRequestId(ownerUserId: string, requestId: string): Promise<ExplanationResultRecord | null> {
    const { data, error } = await this.client
      .from('explanation_results')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('explanation_request_id', requestId)
      .maybeSingle();
    this.throwIfError(error);
    return data ? toExplanationResultRecord(data) : null;
  }

  async listExplanationResultsForChart(ownerUserId: string, chartSnapshotId: string): Promise<ExplanationResultRecord[]> {
    const { data, error } = await this.client
      .from('explanation_results')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('chart_snapshot_id', chartSnapshotId)
      .order('created_at', { ascending: false });
    this.throwIfError(error);
    return (data ?? []).map((row: SupabaseRow) => toExplanationResultRecord(row));
  }

  async findLatestExplanationResultForChart(ownerUserId: string, chartSnapshotId: string): Promise<ExplanationResultRecord | null> {
    const { data, error } = await this.client
      .from('explanation_results')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('chart_snapshot_id', chartSnapshotId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    this.throwIfError(error);
    return data ? toExplanationResultRecord(data) : null;
  }

  async findLatestExplanationResultsForCharts(ownerUserId: string, chartSnapshotIds: string[]): Promise<Record<string, ExplanationResultRecord>> {
    if (chartSnapshotIds.length === 0) {
      return {};
    }

    const uniqueIds = [...new Set(chartSnapshotIds)];
    const { data, error } = await this.client
      .from('explanation_results')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .in('chart_snapshot_id', uniqueIds)
      .order('chart_snapshot_id', { ascending: true })
      .order('created_at', { ascending: false });
    this.throwIfError(error);

    const latestByChartId: Record<string, ExplanationResultRecord> = {};
    for (const row of data ?? []) {
      const record = toExplanationResultRecord(row as SupabaseRow);
      if (!latestByChartId[record.chartSnapshotId]) {
        latestByChartId[record.chartSnapshotId] = record;
      }
    }

    return latestByChartId;
  }

  async findExplanationResultById(ownerUserId: string, explanationResultId: string): Promise<ExplanationResultRecord | null> {
    const { data, error } = await this.client
      .from('explanation_results')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('id', explanationResultId)
      .maybeSingle();
    this.throwIfError(error);
    return data ? toExplanationResultRecord(data) : null;
  }

  async findExplanationResultsByIds(ownerUserId: string, explanationResultIds: string[]): Promise<Record<string, ExplanationResultRecord>> {
    if (explanationResultIds.length === 0) {
      return {};
    }

    const uniqueIds = [...new Set(explanationResultIds)];
    const { data, error } = await this.client
      .from('explanation_results')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .in('id', uniqueIds);
    this.throwIfError(error);

    return Object.fromEntries(
      (data ?? []).map((row: SupabaseRow) => {
        const record = toExplanationResultRecord(row);
        return [record.id, record];
      }),
    );
  }

  async createExplanationResult(params: {
    ownerUserId: string;
    explanationRequestId: string;
    chartSnapshotId: string;
    cacheScope: CacheScope;
    renderedMarkdown: string;
    providerMetadata: Record<string, string>;
  }): Promise<ExplanationResultRecord> {
    const { data, error } = await this.client
      .from('explanation_results')
      .insert({
        owner_user_id: params.ownerUserId,
        explanation_request_id: params.explanationRequestId,
        chart_snapshot_id: params.chartSnapshotId,
        cache_scope: params.cacheScope,
        rendered_markdown: params.renderedMarkdown,
        provider_metadata: params.providerMetadata,
      })
      .select('*')
      .single();
    this.throwIfError(error);
    return toExplanationResultRecord(data);
  }

  async countExplanationRequestsSince(ownerUserId: string, sinceIso: string): Promise<number> {
    const { count, error } = await this.client
      .from('explanation_requests')
      .select('*', { count: 'exact', head: true })
      .eq('owner_user_id', ownerUserId)
      .gte('created_at', sinceIso);
    this.throwIfError(error);
    return count ?? 0;
  }
}
