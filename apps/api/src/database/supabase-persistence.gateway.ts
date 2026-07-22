import { Inject, Injectable } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import {
  type BirthInput,
  type BirthProfileRecord,
  type ChartSnapshot,
  type ChartSnapshotRecord,
  type ExplanationRequestRecord,
  type ExplanationResultRecord,
  type VisionResultRecord,
  type VisionKind,
  type HistoryViewRecord,
  type NormalizedBirth,
  type PromptStorageMode,
  type CacheScope,
  type ConversationRecord,
  type ConversationMessageRecord,
  type DivinationContextRecord,
  type DivinationPurposeKey,
  type ProfileRecord,
  type ReferralRecord,
} from '@ziweiai/contracts';
import { SUPABASE_CLIENT } from './supabase-client';
import {
  type AnnualReportRecord,
  type SupabaseRow,
  toAnnualReportRecord,
  toBirthProfileRecord,
  toChartSnapshotRecord,
  toConversationMessageRecord,
  toConversationRecord,
  toDivinationContextRecord,
  toExplanationRequestRecord,
  toExplanationResultRecord,
  toHistoryViewRecord,
  toVisionResultRecord,
  toProfileRecord,
  toReferralRecord,
} from './persistence-mappers';

export type { AnnualReportRecord } from './persistence-mappers';

// Trần phòng thủ cho danh sách hội thoại theo một lá số (listConversationsForChart). Query không có
// pagination/cursor; con số này đủ rộng cho mọi ca thực tế nhưng chặn payload vô hạn nếu một lá số
// bị tạo bất thường nhiều hội thoại. Kết quả newest-first nên trần cắt bỏ hội thoại cũ nhất.
const MAX_CONVERSATIONS_PER_CHART = 200;

