import { Injectable } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  birthProfileRecordSchema,
  chartSnapshotRecordSchema,
  explanationRequestRecordSchema,
  explanationResultRecordSchema,
  historyViewRecordSchema,
  type BirthInput,
  type BirthProfileRecord,
  type ChartSnapshot,
  type ChartSnapshotRecord,
  type ExplanationRequestRecord,
  type ExplanationResultRecord,
  type HistoryViewRecord,
  type NormalizedBirth,
  type PromptStorageMode,
  type CacheScope,
} from '@ziweiai/contracts';
import { apiEnv } from '../config/env';
import { normalizePostgresTimestamp } from './postgres-timestamp';

type SupabaseRow = Record<string, unknown>;

/** Bản ghi cache báo cáo năm (US-016). Không phải public contract — chỉ dùng nội bộ server. */
export interface AnnualReportRecord {
  id: string;
  ownerUserId: string;
  chartSnapshotId: string;
  year: number;
  markdown: string;
  createdAt: string | null;
}

@Injectable()
export class SupabasePersistenceGateway {
  private readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(apiEnv.SUPABASE_URL, apiEnv.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  async findLatestBirthProfileByInputHash(ownerUserId: string, inputHashDigest: string): Promise<BirthProfileRecord | null> {
    const { data, error } = await this.client
      .from('birth_profiles')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('input_hash_digest', inputHashDigest)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1);
    this.throwIfError(error);
    return data && data[0] ? this.toBirthProfileRecord(data[0]) : null;
  }

  async createBirthProfile(params: {
    ownerUserId: string;
    rawBirthInput: BirthInput;
    normalizedBirth: NormalizedBirth;
    inputHashDigest: string;
    isActive: boolean;
  }): Promise<BirthProfileRecord> {
    if (params.isActive) {
      const { error: deactivateError } = await this.client
        .from('birth_profiles')
        .update({ is_active: false })
        .eq('owner_user_id', params.ownerUserId)
        .is('deleted_at', null);
      this.throwIfError(deactivateError);
    }

    const { data, error } = await this.client
      .from('birth_profiles')
      .insert({
        owner_user_id: params.ownerUserId,
        is_active: params.isActive,
        raw_birth_input_json: params.rawBirthInput,
        normalized_birth_json: params.normalizedBirth,
        input_hash_digest: params.inputHashDigest,
      })
      .select('*')
      .single();
    this.throwIfError(error);
    return this.toBirthProfileRecord(data);
  }

  async findChartSnapshotByDedupeKey(ownerUserId: string, snapshotDedupeKey: string): Promise<ChartSnapshotRecord | null> {
    const { data, error } = await this.client
      .from('chart_snapshots')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('snapshot_dedupe_key', snapshotDedupeKey)
      .maybeSingle();
    this.throwIfError(error);
    return data ? this.toChartSnapshotRecord(data) : null;
  }

  async findChartSnapshotById(ownerUserId: string, chartSnapshotId: string): Promise<ChartSnapshotRecord | null> {
    const { data, error } = await this.client
      .from('chart_snapshots')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('id', chartSnapshotId)
      .maybeSingle();
    this.throwIfError(error);
    return data ? this.toChartSnapshotRecord(data) : null;
  }

  async findChartSnapshotsByIds(ownerUserId: string, chartSnapshotIds: string[]): Promise<Record<string, ChartSnapshotRecord>> {
    if (chartSnapshotIds.length === 0) {
      return {};
    }

    const uniqueIds = [...new Set(chartSnapshotIds)];
    const { data, error } = await this.client
      .from('chart_snapshots')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .in('id', uniqueIds);
    this.throwIfError(error);

    return Object.fromEntries(
      (data ?? []).map((row: SupabaseRow) => {
        const record = this.toChartSnapshotRecord(row);
        return [record.id, record];
      }),
    );
  }

  async createChartSnapshot(params: {
    ownerUserId: string;
    birthProfileId: string | null;
    snapshotDedupeKey: string;
    snapshot: ChartSnapshot;
  }): Promise<ChartSnapshotRecord> {
    const { data, error } = await this.client
      .from('chart_snapshots')
      .insert({
        owner_user_id: params.ownerUserId,
        birth_profile_id: params.birthProfileId,
        chart_system: params.snapshot.chartSystem,
        snapshot_dedupe_key: params.snapshotDedupeKey,
        chart_snapshot_json: params.snapshot,
        engine_package: params.snapshot.engineVersion.enginePackage,
        engine_semver: params.snapshot.engineVersion.engineSemver,
        rule_source_name: params.snapshot.ruleSource.canonicalLibrary.name,
        rule_source_version: params.snapshot.ruleSource.canonicalLibrary.version,
        input_hash_digest: params.snapshot.inputHash.digest,
        confidence_level: params.snapshot.calculationConfidence.level,
      })
      .select('*')
      .single();
    this.throwIfError(error);
    return this.toChartSnapshotRecord(data);
  }

