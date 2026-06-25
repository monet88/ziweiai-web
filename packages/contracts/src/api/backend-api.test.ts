import { describe, expect, it } from 'vitest';
import { implementedChartSystems } from '../chart/chart-system';
import { chartSystemSchema } from '../chart/chart-system';
import {
  apiErrorCodeSchema,
  createChartRequestSchema,
  createDivinationRequestSchema,
  createExplanationRequestSchema,
  createConversationMessageRequestSchema,
  createConversationRequestSchema,
  conversationDetailResponseSchema,
  conversationStreamEventSchema,
  historyListResponseSchema,
} from './backend-api';

describe('backend API contracts', () => {
  it('accepts chart creation payloads', () => {
    const payload = createChartRequestSchema.parse({
      birthInput: {
        calendar: 'gregorian',
        date: { year: 1990, month: 1, day: 1, isLeapMonth: null },
        time: { hour: 8, minute: 30, isUnknown: false },
        sexOrGenderForChart: 'female',
        place: {
          label: 'Ho Chi Minh City',
          manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
        },
        locale: 'vi-VN',
        source: 'user-entered',
      },
      chartSystem: 'zi-wei-dou-shu',
      viewYear: 2032,
    });

    expect(payload.makeActiveBirthProfile).toBe(true);
    expect(payload.viewYear).toBe(2032);
  });

  it('rejects chart systems outside the create-chart API enum', () => {
    expect(() =>
      createChartRequestSchema.parse({
        birthInput: {
          calendar: 'gregorian',
          date: { year: 1990, month: 1, day: 1, isLeapMonth: null },
          time: { hour: 8, minute: 30, isUnknown: false },
          sexOrGenderForChart: 'female',
          place: {
            label: 'Ho Chi Minh City',
            manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
          },
          locale: 'vi-VN',
          source: 'user-entered',
        },
        chartSystem: 'unsupported-system',
      }),
    ).toThrow();
  });

  it('accepts chart systems declared for future phases at the contract layer', () => {
    expect(chartSystemSchema.parse('qi-men-dun-jia')).toBe('qi-men-dun-jia');
    expect(chartSystemSchema.parse('mei-hua-yi-shu')).toBe('mei-hua-yi-shu');
  });

  it('marks liu-yao as selectable in the implemented system list', () => {
    expect(implementedChartSystems).toContain('liu-yao');
  });

  it('defaults explanation provider preference to auto', () => {
    const payload = createExplanationRequestSchema.parse({
      chartSnapshotId: '0f8fad5b-d9cb-469f-a165-70867728950e',
      explanationKind: 'overview',
      userConsentedToStorePrompt: false,
    });

    expect(payload.providerPreference).toBe('auto');
    expect(payload.palaceScope).toBeUndefined();
  });

  it('accepts the openai-compat provider preference', () => {
    const payload = createExplanationRequestSchema.parse({
      chartSnapshotId: '0f8fad5b-d9cb-469f-a165-70867728950e',
      explanationKind: 'overview',
      providerPreference: 'openai-compat',
      userConsentedToStorePrompt: false,
    });

    expect(payload.providerPreference).toBe('openai-compat');
  });

  it('accepts an optional palace scope for per-palace explanations', () => {
    const payload = createExplanationRequestSchema.parse({
      chartSnapshotId: '0f8fad5b-d9cb-469f-a165-70867728950e',
      explanationKind: 'overview',
      palaceScope: 'careerPalace',
      userConsentedToStorePrompt: false,
    });

    expect(payload.palaceScope).toBe('careerPalace');
  });

  it('rejects an unknown palace scope value', () => {
    expect(() =>
      createExplanationRequestSchema.parse({
        chartSnapshotId: '0f8fad5b-d9cb-469f-a165-70867728950e',
        explanationKind: 'overview',
        palaceScope: 'notARealScope',
        userConsentedToStorePrompt: false,
      }),
    ).toThrow();
  });

  it('accepts newly enabled chart systems on the create-chart API', () => {
    const liuyaoPayload = createChartRequestSchema.parse({
      birthInput: {
        calendar: 'gregorian',
        date: { year: 1990, month: 1, day: 1, isLeapMonth: null },
        time: { hour: 8, minute: 30, isUnknown: false },
        sexOrGenderForChart: 'female',
        place: {
          label: 'Ho Chi Minh City',
          manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
        },
        locale: 'vi-VN',
        source: 'user-entered',
      },
      chartSystem: 'liu-yao',
    });

    const daliurenPayload = createChartRequestSchema.parse({
      birthInput: liuyaoPayload.birthInput,
      chartSystem: 'da-liu-ren',
    });

    expect(liuyaoPayload.chartSystem).toBe('liu-yao');
    expect(daliurenPayload.chartSystem).toBe('da-liu-ren');
  });

  it('accepts the US-017 extended-system API error codes and rejects unknown codes', () => {
    expect(apiErrorCodeSchema.parse('IDENTITY_REQUIRED')).toBe('IDENTITY_REQUIRED');
    expect(apiErrorCodeSchema.parse('FEATURE_DISABLED')).toBe('FEATURE_DISABLED');
    expect(apiErrorCodeSchema.parse('VISION_QUOTA_EXCEEDED')).toBe('VISION_QUOTA_EXCEEDED');
    expect(apiErrorCodeSchema.safeParse('UNKNOWN_CODE').success).toBe(false);
  });

  it('accepts an empty history list envelope', () => {
    const payload = historyListResponseSchema.parse({ items: [] });
    expect(payload.items).toHaveLength(0);
  });

  it('accepts conversation creation payloads', () => {
    const payload = createConversationRequestSchema.parse({
      chartSnapshotId: '0f8fad5b-d9cb-469f-a165-70867728950e',
      title: '  Hỏi nhanh về lá số  ',
    });

    expect(payload.chartSnapshotId).toBe('0f8fad5b-d9cb-469f-a165-70867728950e');
    expect(payload.title).toBe('Hỏi nhanh về lá số');
  });

  it('requires exactly one conversation message source', () => {
    expect(createConversationMessageRequestSchema.parse({ content: 'Hỏi về công việc' }).content).toBe('Hỏi về công việc');
    expect(createConversationMessageRequestSchema.parse({ quickPromptKey: 'career' }).quickPromptKey).toBe('career');
    expect(() => createConversationMessageRequestSchema.parse({})).toThrow();
    expect(() => createConversationMessageRequestSchema.parse({ content: 'Tự nhập', quickPromptKey: 'overview' })).toThrow();
  });

  it('rejects unknown quick prompt keys', () => {
    expect(() => createConversationMessageRequestSchema.parse({ quickPromptKey: 'ignore-all-rules' })).toThrow();
  });

  it('accepts typed conversation stream events', () => {
    expect(conversationStreamEventSchema.parse({ type: 'chunk', delta: 'Xin chào' }).type).toBe('chunk');
    const done = conversationStreamEventSchema.parse({
      type: 'done',
      message: {
        id: '1f8fad5b-d9cb-469f-a165-70867728950e',
        ownerUserId: 'dff0da0d-f89c-4485-8d11-4e58fc00b8cb',
        conversationId: '0f8fad5b-d9cb-469f-a165-70867728950e',
        role: 'assistant',
        content: 'Luận giải mẫu.',
        quickPromptKey: null,
        providerName: 'deepseek',
        providerMetadata: { provider: 'deepseek' },
        createdAt: '2026-06-18T00:02:00.000Z',
      },
    });

    expect(done.type).toBe('done');
  });

  it('accepts whitespace-only chunk deltas but rejects empty ones', () => {
    // Regression: SSE chunking splits on whitespace and emits space deltas between words. Trimming the
    // delta here would reject those and abort the stream (P1). Whitespace is meaningful; empty is not.
    expect(conversationStreamEventSchema.parse({ type: 'chunk', delta: ' ' }).type).toBe('chunk');
    expect(conversationStreamEventSchema.parse({ type: 'chunk', delta: '\n' }).type).toBe('chunk');
    expect(() => conversationStreamEventSchema.parse({ type: 'chunk', delta: '' })).toThrow();
  });

  it('accepts conversation detail envelopes', () => {
    const payload = conversationDetailResponseSchema.parse({
      conversation: {
        id: '0f8fad5b-d9cb-469f-a165-70867728950e',
        ownerUserId: 'dff0da0d-f89c-4485-8d11-4e58fc00b8cb',
        chartSnapshotId: 'a9ac741c-7423-4767-90d7-f8b6781ccf0a',
        title: null,
        status: 'active',
        createdAt: '2026-06-18T00:00:00.000Z',
        updatedAt: '2026-06-18T00:00:00.000Z',
      },
      messages: [],
    });

    expect(payload.messages).toHaveLength(0);
  });

  it('accepts a divination payload and rejects non-divination systems', () => {
    const ok = createDivinationRequestSchema.parse({
      chartSystem: 'mei-hua-yi-shu',
      question: 'Toi co nen doi viec khong?',
      purposeKey: 'career',
    });
    expect(ok.chartSystem).toBe('mei-hua-yi-shu');

    expect(() =>
      createDivinationRequestSchema.parse({
        chartSystem: 'ba-zi',
        question: 'x',
        purposeKey: 'career',
      }),
    ).toThrow();
  });

  it('requires purposeCustom only when purposeKey is custom', () => {
    expect(() =>
      createDivinationRequestSchema.parse({
        chartSystem: 'liu-yao',
        question: 'Viec nay co thanh khong?',
        purposeKey: 'custom',
      }),
    ).toThrow();

    expect(() =>
      createDivinationRequestSchema.parse({
        chartSystem: 'liu-yao',
        question: 'Viec nay co thanh khong?',
        purposeKey: 'love',
        purposeCustom: 'thua',
      }),
    ).toThrow();

    const ok = createDivinationRequestSchema.parse({
      chartSystem: 'liu-yao',
      question: 'Viec nay co thanh khong?',
      purposeKey: 'custom',
      purposeCustom: 'Mua nha',
    });
    expect(ok.purposeCustom).toBe('Mua nha');
  });
});
