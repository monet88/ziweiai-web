import { describe, expect, it } from 'vitest';
import {
  toAnnualReportRecord,
  toChartSnapshotRecord,
  toConversationMessageRecord,
  toConversationRecord,
  toDivinationContextRecord,
  toExplanationRequestRecord,
  toExplanationResultRecord,
  toHistoryViewRecord,
  toVisionResultRecord,
  type SupabaseRow,
} from './persistence-mappers';

// B1' của #38: mapper là phần behavior thật của gateway (row snake_case → record camelCase + validate
// + normalize). Đây là hàm thuần in-process nên test thẳng qua một row vào, không cần DB/client.

// Snapshot tối thiểu hợp lệ (ba-zi) dùng cho toChartSnapshotRecord; lấy khuôn từ fixture router test.
const SNAPSHOT_FIXTURE = {
  snapshotId: 'fixture',
  birth: {
    originalInput: {
      calendar: 'gregorian',
      date: { year: 1990, month: 1, day: 1, isLeapMonth: null },
      time: { hour: 8, minute: 30, isUnknown: false },
      sexOrGenderForChart: 'female',
      place: { label: 'Manual', manual: { latitude: 10, longitude: 106, timezone: 'Asia/Ho_Chi_Minh' } },
      locale: 'vi-VN',
      source: 'test-fixture',
    },
    resolvedDateTime: {
      date: { year: 1990, month: 1, day: 1, isLeapMonth: null },
      time: { hour: 8, minute: 30, isUnknown: false },
      utcInstant: '1990-01-01T01:30:00.000Z',
    },
    resolvedLocation: { label: 'Manual', latitude: 10, longitude: 106, timezone: 'Asia/Ho_Chi_Minh', resolver: 'manual' },
    lunarDate: null,
    ganZhi: { yearPillar: null, monthPillar: null, dayPillar: null, hourPillar: null },
    trueSolarTime: { status: 'deferred', offsetMinutes: null, provider: null, confidence: 'medium' },
    normalizationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
  },
  chartSystem: 'ba-zi',
  palaces: [],
  pillars: [],
  summary: {},
  engineVersion: {
    enginePackage: '@ziweiai/astro-engine',
    engineSemver: '0.1.0',
    adapterVersions: [],
    fixtureSetVersion: 'phase-3-fixtures-v1',
    schemaVersion: 'phase-3-contracts-v1',
  },
  ruleSource: {
    system: 'ba-zi',
    canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
    ruleSet: 'phase-3-default',
    schoolNotes: null,
    sourcePriority: 'lunar-javascript-first',
  },
  inputHash: { algorithm: 'sha256', digest: '0123456789abcdef0123456789abcdef', saltPolicy: 'not-persisted' },
  calculationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
  provenance: {
    referenceRepos: ['.ref/lunar-javascript'],
    runtimeLibraries: [{ name: 'lunar-javascript', version: '1.7.7' }],
    adapterConfig: [{ key: 'configProfile', value: 'phase-3-default' }],
    fixtureEvidence: { fixtureSetId: 'phase-3-fixtures-v1', passed: true },
    calculationTimestamp: '2026-06-03T00:00:00.000Z',
    warnings: [],
  },
  createdAt: '2026-06-03T00:00:00.000Z',
};

const OWNER = '11111111-1111-4111-8111-111111111111';
const SNAPSHOT_ID = '22222222-2222-4222-8222-222222222222';

describe('toChartSnapshotRecord', () => {
  it('maps snake_case columns to a camelCase record and normalizes the timestamp', () => {
    const row: SupabaseRow = {
      id: SNAPSHOT_ID,
      owner_user_id: OWNER,
      birth_profile_id: null,
      chart_system: 'ba-zi',
      snapshot_dedupe_key: 'dedupe-key-0123456789',
      chart_snapshot_json: SNAPSHOT_FIXTURE,
      input_hash_digest: '0123456789abcdef0123456789abcdef',
      confidence_level: 'medium',
      created_at: '2026-06-07 11:17:21.337456+00',
    };

    const record = toChartSnapshotRecord(row);

    expect(record.ownerUserId).toBe(OWNER);
    expect(record.birthProfileId).toBeNull();
    expect(record.snapshotDedupeKey).toBe('dedupe-key-0123456789');
    // normalizePostgresTimestamp giữ nguyên microsecond, chỉ đổi sang dạng ISO 'T...Z'.
    expect(record.createdAt).toBe('2026-06-07T11:17:21.337456Z');
  });
});

describe('toExplanationResultRecord', () => {
  const baseRow: SupabaseRow = {
    id: '33333333-3333-4333-8333-333333333333',
    owner_user_id: OWNER,
    explanation_request_id: '44444444-4444-4444-8444-444444444444',
    chart_snapshot_id: SNAPSHOT_ID,
    cache_scope: 'user_snapshot',
    rendered_markdown: '## Luận giải',
    created_at: '2026-06-07T00:00:00.000Z',
  };

  it('coerces every provider_metadata value to a string', () => {
    const record = toExplanationResultRecord({
      ...baseRow,
      provider_metadata: { tokensIn: 100, model: 'deepseek', ok: true },
    });

    expect(record.providerMetadata).toEqual({ tokensIn: '100', model: 'deepseek', ok: 'true' });
  });

  it('defaults provider_metadata to an empty object when the column is null', () => {
    const record = toExplanationResultRecord({ ...baseRow, provider_metadata: null });
    expect(record.providerMetadata).toEqual({});
  });
});

