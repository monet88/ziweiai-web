import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ExplanationPromptPayload } from './ai-explanation-provider';

function buildPayload(): ExplanationPromptPayload {
  return {
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
  } as ExplanationPromptPayload;
}

async function loadProvider() {
  const { OpenAiCompatibleExplanationProvider } = await import('./openai-compatible-explanation-provider');
  return new OpenAiCompatibleExplanationProvider();
}

describe('OpenAiCompatibleExplanationProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.OPENAI_COMPAT_API_KEY;
    delete process.env.OPENAI_COMPAT_BASE_URL;
    delete process.env.OPENAI_COMPAT_MODEL;
  });

  it('posts to {base}/v1/chat/completions and returns the rendered markdown', async () => {
    process.env.OPENAI_COMPAT_API_KEY = 'sk-test-key';
    process.env.OPENAI_COMPAT_BASE_URL = 'https://vps.monet.uno/api-cli';
    process.env.OPENAI_COMPAT_MODEL = 'gemini-3.1-flash-lite';
    vi.resetModules();

    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'ok' } }],
          usage: { total_tokens: 6, prompt_tokens: 5, completion_tokens: 1 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = await loadProvider();
    const result = await provider.generateExplanation(buildPayload());

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://vps.monet.uno/api-cli/v1/chat/completions');
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.headers).toMatchObject({
      Authorization: 'Bearer sk-test-key',
    });
    expect(result.renderedMarkdown).toBe('ok');
    expect(result.providerMetadata.provider).toBe('openai-compat');
    expect(result.providerMetadata.model).toBe('gemini-3.1-flash-lite');
  });

  it('normalizes a base URL that already ends with /v1 so the path is not duplicated', async () => {
    process.env.OPENAI_COMPAT_API_KEY = 'sk-test-key';
    process.env.OPENAI_COMPAT_BASE_URL = 'https://vps.monet.uno/api-cli/v1/';
    process.env.OPENAI_COMPAT_MODEL = 'gemini-3.1-flash-lite';
    vi.resetModules();

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = await loadProvider();
    await provider.generateExplanation(buildPayload());

    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://vps.monet.uno/api-cli/v1/chat/completions');
  });

  it('rejects content that contains Han script', async () => {
    process.env.OPENAI_COMPAT_API_KEY = 'sk-test-key';
    process.env.OPENAI_COMPAT_BASE_URL = 'https://vps.monet.uno/api-cli';
    process.env.OPENAI_COMPAT_MODEL = 'gemini-3.1-flash-lite';
    vi.resetModules();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: '命宫详解' } }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const provider = await loadProvider();
    await expect(provider.generateExplanation(buildPayload())).rejects.toThrow(
      'Nhà cung cấp trả về nội dung không hợp lệ (chứa chữ Hán).',
    );
  });

  it('throws a provider-unavailable error when the upstream responds with a non-2xx status', async () => {
    process.env.OPENAI_COMPAT_API_KEY = 'sk-test-key';
    process.env.OPENAI_COMPAT_BASE_URL = 'https://vps.monet.uno/api-cli';
    process.env.OPENAI_COMPAT_MODEL = 'gemini-3.1-flash-lite';
    vi.resetModules();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ error: { message: 'Invalid API key' } }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const provider = await loadProvider();
    await expect(provider.generateExplanation(buildPayload())).rejects.toThrow(
      'Yêu cầu nhà cung cấp OpenAI-compatible thất bại: Invalid API key',
    );
  });

  it('maps an aborted/timed-out request to a provider-timeout error', async () => {
    process.env.OPENAI_COMPAT_API_KEY = 'sk-test-key';
    process.env.OPENAI_COMPAT_BASE_URL = 'https://vps.monet.uno/api-cli';
    process.env.OPENAI_COMPAT_MODEL = 'gemini-3.1-flash-lite';
    vi.resetModules();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        const timeoutError = new Error('The operation was aborted due to timeout');
        timeoutError.name = 'TimeoutError';
        throw timeoutError;
      }),
    );

    const provider = await loadProvider();
    await expect(provider.generateExplanation(buildPayload())).rejects.toThrow(
      'Nhà cung cấp OpenAI-compatible phản hồi quá thời gian chờ.',
    );
  });

  it('reports unavailable when the API key is not configured', async () => {
    const originalLoadEnvFile = process.loadEnvFile;
    // Chặn re-import nạp lại .env local (có thể chứa key thật) để giữ đúng case "chưa cấu hình".
    // @ts-expect-error Node expose loadEnvFile lúc runtime trong dự án này.
    process.loadEnvFile = undefined;
    try {
      delete process.env.OPENAI_COMPAT_API_KEY;
      vi.resetModules();

      const provider = await loadProvider();
      expect(provider.isAvailable()).toBe(false);
      await expect(provider.generateExplanation(buildPayload())).rejects.toThrow(
        'Chưa cấu hình nhà cung cấp OpenAI-compatible.',
      );
    } finally {
      process.loadEnvFile = originalLoadEnvFile;
    }
  });
});
