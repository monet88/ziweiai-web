import { z } from 'zod';
import { birthInputSchema } from '../chart/birth-input';
import { chartSnapshotSchema } from '../chart/chart-snapshot';
import { explanationContextSchema } from '../explanations/explanation-context';
import {
  birthProfileRecordSchema,
  chartSnapshotRecordSchema,
  explanationRequestRecordSchema,
  explanationResultRecordSchema,
  historyViewRecordSchema,
  conversationRecordSchema,
  conversationMessageRecordSchema,
  divinationContextRecordSchema,
  divinationPurposeKeySchema,
} from '../persistence/persistence-records';
import { implementedChartSystems } from '../chart/chart-system';

// POST /charts chỉ chấp nhận 6 hệ đã có adapter (implementedChartSystems), KHÔNG phải toàn
// bộ 12 hệ contract (chartSystemSchema). Nếu dùng chartSystemSchema, payload {chartSystem:'tarot'}
// qua được Zod rồi mới vỡ ở tầng adapter lookup với mã NOT_FOUND lệch nghĩa — invariant
// "POST /charts giới hạn ở implementedChartSystems" phải được chặn ngay tại schema.
export const createChartSystemSchema = z.enum(implementedChartSystems);
export const apiErrorCodeSchema = z.enum([
  'UNAUTHORIZED',
  'FORBIDDEN',
  'INVALID_INPUT',
  'NOT_FOUND',
  'RATE_LIMITED',
  'PROVIDER_TIMEOUT',
  'PROVIDER_UNAVAILABLE',
  'INTERNAL_ERROR',
  'PAYMENT_REQUIRED',
  // US-017: new error codes for extended systems
  'IDENTITY_REQUIRED',      // anon user hit face/palm (requires email identity)
  'FEATURE_DISABLED',       // feature flag off for a system
  'VISION_QUOTA_EXCEEDED',  // separate vision quota exceeded
]);

export const authenticatedUserSchema = z.object({
  userId: z.uuid(),
  email: z.email().nullable(),
});

export const explanationKindSchema = z.enum(['overview', 'love', 'career', 'health', 'relationship']);
export const providerPreferenceSchema = z.enum(['auto', 'deepseek', 'openai-compat', 'gemini']);
export const quickPromptKeySchema = z.enum(['overview', 'love', 'career', 'health', 'timing']);

export const createConversationRequestSchema = z.object({
  chartSnapshotId: z.uuid(),
  title: z.string().trim().min(1).max(120).optional(),
});

export const createConversationMessageRequestSchema = z
  .object({
    content: z.string().trim().min(1).max(2_000).optional(),
    quickPromptKey: quickPromptKeySchema.optional(),
    providerPreference: providerPreferenceSchema.default('auto'),
  })
  .refine((value) => Boolean(value.content) !== Boolean(value.quickPromptKey), {
    message: 'Gửi đúng một trong content hoặc quickPromptKey.',
    path: ['content'],
  });

// Phạm vi luận giải theo từng cung (12 cung an theo iztro nameKey) cộng hai mục vận hạn
// (decadal = Đại Vận, yearly = Lưu Niên — mục Lưu Niên gói luôn dữ liệu Tiểu Vận theo
// tuổi vào prompt). Tách khỏi explanationKind (chủ đề) để không phá vỡ luồng overview cũ;
// optional nên request overview hiện tại không cần gửi trường này.
export const palaceScopeSchema = z.enum([
  'soulPalace',
  'siblingsPalace',
  'spousePalace',
  'childrenPalace',
  'wealthPalace',
  'healthPalace',
  'surfacePalace',
  'friendsPalace',
  'careerPalace',
  'propertyPalace',
  'spiritPalace',
  'parentsPalace',
  'decadal',
  'yearly',
]);

export const apiErrorSchema = z.object({
  code: apiErrorCodeSchema,
  message: z.string().min(1),
  requestId: z.string().min(1).nullable(),
});

export const conversationStreamEventSchema = z.discriminatedUnion('type', [
  // delta carries raw streaming text. Whitespace between words is meaningful (the client
  // concatenates deltas), so allow any non-empty string — do NOT trim. Empty strings are still
  // rejected to catch real bugs. Trimming here would drop inter-word spaces and abort the stream.
  z.object({ type: z.literal('chunk'), delta: z.string().min(1) }),
  z.object({ type: z.literal('done'), message: conversationMessageRecordSchema }),
  z.object({ type: z.literal('error'), error: apiErrorSchema }),
]);

export const createChartRequestSchema = z.object({
  birthInput: birthInputSchema,
  chartSystem: createChartSystemSchema,
  makeActiveBirthProfile: z.boolean().default(true),
  viewYear: z.int().min(1900).max(2200).optional(),
});

export const createChartResponseSchema = z.object({
  snapshot: chartSnapshotSchema,
  chartRecord: chartSnapshotRecordSchema,
  birthProfile: birthProfileRecordSchema,
  reusedExistingSnapshot: z.boolean(),
});

