import { describe, expect, it, vi } from 'vitest';
import { ExplanationProviderRouter } from './explanation-provider-router';

// US-017e: helper dựng provider mock có đủ isVisionCapable (interface mới). visionCapable mặc định
// true để không phá các test cũ; test vision đặt false cho provider text-only.
function mockProvider(opts: {
  name: string;
  available?: boolean;
  visionCapable?: boolean;
  text?: string;
}) {
  return {
    providerName: opts.name,
    isAvailable: () => opts.available ?? true,
    isVisionCapable: () => opts.visionCapable ?? true,
    generateExplanation: async () => ({ renderedMarkdown: opts.text ?? opts.name, providerMetadata: { provider: opts.name } }),
  } as never;
}

describe('ExplanationProviderRouter', () => {
  it('prefers the first available auto provider', () => {
    const router = new ExplanationProviderRouter(
      { providerName: 'deepseek', isAvailable: () => true, generateExplanation: async () => ({ renderedMarkdown: 'a', providerMetadata: {} }) } as never,
      { providerName: 'openai-compat', isAvailable: () => true, generateExplanation: async () => ({ renderedMarkdown: 'c', providerMetadata: {} }) } as never,
      { providerName: 'gemini', isAvailable: () => true, generateExplanation: async () => ({ renderedMarkdown: 'b', providerMetadata: {} }) } as never,
    );

    expect(router.resolveProviderName('auto')).toBe('deepseek');
  });

  it('resolves the openai-compat provider for the openai-compat preference', () => {
    const router = new ExplanationProviderRouter(
      { providerName: 'deepseek', isAvailable: () => true, generateExplanation: async () => ({ renderedMarkdown: 'a', providerMetadata: {} }) } as never,
      { providerName: 'openai-compat', isAvailable: () => true, generateExplanation: async () => ({ renderedMarkdown: 'c', providerMetadata: {} }) } as never,
      { providerName: 'gemini', isAvailable: () => true, generateExplanation: async () => ({ renderedMarkdown: 'b', providerMetadata: {} }) } as never,
    );

    expect(router.resolveProviderName('openai-compat')).toBe('openai-compat');
  });

  it('falls back to the next provider when the preferred one is unavailable', async () => {
    const router = new ExplanationProviderRouter(
      { providerName: 'deepseek', isAvailable: () => false, generateExplanation: async () => ({ renderedMarkdown: 'a', providerMetadata: {} }) } as never,
      { providerName: 'openai-compat', isAvailable: () => false, generateExplanation: async () => ({ renderedMarkdown: 'c', providerMetadata: {} }) } as never,
      { providerName: 'gemini', isAvailable: () => true, generateExplanation: async () => ({ renderedMarkdown: 'b', providerMetadata: { provider: 'gemini' } }) } as never,
    );

    const result = await router.generate('auto', {
      chartSnapshot: {
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
      },
      explanationKind: 'overview',
      explanationContext: {
        chartSystem: 'ba-zi',
        visibleMessageKeys: ['birth.time.verified'],
        confidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
        sourceLabel: 'lunar-javascript@1.7.7',
      },
    });

    expect(result.renderedMarkdown).toBe('b');
  });

  it('reorders the auto chain so AI_DEFAULT_PROVIDER takes priority while keeping fallback', async () => {
    const originalDefaultProvider = process.env.AI_DEFAULT_PROVIDER;
    process.env.AI_DEFAULT_PROVIDER = 'gemini';
    vi.resetModules();
    try {
      const { ExplanationProviderRouter: ReloadedRouter } = await import('./explanation-provider-router');
      const router = new ReloadedRouter(
        { providerName: 'deepseek', isAvailable: () => true, generateExplanation: async () => ({ renderedMarkdown: 'a', providerMetadata: {} }) } as never,
        { providerName: 'openai-compat', isAvailable: () => true, generateExplanation: async () => ({ renderedMarkdown: 'c', providerMetadata: {} }) } as never,
        { providerName: 'gemini', isAvailable: () => true, generateExplanation: async () => ({ renderedMarkdown: 'b', providerMetadata: {} }) } as never,
      );

      expect(router.resolveProviderName('auto')).toBe('gemini');
    } finally {
      if (originalDefaultProvider === undefined) {
        delete process.env.AI_DEFAULT_PROVIDER;
      } else {
        process.env.AI_DEFAULT_PROVIDER = originalDefaultProvider;
      }
      vi.resetModules();
    }
  });

  // US-017e: chain vision chỉ giữ provider+model đọc được ảnh. deepseek-v4-flash (visionCapable=false)
  // bị loại để ảnh không bị gửi cho model text-only rồi bỏ thầm lặng.
  it('skips non-vision-capable providers when imageInput is present', async () => {
    const router = new ExplanationProviderRouter(
      mockProvider({ name: 'deepseek', visionCapable: false, text: 'deepseek' }),
      mockProvider({ name: 'openai-compat', visionCapable: false, text: 'openai-compat' }),
      mockProvider({ name: 'gemini', visionCapable: true, text: 'gemini' }),
    );

    const result = await router.generate('auto', {
      explanationKind: 'vision-face',
      promptOverride: 'phân tích ảnh',
      imageInput: { base64: 'YWJj', mimeType: 'image/png' },
    });

    expect(result.renderedMarkdown).toBe('gemini');
  });

  it('throws PROVIDER_UNAVAILABLE when no provider can read images', async () => {
    const router = new ExplanationProviderRouter(
      mockProvider({ name: 'deepseek', visionCapable: false }),
      mockProvider({ name: 'openai-compat', visionCapable: false }),
      mockProvider({ name: 'gemini', visionCapable: false }),
    );

    await expect(
      router.generate('auto', {
        explanationKind: 'vision-face',
        promptOverride: 'phân tích ảnh',
        imageInput: { base64: 'YWJj', mimeType: 'image/png' },
      }),
    ).rejects.toThrow('đọc ảnh');
  });
});
