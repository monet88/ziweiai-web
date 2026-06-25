import { z } from 'zod';
import { birthInputSchema } from '../chart/birth-input';
import { chartSnapshotSchema } from '../chart/chart-snapshot';
import { chartSystemSchema } from '../chart/chart-system';
import { normalizedBirthSchema } from '../chart/chart-metadata';

export const explanationRequestStateSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
]);

export const promptStorageModeSchema = z.enum(['not_stored', 'consented_redacted']);
export const cacheScopeSchema = z.enum(['user_snapshot', 'reference_only']);

export const profileRecordSchema = z.object({
  userId: z.uuid(),
  displayName: z.string().min(1).nullable(),
  locale: z.string().min(2),
  timezone: z.string().min(1).nullable(),
});

export const birthProfileRecordSchema = z.object({
  id: z.uuid(),
  ownerUserId: z.uuid(),
  isActive: z.boolean(),
  rawBirthInput: birthInputSchema,
  normalizedBirth: normalizedBirthSchema,
  inputHashDigest: z.string().min(32),
  retentionMode: z.enum(['persistent', 'delete_on_user_request']),
  deletedAt: z.iso.datetime().nullable(),
});

export const chartSnapshotRecordSchema = z.object({
  id: z.uuid(),
  ownerUserId: z.uuid(),
  birthProfileId: z.uuid().nullable(),
  chartSystem: chartSystemSchema,
  snapshotDedupeKey: z.string().min(16),
  snapshot: chartSnapshotSchema,
  inputHashDigest: z.string().min(32),
  confidenceLevel: z.string().min(1),
  createdAt: z.iso.datetime(),
});

export const explanationRequestRecordSchema = z.object({
  id: z.uuid(),
  ownerUserId: z.uuid(),
  chartSnapshotId: z.uuid(),
  idempotencyKey: z.string().min(16),
  requestState: explanationRequestStateSchema,
  providerName: z.string().min(1),
  promptStorageMode: promptStorageModeSchema,
  failureRetainsUntil: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const explanationResultRecordSchema = z.object({
  id: z.uuid(),
  ownerUserId: z.uuid(),
  explanationRequestId: z.uuid(),
  chartSnapshotId: z.uuid(),
  cacheScope: cacheScopeSchema,
  renderedMarkdown: z.string().min(1),
  providerMetadata: z.record(z.string(), z.string()),
  createdAt: z.iso.datetime(),
});

export const conversationStatusSchema = z.enum(['active', 'archived']);
export const conversationMessageRoleSchema = z.enum(['user', 'assistant']);

export const conversationRecordSchema = z.object({
  id: z.uuid(),
  ownerUserId: z.uuid(),
  chartSnapshotId: z.uuid(),
  title: z.string().min(1).nullable(),
  status: conversationStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const conversationMessageRecordSchema = z.object({
  id: z.uuid(),
  ownerUserId: z.uuid(),
  conversationId: z.uuid(),
  role: conversationMessageRoleSchema,
  content: z.string().trim().min(1),
  quickPromptKey: z.string().min(1).nullable(),
  providerName: z.string().min(1).nullable(),
  providerMetadata: z.record(z.string(), z.string()),
  createdAt: z.iso.datetime(),
});

export const historyViewRecordSchema = z.object({
  id: z.uuid(),
  ownerUserId: z.uuid(),
  chartSnapshotId: z.uuid().nullable(),
  explanationResultId: z.uuid().nullable(),
  viewedAt: z.iso.datetime(),
});

// US-025 (decision 0021): the four time-based divination systems are cast "now"
// for a specific question. The snapshot stays pure engine output; the question +
// purpose live in this separate context record linked to the snapshot, so
// history/sharing can show them and explanations can target the inquiry.
export const divinationPurposeKeySchema = z.enum([
  'career',
  'love',
  'wealth',
  'health',
  'decision',
  'custom',
]);

export const divinationContextRecordSchema = z
  .object({
    id: z.uuid(),
    ownerUserId: z.uuid(),
    chartSnapshotId: z.uuid(),
    question: z.string().trim().min(1),
    purposeKey: divinationPurposeKeySchema,
    // Free-text label only when purposeKey === 'custom'; null otherwise.
    purposeCustom: z.string().trim().min(1).nullable(),
    castAt: z.iso.datetime(),
    createdAt: z.iso.datetime(),
  })
  .superRefine((value, ctx) => {
    // purposeCustom is the free-text label, valid only for the 'custom' preset.
    if (value.purposeKey === 'custom' && value.purposeCustom === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['purposeCustom'],
        message: 'purposeCustom is required when purposeKey is "custom".',
      });
    }
    if (value.purposeKey !== 'custom' && value.purposeCustom !== null) {
      ctx.addIssue({
        code: 'custom',
        path: ['purposeCustom'],
        message: 'purposeCustom is only allowed when purposeKey is "custom".',
      });
    }
  });

export type ExplanationRequestState = z.infer<typeof explanationRequestStateSchema>;
export type PromptStorageMode = z.infer<typeof promptStorageModeSchema>;
export type CacheScope = z.infer<typeof cacheScopeSchema>;
export type ConversationStatus = z.infer<typeof conversationStatusSchema>;
export type ConversationMessageRole = z.infer<typeof conversationMessageRoleSchema>;
export type ProfileRecord = z.infer<typeof profileRecordSchema>;
export type BirthProfileRecord = z.infer<typeof birthProfileRecordSchema>;
export type ChartSnapshotRecord = z.infer<typeof chartSnapshotRecordSchema>;
export type ExplanationRequestRecord = z.infer<typeof explanationRequestRecordSchema>;
export type ExplanationResultRecord = z.infer<typeof explanationResultRecordSchema>;
export type ConversationRecord = z.infer<typeof conversationRecordSchema>;
export type ConversationMessageRecord = z.infer<typeof conversationMessageRecordSchema>;
export type HistoryViewRecord = z.infer<typeof historyViewRecordSchema>;
export type DivinationPurposeKey = z.infer<typeof divinationPurposeKeySchema>;
export type DivinationContextRecord = z.infer<typeof divinationContextRecordSchema>;