// US-025 (decision 0021): POST /divinations is limited to the four time-based
// divination systems. Cast moment is always the server "now" (no client date),
// so the request carries no birthInput -- only the system, the mandatory
// question, and the purpose. Mirrors the createChartSystemSchema guard idea:
// reject any non-divination system at the schema boundary.
export const divinationChartSystems = [
  'mei-hua-yi-shu',
  'liu-yao',
  'da-liu-ren',
  'qi-men-dun-jia',
] as const;
export const divinationChartSystemSchema = z.enum(divinationChartSystems);

export const createDivinationRequestSchema = z
  .object({
    chartSystem: divinationChartSystemSchema,
    question: z.string().trim().min(1).max(500),
    purposeKey: divinationPurposeKeySchema,
    // Required (and only allowed) when purposeKey === 'custom'.
    purposeCustom: z.string().trim().min(1).max(120).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.purposeKey === 'custom' && !value.purposeCustom) {
      ctx.addIssue({
        code: 'custom',
        path: ['purposeCustom'],
        message: 'purposeCustom is required when purposeKey is "custom".',
      });
    }
    if (value.purposeKey !== 'custom' && value.purposeCustom) {
      ctx.addIssue({
        code: 'custom',
        path: ['purposeCustom'],
        message: 'purposeCustom is only allowed when purposeKey is "custom".',
      });
    }
  });

export const createDivinationResponseSchema = z.object({
  snapshot: chartSnapshotSchema,
  chartRecord: chartSnapshotRecordSchema,
  divinationContext: divinationContextRecordSchema,
  reusedExistingSnapshot: z.boolean(),
});

export const createExplanationRequestSchema = z.object({
  chartSnapshotId: z.uuid(),
  explanationKind: explanationKindSchema,
  // Khi có palaceScope, luận giải sinh riêng cho cung/vận hạn đó (14 mục Tử Vi).
  // Bỏ trống = luận giải tổng quan cả lá số (luồng overview cũ, giữ tương thích).
  palaceScope: palaceScopeSchema.optional(),
  providerPreference: providerPreferenceSchema.default('auto'),
  userConsentedToStorePrompt: z.boolean().default(false),
});

export const createExplanationResponseSchema = z.object({
  request: explanationRequestRecordSchema,
  result: explanationResultRecordSchema,
  explanationContext: explanationContextSchema,
});

export const createConversationResponseSchema = z.object({
  conversation: conversationRecordSchema,
});

export const conversationDetailResponseSchema = z.object({
  conversation: conversationRecordSchema,
  messages: z.array(conversationMessageRecordSchema),
});

export const conversationListResponseSchema = z.object({
  items: z.array(conversationRecordSchema),
});

export const chartDetailResponseSchema = z.object({
  chartRecord: chartSnapshotRecordSchema,
  snapshot: chartSnapshotSchema,
  explanationResults: z.array(explanationResultRecordSchema),
});

export const historyItemSchema = z.object({
  view: historyViewRecordSchema,
  chartRecord: chartSnapshotRecordSchema.nullable(),
  explanationResult: explanationResultRecordSchema.nullable(),
  // US-025: present only for the four time-based divination snapshots; null for
  // natal charts. Lets the history card show question + purpose + cast date.
  divinationContext: divinationContextRecordSchema.nullable(),
});

export const historyListResponseSchema = z.object({
  items: z.array(historyItemSchema),
});

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;
export type ExplanationKind = z.infer<typeof explanationKindSchema>;
export type QuickPromptKey = z.infer<typeof quickPromptKeySchema>;
export type PalaceScope = z.infer<typeof palaceScopeSchema>;
export type ProviderPreference = z.infer<typeof providerPreferenceSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type CreateChartRequest = z.infer<typeof createChartRequestSchema>;
export type CreateChartResponse = z.infer<typeof createChartResponseSchema>;
export type DivinationChartSystem = (typeof divinationChartSystems)[number];
export type CreateDivinationRequest = z.infer<typeof createDivinationRequestSchema>;
export type CreateDivinationResponse = z.infer<typeof createDivinationResponseSchema>;
export type CreateExplanationRequest = z.infer<typeof createExplanationRequestSchema>;
export type CreateExplanationResponse = z.infer<typeof createExplanationResponseSchema>;
export type CreateConversationRequest = z.infer<typeof createConversationRequestSchema>;
export type CreateConversationResponse = z.infer<typeof createConversationResponseSchema>;
export type CreateConversationMessageRequest = z.infer<typeof createConversationMessageRequestSchema>;
export type ConversationStreamEvent = z.infer<typeof conversationStreamEventSchema>;
export type ConversationDetailResponse = z.infer<typeof conversationDetailResponseSchema>;
export type ConversationListResponse = z.infer<typeof conversationListResponseSchema>;
export type ChartDetailResponse = z.infer<typeof chartDetailResponseSchema>;
export type HistoryItem = z.infer<typeof historyItemSchema>;
export type HistoryListResponse = z.infer<typeof historyListResponseSchema>;
