import { describe, expect, it } from 'vitest';
import type { ChartSnapshot, ConversationMessageRecord, ExplanationContext } from '@ziweiai/contracts';
import { buildConversationPrompt, selectConversationPromptMessages } from './build-conversation-prompt';

const HAN_TEXT_PATTERN = /\p{Script=Han}/u;

function message(index: number): ConversationMessageRecord {
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    ownerUserId: '11111111-1111-4111-8111-111111111111',
    conversationId: '22222222-2222-4222-8222-222222222222',
    role: index % 2 === 0 ? 'assistant' : 'user',
    content: `Tin nhắn ${index}`,
    quickPromptKey: null,
    providerName: index % 2 === 0 ? 'deepseek' : null,
    providerMetadata: {},
    createdAt: '2026-06-18T00:00:00.000Z',
  };
}

const chartSnapshot = {
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
} as ChartSnapshot;

const explanationContext: ExplanationContext = {
  chartSystem: 'ba-zi',
  visibleMessageKeys: ['birth.time.verified'],
  confidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
  sourceLabel: 'lunar-javascript@1.7.7',
};

describe('buildConversationPrompt', () => {
  it('keeps only the newest 12 messages without mutating the original array', () => {
    const messages = Array.from({ length: 14 }, (_, index) => message(index + 1));
    const selected = selectConversationPromptMessages(messages, 12);

    expect(selected).toHaveLength(12);
    expect(selected[0]?.content).toBe('Tin nhắn 3');
    expect(messages).toHaveLength(14);
  });

  it('drops dangling user turns that have no following assistant reply', () => {
    // A user message with no assistant after it means a prior generation failed (user row is durable,
    // assistant row never written). Feeding it back would replay an unanswered question as context.
    const answeredUser = { ...message(1), role: 'user' as const, content: 'Đã được trả lời' };
    const assistantReply = { ...message(2), role: 'assistant' as const, content: 'Câu trả lời' };
    const danglingUser = { ...message(3), role: 'user' as const, content: 'Chưa được trả lời' };

    const selected = selectConversationPromptMessages([answeredUser, assistantReply, danglingUser], 12);

    expect(selected.map((m) => m.content)).toEqual(['Đã được trả lời', 'Câu trả lời']);
  });

  it('includes the language invariant and current user message', () => {
    const prompt = buildConversationPrompt({
      chartSnapshot,
      explanationContext,
      messages: [message(1)],
      userMessage: 'Tôi nên chú ý điều gì trong công việc?',
      quickPromptKey: 'career',
    });

    expect(prompt).toContain('BẮT BUỘC: viết hoàn toàn bằng tiếng Việt');
    expect(prompt).toContain('Tôi nên chú ý điều gì trong công việc?');
    expect(HAN_TEXT_PATTERN.test(prompt)).toBe(false);
  });
});
