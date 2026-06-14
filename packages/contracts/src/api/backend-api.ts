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
} from '../persistence/persistence-records';
import { chartSystemSchema } from '../chart/chart-system';

// Re-export chartSystemSchema as createChartSystemSchema for backward compatibility
export { chartSystemSchema as createChartSystemSchema };
export const apiErrorCodeSchema = z.enum([
  'UNAUTHORIZED',
  'FORBIDDEN',
  'INVALID_INPUT',
  'NOT_FOUND',
  'RATE_LIMITED',
  'PROVIDER_TIMEOUT',
  'PROVIDER_UNAVAILABLE',
  'INTERNAL_ERROR',
]);

export const authenticatedUserSchema = z.object({
  userId: z.uuid(),
  email: z.email().nullable(),
});

export const explanationKindSchema = z.enum(['overview', 'love', 'career', 'health', 'relationship']);
export const providerPreferenceSchema = z.enum(['auto', 'deepseek', 'openai-compat', 'gemini']);

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

export const createChartRequestSchema = z.object({
  birthInput: birthInputSchema,
  chartSystem: chartSystemSchema,
  makeActiveBirthProfile: z.boolean().default(true),
  viewYear: z.int().min(1900).max(2200).optional(),
});

export const createChartResponseSchema = z.object({
  snapshot: chartSnapshotSchema,
  chartRecord: chartSnapshotRecordSchema,
  birthProfile: birthProfileRecordSchema,
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

export const chartDetailResponseSchema = z.object({
  chartRecord: chartSnapshotRecordSchema,
  snapshot: chartSnapshotSchema,
  explanationResults: z.array(explanationResultRecordSchema),
});

export const historyItemSchema = z.object({
  view: historyViewRecordSchema,
  chartRecord: chartSnapshotRecordSchema.nullable(),
  explanationResult: explanationResultRecordSchema.nullable(),
});

export const historyListResponseSchema = z.object({
  items: z.array(historyItemSchema),
});

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;
export type ExplanationKind = z.infer<typeof explanationKindSchema>;
export type PalaceScope = z.infer<typeof palaceScopeSchema>;
export type ProviderPreference = z.infer<typeof providerPreferenceSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type CreateChartRequest = z.infer<typeof createChartRequestSchema>;
export type CreateChartResponse = z.infer<typeof createChartResponseSchema>;
export type CreateExplanationRequest = z.infer<typeof createExplanationRequestSchema>;
export type CreateExplanationResponse = z.infer<typeof createExplanationResponseSchema>;
export type ChartDetailResponse = z.infer<typeof chartDetailResponseSchema>;
export type HistoryItem = z.infer<typeof historyItemSchema>;
export type HistoryListResponse = z.infer<typeof historyListResponseSchema>;