@Injectable()
export class SupabasePersistenceGateway {
  // Client được inject qua DI (SUPABASE_CLIENT) thay vì tự `createClient` trong constructor: dời
  // seam ra khỏi gateway để test có thể cấp một client thay thế qua interface (Stage A của #38).
  constructor(@Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient) {}

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
    return data && data[0] ? toBirthProfileRecord(data[0]) : null;
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
    return toBirthProfileRecord(data);
  }

  async findChartSnapshotByDedupeKey(ownerUserId: string, snapshotDedupeKey: string): Promise<ChartSnapshotRecord | null> {
    const { data, error } = await this.client
      .from('chart_snapshots')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('snapshot_dedupe_key', snapshotDedupeKey)
      .maybeSingle();
    this.throwIfError(error);
    return data ? toChartSnapshotRecord(data) : null;
  }

  async findChartSnapshotById(ownerUserId: string, chartSnapshotId: string): Promise<ChartSnapshotRecord | null> {
    const { data, error } = await this.client
      .from('chart_snapshots')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('id', chartSnapshotId)
      .maybeSingle();
    this.throwIfError(error);
    return data ? toChartSnapshotRecord(data) : null;
  }

  async findPublicChartSnapshotById(chartSnapshotId: string): Promise<ChartSnapshotRecord | null> {
    // Used for social sharing. Bypasses owner_user_id check because chartSnapshotId is an unguessable UUID.
    const { data, error } = await this.client
      .from('chart_snapshots')
      .select('*')
      .eq('id', chartSnapshotId)
      .maybeSingle();
    this.throwIfError(error);
    return data ? toChartSnapshotRecord(data) : null;
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
        const record = toChartSnapshotRecord(row);
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
    return toChartSnapshotRecord(data);
  }

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

    // Keep the latest context per snapshot (rows arrive newest-first; first wins).
    const byChartId: Record<string, DivinationContextRecord> = {};
    for (const row of data ?? []) {
      const record = toDivinationContextRecord(row);
      if (!byChartId[record.chartSnapshotId]) {
        byChartId[record.chartSnapshotId] = record;
      }
    }
    return byChartId;
  }

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

  // US-017 follow-up (decision 0023): persist a vision reading (Xem Tướng / Xem Tay).
  // Mirrors createExplanationResult but has no chart snapshot / request row — vision is a
  // standalone reading keyed only by owner + kind + image path.
  async createVisionResult(params: {
    ownerUserId: string;
    kind: VisionKind;
    imagePath: string;
    question: string | null;
    renderedMarkdown: string;
    providerMetadata: Record<string, string>;
  }): Promise<VisionResultRecord> {
    const { data, error } = await this.client
      .from('vision_results')
      .insert({
        owner_user_id: params.ownerUserId,
        kind: params.kind,
        image_path: params.imagePath,
        question: params.question,
        rendered_markdown: params.renderedMarkdown,
        provider_metadata: params.providerMetadata,
      })
      .select('*')
      .single();
    this.throwIfError(error);
    return toVisionResultRecord(data);
  }

  async findVisionResultsByIds(ownerUserId: string, visionResultIds: string[]): Promise<Record<string, VisionResultRecord>> {
    if (visionResultIds.length === 0) {
      return {};
    }

    const uniqueIds = [...new Set(visionResultIds)];
    const { data, error } = await this.client
      .from('vision_results')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .in('id', uniqueIds);
    this.throwIfError(error);

    return Object.fromEntries(
      (data ?? []).map((row: SupabaseRow) => {
        const record = toVisionResultRecord(row);
        return [record.id, record];
      }),
    );
  }

  async findVisionResultById(ownerUserId: string, visionResultId: string): Promise<VisionResultRecord | null> {
    const { data, error } = await this.client
      .from('vision_results')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('id', visionResultId)
      .maybeSingle();
    this.throwIfError(error);
    return data ? toVisionResultRecord(data) : null;
  }

  // US-017 follow-up (decision 0023): right-to-be-forgotten. Drop the vision row; the
  // history_views.vision_result_id FK is `on delete cascade`, so the linked history row goes
  // with it. Owner-scoped eq so a user can only delete their own reading.
  async deleteVisionResult(ownerUserId: string, visionResultId: string): Promise<void> {
    const { error } = await this.client
      .from('vision_results')
      .delete()
      .eq('owner_user_id', ownerUserId)
      .eq('id', visionResultId);
    this.throwIfError(error);
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

  async createConversation(params: {
    ownerUserId: string;
    chartSnapshotId: string;
    title?: string | null;
  }): Promise<ConversationRecord> {
    const { data, error } = await this.client
      .from('conversations')
      .insert({
        owner_user_id: params.ownerUserId,
        chart_snapshot_id: params.chartSnapshotId,
        title: params.title ?? null,
        status: 'active',
      })
      .select('*')
      .single();
    this.throwIfError(error);
    return toConversationRecord(data);
  }

  async listConversationsForChart(ownerUserId: string, chartSnapshotId: string): Promise<ConversationRecord[]> {
    const { data, error } = await this.client
      .from('conversations')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('chart_snapshot_id', chartSnapshotId)
      .order('created_at', { ascending: false })
      // Chặn trên phòng thủ: số hội thoại trên một lá số thực tế nhỏ, nhưng query không có
      // pagination/cursor nên cần một trần để một lá số bị tạo bất thường nhiều hội thoại không kéo
      // về payload không giới hạn. Newest-first nên trần cắt bỏ các hội thoại cũ nhất, không cắt mới.
      .limit(MAX_CONVERSATIONS_PER_CHART);
    this.throwIfError(error);
    return (data ?? []).map((row: SupabaseRow) => toConversationRecord(row));
  }

  async findConversationById(ownerUserId: string, conversationId: string): Promise<ConversationRecord | null> {
    const { data, error } = await this.client
      .from('conversations')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('id', conversationId)
      .maybeSingle();
    this.throwIfError(error);
    return data ? toConversationRecord(data) : null;
  }

  async createConversationMessage(params: {
    ownerUserId: string;
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    quickPromptKey?: string | null;
    providerName?: string | null;
    providerMetadata?: Record<string, string>;
  }): Promise<ConversationMessageRecord> {
    const { data, error } = await this.client
      .from('conversation_messages')
      .insert({
        owner_user_id: params.ownerUserId,
        conversation_id: params.conversationId,
        role: params.role,
        content: params.content,
        quick_prompt_key: params.quickPromptKey ?? null,
        provider_name: params.providerName ?? null,
        provider_metadata: params.providerMetadata ?? {},
      })
      .select('*')
      .single();
    this.throwIfError(error);
    return toConversationMessageRecord(data);
  }

  async listRecentConversationMessages(ownerUserId: string, conversationId: string, limit: number): Promise<ConversationMessageRecord[]> {
    const { data, error } = await this.client
      .from('conversation_messages')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);
    this.throwIfError(error);
    const records = (data ?? []).map((row: SupabaseRow) => toConversationMessageRecord(row));
    // Reverse to chronological order (oldest of the recent window first)
    return records.reverse();
  }

  /**
   * Đếm số LƯỢT hỏi (user turn) kể từ `sinceIso` cho quota hội thoại signed-in. Mỗi lượt thành công
   * ghi 2 row (user + assistant); chỉ đếm role='user' để khớp điểm enforce per-turn — nếu đếm cả hai,
   * trần 30 sẽ chặn signed-in sau 15 lượt trong khi anon (đếm 1 lần/request) được 30 lượt.
   */
  async countConversationUserMessagesSince(ownerUserId: string, sinceIso: string): Promise<number> {
    const { count, error } = await this.client
      .from('conversation_messages')
      .select('*', { count: 'exact', head: true })
      .eq('owner_user_id', ownerUserId)
      .eq('role', 'user')
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
    return data ? toAnnualReportRecord(data) : null;
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
    return toAnnualReportRecord(data);
  }

  async deductXU(ownerUserId: string, amount: number): Promise<boolean> {
    const { data, error } = await this.client.rpc('log_xu_transaction', {
      p_user_id: ownerUserId,
      p_amount: -amount, // Trừ XU nên amount phải là số âm
      p_transaction_type: 'ai_usage',
    });
    
    if (error) {
      return false;
    }
    
    return data === true;
  }

  // --- Admin Methods ---
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
      // Fallback if auth.admin fails
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

  private throwIfError(error: { message: string } | null): void {
    if (error) {
      throw new Error(error.message);
    }
  }
}
