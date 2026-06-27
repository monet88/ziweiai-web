import {
  birthProfileRecordSchema,
  chartSnapshotRecordSchema,
  explanationRequestRecordSchema,
  explanationResultRecordSchema,
  visionResultRecordSchema,
  historyViewRecordSchema,
  conversationRecordSchema,
  conversationMessageRecordSchema,
  divinationContextRecordSchema,
  type BirthProfileRecord,
  type ChartSnapshotRecord,
  type ExplanationRequestRecord,
  type ExplanationResultRecord,
  type VisionResultRecord,
  type HistoryViewRecord,
  type ConversationRecord,
  type ConversationMessageRecord,
  type DivinationContextRecord,
} from '@ziweiai/contracts';
import { normalizePostgresTimestamp } from './postgres-timestamp';

// Hàm thuần map row (snake_case từ Postgres) sang record (camelCase, đã validate qua zod). Tách khỏi
// gateway vì đây là phần behavior thật cần test, lại là in-process thuần (một row vào, một record ra) —
// test thẳng qua interface này, không cần DB hay client thay thế (B1' của #38). Gateway chỉ còn lo
// dựng query rồi uỷ các hàng này.
export type SupabaseRow = Record<string, unknown>;

/** Bản ghi cache báo cáo năm (US-016). Không phải public contract — chỉ dùng nội bộ server. */
export interface AnnualReportRecord {
  id: string;
  ownerUserId: string;
  chartSnapshotId: string;
  year: number;
  markdown: string;
  createdAt: string | null;
}

// provider_metadata lưu JSON tự do; ép mọi value về string (record contract yêu cầu Record<string,string>).
// Row thiếu/không phải object → {} để schema thấy map rỗng hợp lệ thay vì undefined.
function coerceProviderMetadata(providerMetadataRow: unknown): Record<string, string> {
  return providerMetadataRow && typeof providerMetadataRow === 'object'
    ? Object.fromEntries(
        Object.entries(providerMetadataRow as Record<string, unknown>).map(([key, value]) => [key, String(value)]),
      )
    : {};
}

export function toBirthProfileRecord(row: SupabaseRow): BirthProfileRecord {
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

export function toChartSnapshotRecord(row: SupabaseRow): ChartSnapshotRecord {
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

export function toDivinationContextRecord(row: SupabaseRow): DivinationContextRecord {
  return divinationContextRecordSchema.parse({
    id: row.id,
    ownerUserId: row.owner_user_id,
    chartSnapshotId: row.chart_snapshot_id,
    question: row.question,
    purposeKey: row.purpose_key,
    purposeCustom: row.purpose_custom ?? null,
    castAt: normalizePostgresTimestamp(row.cast_at as string | null | undefined),
    createdAt: normalizePostgresTimestamp(row.created_at as string | null | undefined),
  });
}

export function toExplanationRequestRecord(row: SupabaseRow): ExplanationRequestRecord {
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

export function toExplanationResultRecord(row: SupabaseRow): ExplanationResultRecord {
  return explanationResultRecordSchema.parse({
    id: row.id,
    ownerUserId: row.owner_user_id,
    explanationRequestId: row.explanation_request_id,
    chartSnapshotId: row.chart_snapshot_id,
    cacheScope: row.cache_scope,
    renderedMarkdown: row.rendered_markdown,
    providerMetadata: coerceProviderMetadata(row.provider_metadata),
    createdAt: normalizePostgresTimestamp(row.created_at as string | null | undefined),
  });
}

export function toHistoryViewRecord(row: SupabaseRow): HistoryViewRecord {
  return historyViewRecordSchema.parse({
    id: row.id,
    ownerUserId: row.owner_user_id,
    chartSnapshotId: row.chart_snapshot_id,
    explanationResultId: row.explanation_result_id,
    visionResultId: row.vision_result_id ?? null,
    viewedAt: normalizePostgresTimestamp(row.viewed_at as string | null | undefined),
  });
}

export function toVisionResultRecord(row: SupabaseRow): VisionResultRecord {
  // Trim-or-null: a row may store '' / whitespace; collapse it so the schema
  // sees a non-empty string or null (never an empty string that fails min(1)).
  const rawQuestion = row.question as string | null;
  const trimmedQuestion = typeof rawQuestion === 'string' ? rawQuestion.trim() : null;

  return visionResultRecordSchema.parse({
    id: row.id,
    ownerUserId: row.owner_user_id,
    kind: row.kind,
    imagePath: row.image_path,
    question: trimmedQuestion && trimmedQuestion.length > 0 ? trimmedQuestion : null,
    renderedMarkdown: row.rendered_markdown,
    providerMetadata: coerceProviderMetadata(row.provider_metadata),
    createdAt: normalizePostgresTimestamp(row.created_at as string | null | undefined),
  });
}

export function toConversationRecord(row: SupabaseRow): ConversationRecord {
  return conversationRecordSchema.parse({
    id: row.id,
    ownerUserId: row.owner_user_id,
    chartSnapshotId: row.chart_snapshot_id,
    title: row.title ?? null,
    status: row.status,
    createdAt: normalizePostgresTimestamp(row.created_at as string | null | undefined),
    updatedAt: normalizePostgresTimestamp(row.updated_at as string | null | undefined),
  });
}

export function toConversationMessageRecord(row: SupabaseRow): ConversationMessageRecord {
  return conversationMessageRecordSchema.parse({
    id: row.id,
    ownerUserId: row.owner_user_id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    quickPromptKey: row.quick_prompt_key ?? null,
    providerName: row.provider_name ?? null,
    providerMetadata: coerceProviderMetadata(row.provider_metadata),
    createdAt: normalizePostgresTimestamp(row.created_at as string | null | undefined),
  });
}

// Báo cáo năm là bản ghi nội bộ server (không phải public contract) nên map trực tiếp,
// không qua zod schema như các record khác. `year` từ Postgres về dạng number sẵn.
export function toAnnualReportRecord(row: SupabaseRow): AnnualReportRecord {
  return {
    id: String(row.id),
    ownerUserId: String(row.owner_user_id),
    chartSnapshotId: String(row.chart_snapshot_id),
    year: Number(row.year),
    markdown: String(row.markdown),
    createdAt: normalizePostgresTimestamp(row.created_at as string | null | undefined),
  };
}