describe('toVisionResultRecord', () => {
  const baseRow: SupabaseRow = {
    id: '55555555-5555-4555-8555-555555555555',
    owner_user_id: OWNER,
    kind: 'face',
    image_path: 'owner/face.png',
    rendered_markdown: '## Xem Tướng',
    provider_metadata: { provider: 'deepseek' },
    created_at: '2026-06-07T00:00:00.000Z',
  };

  it('collapses a whitespace-only question to null', () => {
    const record = toVisionResultRecord({ ...baseRow, question: '   ' });
    expect(record.question).toBeNull();
  });

  it('trims a real question', () => {
    const record = toVisionResultRecord({ ...baseRow, question: '  Sự nghiệp?  ' });
    expect(record.question).toBe('Sự nghiệp?');
  });
});

describe('toConversationMessageRecord', () => {
  const baseRow: SupabaseRow = {
    id: '66666666-6666-4666-8666-666666666666',
    owner_user_id: OWNER,
    conversation_id: '77777777-7777-4777-8777-777777777777',
    role: 'assistant',
    content: 'Xin chào',
    provider_metadata: { provider: 'deepseek' },
    created_at: '2026-06-07T00:00:00.000Z',
  };

  it('maps absent quick_prompt_key and provider_name to null', () => {
    const record = toConversationMessageRecord(baseRow);
    expect(record.quickPromptKey).toBeNull();
    expect(record.providerName).toBeNull();
  });
});

describe('toConversationRecord', () => {
  it('maps an absent title to null', () => {
    const record = toConversationRecord({
      id: '88888888-8888-4888-8888-888888888888',
      owner_user_id: OWNER,
      chart_snapshot_id: SNAPSHOT_ID,
      status: 'active',
      created_at: '2026-06-07T00:00:00.000Z',
      updated_at: '2026-06-07T00:00:00.000Z',
    });
    expect(record.title).toBeNull();
  });
});

describe('toDivinationContextRecord', () => {
  it('maps an absent purpose_custom to null for a non-custom purpose', () => {
    const record = toDivinationContextRecord({
      id: '99999999-9999-4999-8999-999999999999',
      owner_user_id: OWNER,
      chart_snapshot_id: SNAPSHOT_ID,
      question: 'Sự nghiệp năm nay?',
      purpose_key: 'career',
      cast_at: '2026-06-07T00:00:00.000Z',
      created_at: '2026-06-07T00:00:00.000Z',
    });
    expect(record.purposeCustom).toBeNull();
  });
});

describe('toExplanationRequestRecord', () => {
  it('normalizes a null failure_retains_until to null', () => {
    const record = toExplanationRequestRecord({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      owner_user_id: OWNER,
      chart_snapshot_id: SNAPSHOT_ID,
      idempotency_key: 'idempotency-key-0123',
      request_state: 'completed',
      provider_name: 'deepseek',
      prompt_storage_mode: 'not_stored',
      failure_retains_until: null,
      created_at: '2026-06-07T00:00:00.000Z',
      updated_at: '2026-06-07T00:00:00.000Z',
    });
    expect(record.failureRetainsUntil).toBeNull();
  });
});

describe('toHistoryViewRecord', () => {
  it('maps an absent vision_result_id to null', () => {
    const record = toHistoryViewRecord({
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      owner_user_id: OWNER,
      chart_snapshot_id: SNAPSHOT_ID,
      explanation_result_id: '33333333-3333-4333-8333-333333333333',
      viewed_at: '2026-06-07T00:00:00.000Z',
    });
    expect(record.visionResultId).toBeNull();
  });
});

describe('toAnnualReportRecord', () => {
  it('coerces id/year and normalizes created_at without a zod schema', () => {
    const record = toAnnualReportRecord({
      id: 123,
      owner_user_id: OWNER,
      chart_snapshot_id: SNAPSHOT_ID,
      year: '2026',
      markdown: '## Báo cáo năm',
      created_at: '2026-06-07 11:17:21+00',
    });

    expect(record.id).toBe('123');
    expect(record.year).toBe(2026);
    expect(record.createdAt).toBe('2026-06-07T11:17:21Z');
  });

  it('throws when a required string column is null/undefined', () => {
    expect(() =>
      toAnnualReportRecord({
        id: null,
        owner_user_id: OWNER,
        chart_snapshot_id: SNAPSHOT_ID,
        year: 2026,
        markdown: '## Báo cáo năm',
        created_at: null,
      }),
    ).toThrow(/id/);
  });

  it('throws when year is not a valid integer', () => {
    expect(() =>
      toAnnualReportRecord({
        id: 123,
        owner_user_id: OWNER,
        chart_snapshot_id: SNAPSHOT_ID,
        year: 'not-a-year',
        markdown: '## Báo cáo năm',
        created_at: null,
      }),
    ).toThrow(/year/);
  });
});