  async findExplanationRequestByIdempotencyKey(ownerUserId: string, idempotencyKey: string): Promise<ExplanationRequestRecord | null> {
    const { data, error } = await this.client
      .from('explanation_requests')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    this.throwIfError(error);
    return data ? this.toExplanationRequestRecord(data) : null;
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
    return this.toExplanationRequestRecord(data);
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
    return this.toExplanationRequestRecord(data);
  }

  // Claim nguyên tử bằng compare-and-swap theo VERSION (updated_at), không chỉ theo state.
  // Lý do dùng version thay vì chỉ request_state: chỉ so state sẽ hở hai kịch bản đua:
  //   (1) stale pending: claim pending -> pending không đổi state, predicate .eq('request_state','pending') vẫn
  //       đúng sau khi caller thứ nhất commit → caller thứ hai cũng claim được.
  //   (2) running bị khôi phục: caller A claim running -> pending rồi generate set lại running; caller B (đọc cũ)
  //       tới sau vẫn khớp running → cũng claim được.
  // Mọi transition đều bump updated_at, nên ràng buộc .eq('updated_at', expectedUpdatedAt) đảm bảo chỉ caller đọc
  // đúng phiên bản mới nhất mới thắng; kẻ thua (dòng đã bị caller khác đổi → updated_at khác) nhận null.
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
    return data ? this.toExplanationRequestRecord(data) : null;
  }

  async findExplanationResultByRequestId(ownerUserId: string, requestId: string): Promise<ExplanationResultRecord | null> {
    const { data, error } = await this.client
      .from('explanation_results')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('explanation_request_id', requestId)
      .maybeSingle();
    this.throwIfError(error);
    return data ? this.toExplanationResultRecord(data) : null;
  }

  async listExplanationResultsForChart(ownerUserId: string, chartSnapshotId: string): Promise<ExplanationResultRecord[]> {
    const { data, error } = await this.client
      .from('explanation_results')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('chart_snapshot_id', chartSnapshotId)
      .order('created_at', { ascending: false });
    this.throwIfError(error);
    return (data ?? []).map((row: SupabaseRow) => this.toExplanationResultRecord(row));
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
    return data ? this.toExplanationResultRecord(data) : null;
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
      const record = this.toExplanationResultRecord(row as SupabaseRow);
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
    return data ? this.toExplanationResultRecord(data) : null;
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
        const record = this.toExplanationResultRecord(row);
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
    return this.toExplanationResultRecord(data);
  }

  async createHistoryView(params: {
    ownerUserId: string;
    chartSnapshotId: string | null;
    explanationResultId: string | null;
  }): Promise<HistoryViewRecord> {
    const { data, error } = await this.client
      .from('history_views')
      .insert({
        owner_user_id: params.ownerUserId,
        chart_snapshot_id: params.chartSnapshotId,
        explanation_result_id: params.explanationResultId,
      })
      .select('*')
      .single();
    this.throwIfError(error);
    return this.toHistoryViewRecord(data);
  }

  async listHistoryViews(ownerUserId: string, limit: number): Promise<HistoryViewRecord[]> {
    const { data, error } = await this.client
      .from('history_views')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .order('viewed_at', { ascending: false })
      .limit(limit);
    this.throwIfError(error);
    return (data ?? []).map((row: SupabaseRow) => this.toHistoryViewRecord(row));
  }

  async countChartSnapshotsSince(ownerUserId: string, sinceIso: string): Promise<number> {
    const { count, error } = await this.client
      .from('chart_snapshots')
      .select('*', { count: 'exact', head: true })
      .eq('owner_user_id', ownerUserId)
      .gte('created_at', sinceIso);
    this.throwIfError(error);
    return count ?? 0;
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

  /** US-016: cache-hit báo cáo năm theo (chart, year). RLS owner-only chặn chéo user, nhưng vẫn lọc
   * owner_user_id để truy vấn dùng đúng index + rõ ý định. */
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
    return data ? this.toAnnualReportRecord(data) : null;
  }

  /**
   * US-016: tạo row báo cáo năm. Race hai caller cùng (chart, year): unique index
   * `annual_reports_chart_year_idx` chặn bản thứ hai → Postgres trả 23505. Bắt riêng mã này rồi
   * đọc lại row của caller thắng (idempotent) thay vì ném — đúng thiết kế "mỗi (chart, year) sinh 1 lần".
   */
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
      // Cực hiếm: unique violation nhưng re-read trống (row bị xóa xen giữa). Ném lỗi nghiệp vụ
      // rõ ràng thay vì để `throwIfError` rò raw message Postgres 23505 ra tầng trên.
      throw new Error('Không thể ghi báo cáo năm do xung đột ghi đồng thời. Vui lòng thử lại.');
    }
    this.throwIfError(error);
    return this.toAnnualReportRecord(data);
  }

  private toBirthProfileRecord(row: SupabaseRow): BirthProfileRecord {
    return birthProfileRecordSchema.parse({
      id: row.id,
      ownerUserId: row.owner_user_id,
      isActive: row.is_active,
      rawBirthInput: row.raw_birth_input_json,
      normalizedBirth: row.normalized_birth_json,
      inputHashDigest: row.input_hash_digest,
      retentionMode: row.retention_mode,
      deletedAt: normalizePostgresTimestamp(row.deleted_at as string | null | undefined),
    });
  }

  private toChartSnapshotRecord(row: SupabaseRow): ChartSnapshotRecord {
    return chartSnapshotRecordSchema.parse({
      id: row.id,
      ownerUserId: row.owner_user_id,
      birthProfileId: row.birth_profile_id,
      chartSystem: row.chart_system,
      snapshotDedupeKey: row.snapshot_dedupe_key,
      snapshot: row.chart_snapshot_json,
      inputHashDigest: row.input_hash_digest,
      confidenceLevel: row.confidence_level,
      createdAt: normalizePostgresTimestamp(row.created_at as string | null | undefined),
    });
  }

  private toExplanationRequestRecord(row: SupabaseRow): ExplanationRequestRecord {
    return explanationRequestRecordSchema.parse({
      id: row.id,
      ownerUserId: row.owner_user_id,
      chartSnapshotId: row.chart_snapshot_id,
      idempotencyKey: row.idempotency_key,
      requestState: row.request_state,
      providerName: row.provider_name,
      promptStorageMode: row.prompt_storage_mode,
      failureRetainsUntil: normalizePostgresTimestamp(row.failure_retains_until as string | null | undefined),
      createdAt: normalizePostgresTimestamp(row.created_at as string | null | undefined),
      updatedAt: normalizePostgresTimestamp(row.updated_at as string | null | undefined),
    });
  }

  private toExplanationResultRecord(row: SupabaseRow): ExplanationResultRecord {
    const providerMetadataRow = row.provider_metadata;
    const providerMetadata =
      providerMetadataRow && typeof providerMetadataRow === 'object'
        ? Object.fromEntries(
            Object.entries(providerMetadataRow as Record<string, unknown>).map(([key, value]) => [key, String(value)]),
          )
        : {};

    return explanationResultRecordSchema.parse({
      id: row.id,
      ownerUserId: row.owner_user_id,
      explanationRequestId: row.explanation_request_id,
      chartSnapshotId: row.chart_snapshot_id,
      cacheScope: row.cache_scope,
      renderedMarkdown: row.rendered_markdown,
      providerMetadata,
      createdAt: normalizePostgresTimestamp(row.created_at as string | null | undefined),
    });
  }

  private toHistoryViewRecord(row: SupabaseRow): HistoryViewRecord {
    return historyViewRecordSchema.parse({
      id: row.id,
      ownerUserId: row.owner_user_id,
      chartSnapshotId: row.chart_snapshot_id,
      explanationResultId: row.explanation_result_id,
      viewedAt: normalizePostgresTimestamp(row.viewed_at as string | null | undefined),
    });
  }

  // Báo cáo năm là bản ghi nội bộ server (không phải public contract) nên map trực tiếp,
  // không qua zod schema như các record khác. `year` từ Postgres về dạng number sẵn.
  private toAnnualReportRecord(row: SupabaseRow): AnnualReportRecord {
    return {
      id: String(row.id),
      ownerUserId: String(row.owner_user_id),
      chartSnapshotId: String(row.chart_snapshot_id),
      year: Number(row.year),
      markdown: String(row.markdown),
      createdAt: normalizePostgresTimestamp(row.created_at as string | null | undefined),
    };
  }

  private throwIfError(error: { message: string } | null): void {
    if (error) {
      throw new Error(error.message);
    }
  }
}
