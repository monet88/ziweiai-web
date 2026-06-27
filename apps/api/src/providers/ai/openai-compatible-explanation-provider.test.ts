import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ConversationPromptPayload, ExplanationPromptPayload } from './ai-explanation-provider';

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

// US-027: build a minimal conversation payload. The provider only needs the snapshot/context to
// build a prompt; the streaming behaviour under test does not depend on prompt content.
function buildConversationPayload(): ConversationPromptPayload {
  const explanationPayload = buildPayload();
  return {
    chartSnapshot: explanationPayload.chartSnapshot!,
    explanationContext: explanationPayload.explanationContext!,
    messages: [],
    userMessage: 'Xin chao',
  };
}

// US-027: build a streaming Response whose body emits the given raw byte slices as SSE frames.
// Each entry is written verbatim so tests can split a single JSON frame across two reads to prove
// the parser buffers partial frames across reads.
function streamingResponse(
  rawSlices: string[],
  init: ResponseInit & { onCancel?: () => void } = { status: 200 },
): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const slice of rawSlices) {
        controller.enqueue(encoder.encode(slice));
      }
      controller.close();
    },
    // US-027 P2-2: lets a test observe that the provider releases the upstream stream (reader.cancel)
    // on every exit path (CJK reject / empty / success), proving the finally block runs.
    cancel() {
      init.onCancel?.();
    },
  });
  return new Response(body, {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'text/event-stream', ...(init.headers ?? {}) },
  });
}

function deltaFrame(content: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
}

async function collectStream(
  generator: AsyncGenerator<string, { renderedMarkdown: string; providerMetadata: Record<string, string> }, void>,
): Promise<{ deltas: string[]; result: { renderedMarkdown: string; providerMetadata: Record<string, string> } | undefined }> {
  const deltas: string[] = [];
  let next = await generator.next();
  while (!next.done) {
    deltas.push(next.value);
    next = await generator.next();
  }
  return { deltas, result: next.value };
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

describe('OpenAiCompatibleExplanationProvider.generateConversationStream', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.OPENAI_COMPAT_API_KEY;
    delete process.env.OPENAI_COMPAT_BASE_URL;
    delete process.env.OPENAI_COMPAT_MODEL;
  });

  it('posts with stream:true and yields token deltas in order, returning accumulated markdown', async () => {
    process.env.OPENAI_COMPAT_API_KEY = 'sk-test-key';
    process.env.OPENAI_COMPAT_BASE_URL = 'https://vps.monet.uno/api-cli';
    process.env.OPENAI_COMPAT_MODEL = 'gemini-3.1-flash-lite';
    vi.resetModules();

    const fetchMock = vi.fn(async () =>
      streamingResponse([deltaFrame('Xin '), deltaFrame('chao '), deltaFrame('ban'), 'data: [DONE]\n\n']),
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = await loadProvider();
    const { deltas, result } = await collectStream(provider.generateConversationStream(buildConversationPayload()));

    expect(fetchMock).toHaveBeenCalledOnce();
    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(JSON.parse(String(requestInit?.body))).toMatchObject({ stream: true });
    expect(deltas).toEqual(['Xin ', 'chao ', 'ban']);
    expect(result?.renderedMarkdown).toBe('Xin chao ban');
    expect(result?.providerMetadata.provider).toBe('openai-compat');
    expect(result?.providerMetadata.model).toBe('gemini-3.1-flash-lite');
  });

  it('buffers a JSON frame split across two reads', async () => {
    process.env.OPENAI_COMPAT_API_KEY = 'sk-test-key';
    process.env.OPENAI_COMPAT_BASE_URL = 'https://vps.monet.uno/api-cli';
    process.env.OPENAI_COMPAT_MODEL = 'gemini-3.1-flash-lite';
    vi.resetModules();

    const full = deltaFrame('Hello world');
    const splitAt = Math.floor(full.length / 2);
    const fetchMock = vi.fn(async () =>
      streamingResponse([full.slice(0, splitAt), full.slice(splitAt), 'data: [DONE]\n\n']),
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = await loadProvider();
    const { deltas, result } = await collectStream(provider.generateConversationStream(buildConversationPayload()));

    expect(deltas).toEqual(['Hello world']);
    expect(result?.renderedMarkdown).toBe('Hello world');
  });

  it('rejects when the accumulated streamed text contains Han script', async () => {
    process.env.OPENAI_COMPAT_API_KEY = 'sk-test-key';
    process.env.OPENAI_COMPAT_BASE_URL = 'https://vps.monet.uno/api-cli';
    process.env.OPENAI_COMPAT_MODEL = 'gemini-3.1-flash-lite';
    vi.resetModules();

    const fetchMock = vi.fn(async () =>
      streamingResponse([deltaFrame('命'), deltaFrame('宫'), 'data: [DONE]\n\n']),
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = await loadProvider();
    await expect(collectStream(provider.generateConversationStream(buildConversationPayload()))).rejects.toThrow(
      'Nhà cung cấp trả về nội dung không hợp lệ (chứa chữ Hán).',
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
    await expect(collectStream(provider.generateConversationStream(buildConversationPayload()))).rejects.toThrow(
      'Nhà cung cấp OpenAI-compatible phản hồi quá thời gian chờ.',
    );
  });

  it('does NOT map a caller-driven abort (client disconnect) to a provider-timeout error', async () => {
    process.env.OPENAI_COMPAT_API_KEY = 'sk-test-key';
    process.env.OPENAI_COMPAT_BASE_URL = 'https://vps.monet.uno/api-cli';
    process.env.OPENAI_COMPAT_MODEL = 'gemini-3.1-flash-lite';
    vi.resetModules();

    // Low-2: the caller signal (client disconnect) is already aborted. fetch rejects with an
    // AbortError, but this is NOT a timeout — it must not surface as ProviderTimeoutError (504).
    const callerAbort = new AbortController();
    callerAbort.abort();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        const abortError = new Error('The operation was aborted');
        abortError.name = 'AbortError';
        throw abortError;
      }),
    );

    const provider = await loadProvider();
    const { ProviderTimeoutError, ProviderUnavailableError } = await import('./provider-errors');
    let thrown: unknown;
    try {
      await collectStream(provider.generateConversationStream(buildConversationPayload(), callerAbort.signal));
      throw new Error('expected the aborted stream to reject');
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(ProviderUnavailableError);
    expect(thrown).not.toBeInstanceOf(ProviderTimeoutError);
  });

  it('throws provider-unavailable when the upstream responds non-2xx', async () => {
    process.env.OPENAI_COMPAT_API_KEY = 'sk-test-key';
    process.env.OPENAI_COMPAT_BASE_URL = 'https://vps.monet.uno/api-cli';
    process.env.OPENAI_COMPAT_MODEL = 'gemini-3.1-flash-lite';
    vi.resetModules();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('upstream boom', { status: 502 })),
    );

    const provider = await loadProvider();
    await expect(collectStream(provider.generateConversationStream(buildConversationPayload()))).rejects.toThrow(
      /thất bại/,
    );
  });

  it('throws provider-unavailable when the stream yields no content', async () => {
    process.env.OPENAI_COMPAT_API_KEY = 'sk-test-key';
    process.env.OPENAI_COMPAT_BASE_URL = 'https://vps.monet.uno/api-cli';
    process.env.OPENAI_COMPAT_MODEL = 'gemini-3.1-flash-lite';
    vi.resetModules();

    vi.stubGlobal('fetch', vi.fn(async () => streamingResponse(['data: [DONE]\n\n'])));

    const provider = await loadProvider();
    await expect(collectStream(provider.generateConversationStream(buildConversationPayload()))).rejects.toThrow(
      'Nhà cung cấp OpenAI-compatible không trả về nội dung hội thoại.',
    );
  });

  it('cancels the upstream reader when the consumer returns early (client disconnect)', async () => {
    process.env.OPENAI_COMPAT_API_KEY = 'sk-test-key';
    process.env.OPENAI_COMPAT_BASE_URL = 'https://vps.monet.uno/api-cli';
    process.env.OPENAI_COMPAT_MODEL = 'gemini-3.1-flash-lite';
    vi.resetModules();

    // P2-2 (the real disconnect path): the consumer pulls one delta then calls generator.return(),
    // mirroring the controller aborting mid-stream when the client goes away. The finally must cancel
    // the upstream body so we stop reading (and the server stops burning provider tokens).
    const onCancel = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        streamingResponse([deltaFrame('Xin '), deltaFrame('chao '), deltaFrame('ban'), 'data: [DONE]\n\n'], {
          status: 200,
          onCancel,
        }),
      ),
    );

    const provider = await loadProvider();
    const generator = provider.generateConversationStream(buildConversationPayload());
    const first = await generator.next();
    expect(first.value).toBe('Xin ');
    await generator.return(undefined as never);

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('returns the accumulated partial text when the caller aborts mid-stream (lossless, no throw)', async () => {
    process.env.OPENAI_COMPAT_API_KEY = 'sk-test-key';
    process.env.OPENAI_COMPAT_BASE_URL = 'https://vps.monet.uno/api-cli';
    process.env.OPENAI_COMPAT_MODEL = 'gemini-3.1-flash-lite';
    vi.resetModules();

    // Backlog #34 (lossless client-disconnect): when the caller signal (client disconnect) fires
    // MID-stream after some tokens already arrived, the provider must NOT throw. It breaks the read
    // loop and returns the accumulated partial text so the service can still persist the reply the
    // user partially saw. The fetch is cancelled (token burn stops) but no data is lost.
    const callerAbort = new AbortController();
    let firstDelivered = false;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: { signal?: AbortSignal }) => {
        const encoder = new TextEncoder();
        const body = new ReadableStream<Uint8Array>({
          pull(controller) {
            if (!firstDelivered) {
              firstDelivered = true;
              controller.enqueue(encoder.encode(deltaFrame('Xin chao')));
              return;
            }
            // Second pull parks until the combined signal aborts, then errors the body exactly like a
            // real fetch whose AbortSignal fired mid-body.
            return new Promise<void>((resolve) => {
              const sig = init.signal;
              const fail = () => {
                const abortError = new Error('The operation was aborted');
                abortError.name = 'AbortError';
                controller.error(abortError);
                resolve();
              };
              if (sig?.aborted) {
                fail();
                return;
              }
              sig?.addEventListener('abort', fail, { once: true });
            });
          },
        });
        return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
      }),
    );

    const provider = await loadProvider();
    const generator = provider.generateConversationStream(buildConversationPayload(), callerAbort.signal);
    const first = await generator.next();
    expect(first.value).toBe('Xin chao');
    // Client goes away mid-stream.
    callerAbort.abort();
    const final = await generator.next();
    expect(final.done).toBe(true);
    expect(final.value?.renderedMarkdown).toBe('Xin chao');
  });

  it('flushes a trailing frame the upstream sent without a final blank line or [DONE]', async () => {
    process.env.OPENAI_COMPAT_API_KEY = 'sk-test-key';
    process.env.OPENAI_COMPAT_BASE_URL = 'https://vps.monet.uno/api-cli';
    process.env.OPENAI_COMPAT_MODEL = 'gemini-3.1-flash-lite';
    vi.resetModules();

    // Non-conformant proxy: closes the body right after the last data line, no trailing "\n\n"/[DONE].
    const fetchMock = vi.fn(async () =>
      streamingResponse([deltaFrame('Xin '), 'data: {"choices":[{"delta":{"content":"chao"}}]}']),
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = await loadProvider();
    const { deltas, result } = await collectStream(provider.generateConversationStream(buildConversationPayload()));

    // Medium-2: the trailing token must not be dropped when the stream ends without a frame separator.
    expect(deltas).toEqual(['Xin ', 'chao']);
    expect(result?.renderedMarkdown).toBe('Xin chao');
  });
});
