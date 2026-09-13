import { describe, expect, it, vi } from 'vitest';
import { LlmExchange } from './llm-exchange';
import {
  assertNoCjk,
  buildProviderMetadata,
  CJK_REJECTION_MESSAGE,
  type LlmChatAdapter,
  type LlmParsedResult,
} from './llm-chat-adapter';
import { ProviderTimeoutError, ProviderUnavailableError } from './provider-errors';

// REFACTOR-007 (decision 0030): a stub adapter lets us exercise the shared glue (timeout/fetch/text
// guard/CJK guard/metadata/error-map) in LlmExchange without any real provider. buildRequest returns
// a fixed URL; the test stubs global fetch so parseResult sees whatever Response we want.
function buildStubAdapter(overrides: Partial<LlmChatAdapter> = {}): LlmChatAdapter {
  return {
    providerName: 'stub',
    visionCapable: false,
    notConfiguredMessage: 'stub not configured',
    timeoutMessage: 'stub timed out',
    unavailableMessage: 'stub unavailable',
    isAvailable: () => true,
    resolveModel: (modelOverride?: string) => modelOverride ?? 'stub-model',
    buildRequest: () => ({ url: 'https://stub.local/chat', init: { method: 'POST' } }),
    parseResult: async (): Promise<LlmParsedResult> => ({ text: 'ok', usage: undefined }),
    ...overrides,
  };
}

describe('LlmExchange.run', () => {
  it('returns rendered markdown + provider metadata on success', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 200 })));
    const adapter = buildStubAdapter({
      parseResult: async () => ({ text: '  hello  ', usage: { totalTokens: 9, promptTokens: 5, completionTokens: 4 } }),
    });
    const exchange = new LlmExchange();

    const result = await exchange.run({ adapter, prompt: 'p', emptyMessage: 'empty' });

    expect(result.renderedMarkdown).toBe('hello');
    expect(result.providerMetadata).toEqual({
      provider: 'stub',
      model: 'stub-model',
      totalTokens: '9',
      promptTokens: '5',
      completionTokens: '4',
    });
    vi.unstubAllGlobals();
  });

  it('passes modelOverride to resolveModel and reflects it in metadata', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 200 })));
    const adapter = buildStubAdapter();
    const exchange = new LlmExchange();

    const result = await exchange.run({ adapter, prompt: 'p', emptyMessage: 'empty', modelOverride: 'forced-model' });

    expect(result.providerMetadata.model).toBe('forced-model');
    vi.unstubAllGlobals();
  });

  it('adds the kind field to metadata only when supplied', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 200 })));
    const adapter = buildStubAdapter();
    const exchange = new LlmExchange();

    const withKind = await exchange.run({ adapter, prompt: 'p', emptyMessage: 'empty', kind: 'explanation' });
    const withoutKind = await exchange.run({ adapter, prompt: 'p', emptyMessage: 'empty' });

    expect(withKind.providerMetadata.kind).toBe('explanation');
    expect('kind' in withoutKind.providerMetadata).toBe(false);
    vi.unstubAllGlobals();
  });

  it('throws not-configured without calling fetch when the adapter is unavailable', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const adapter = buildStubAdapter({ isAvailable: () => false });
    const exchange = new LlmExchange();

    await expect(exchange.run({ adapter, prompt: 'p', emptyMessage: 'empty' })).rejects.toThrow('stub not configured');
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('throws the caller emptyMessage when the parsed text is blank', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 200 })));
    const adapter = buildStubAdapter({ parseResult: async () => ({ text: '   ' }) });
    const exchange = new LlmExchange();

    await expect(exchange.run({ adapter, prompt: 'p', emptyMessage: 'no content here' })).rejects.toThrow(
      'no content here',
    );
    vi.unstubAllGlobals();
  });

  it('rejects Han-script content with the shared CJK message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 200 })));
    const adapter = buildStubAdapter({ parseResult: async () => ({ text: '命宫详解' }) });
    const exchange = new LlmExchange();

    await expect(exchange.run({ adapter, prompt: 'p', emptyMessage: 'empty' })).rejects.toThrow(CJK_REJECTION_MESSAGE);
    vi.unstubAllGlobals();
  });

  it('rethrows a ProviderUnavailableError raised by the adapter parseResult unchanged', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 401 })));
    const adapter = buildStubAdapter({
      parseResult: async () => {
        throw new ProviderUnavailableError('upstream said no');
      },
    });
    const exchange = new LlmExchange();

    await expect(exchange.run({ adapter, prompt: 'p', emptyMessage: 'empty' })).rejects.toThrow('upstream said no');
    vi.unstubAllGlobals();
  });

  it('maps a TimeoutError to ProviderTimeoutError with the adapter timeout message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        const timeoutError = new Error('aborted due to timeout');
        timeoutError.name = 'TimeoutError';
        throw timeoutError;
      }),
    );
    const adapter = buildStubAdapter();
    const exchange = new LlmExchange();

    await expect(exchange.run({ adapter, prompt: 'p', emptyMessage: 'empty' })).rejects.toBeInstanceOf(
      ProviderTimeoutError,
    );
    await expect(exchange.run({ adapter, prompt: 'p', emptyMessage: 'empty' })).rejects.toThrow('stub timed out');
    vi.unstubAllGlobals();
  });

  it('maps an unknown error to ProviderUnavailableError with the adapter unavailable message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('socket hang up');
      }),
    );
    const adapter = buildStubAdapter();
    const exchange = new LlmExchange();

    await expect(exchange.run({ adapter, prompt: 'p', emptyMessage: 'empty' })).rejects.toThrow('stub unavailable');
    vi.unstubAllGlobals();
  });

  describe('Global AI Circuit Breaker Fail-Closed in Production', () => {
    const originalEnv = process.env.NODE_ENV;

    it('fails closed when Upstash returns HTTP 500 error in production', async () => {
      process.env.NODE_ENV = 'production';
      const { apiEnv } = await import('../../config/env');
      (apiEnv as any).QUOTA_UPSTASH_REST_URL = 'https://mock-upstash.local';
      (apiEnv as any).QUOTA_UPSTASH_REST_TOKEN = 'mock-token';

      const buildRequestSpy = vi.fn();
      const adapter = buildStubAdapter({ buildRequest: buildRequestSpy });

      // Mock fetch để Upstash pipeline trả HTTP 500
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(JSON.stringify({ error: 'Server Error' }), { status: 500 })),
      );

      const exchange = new LlmExchange();
      await expect(exchange.run({ adapter, prompt: 'p', emptyMessage: 'empty' })).rejects.toThrow(
        'Dịch vụ AI tạm thời không khả dụng do hệ thống kiểm soát ngân sách toàn cục gặp sự cố',
      );

      // Đảm bảo không hề gọi adapter.buildRequest (chặn trước khi gọi LLM)
      expect(buildRequestSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      (apiEnv as any).QUOTA_UPSTASH_REST_URL = undefined;
      (apiEnv as any).QUOTA_UPSTASH_REST_TOKEN = undefined;
      vi.unstubAllGlobals();
    });

    it('fails closed when Upstash network throws error in production', async () => {
      process.env.NODE_ENV = 'production';
      const { apiEnv } = await import('../../config/env');
      (apiEnv as any).QUOTA_UPSTASH_REST_URL = 'https://mock-upstash.local';
      (apiEnv as any).QUOTA_UPSTASH_REST_TOKEN = 'mock-token';

      const buildRequestSpy = vi.fn();
      const adapter = buildStubAdapter({ buildRequest: buildRequestSpy });

      // Mock fetch ném timeout error
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          throw new Error('Connection refused to Upstash');
        }),
      );

      const exchange = new LlmExchange();
      await expect(exchange.run({ adapter, prompt: 'p', emptyMessage: 'empty' })).rejects.toThrow(
        'Dịch vụ AI tạm thời không khả dụng do hệ thống kiểm soát ngân sách toàn cục gặp sự cố',
      );

      expect(buildRequestSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      (apiEnv as any).QUOTA_UPSTASH_REST_URL = undefined;
      (apiEnv as any).QUOTA_UPSTASH_REST_TOKEN = undefined;
      vi.unstubAllGlobals();
    });

    it('fails closed when Upstash credentials are not configured in production', async () => {
      process.env.NODE_ENV = 'production';
      const { apiEnv } = await import('../../config/env');
      (apiEnv as any).QUOTA_UPSTASH_REST_URL = undefined;
      (apiEnv as any).QUOTA_UPSTASH_REST_TOKEN = undefined;

      const buildRequestSpy = vi.fn();
      const adapter = buildStubAdapter({ buildRequest: buildRequestSpy });

      const exchange = new LlmExchange();
      await expect(exchange.run({ adapter, prompt: 'p', emptyMessage: 'empty' })).rejects.toThrow(
        'Dịch vụ AI chưa được cấu hình bộ kiểm soát ngân sách toàn cục trên môi trường production.',
      );

      expect(buildRequestSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      vi.unstubAllGlobals();
    });
  });
});

describe('assertNoCjk', () => {
  it('passes through Latin/Vietnamese text without throwing', () => {
    expect(() => assertNoCjk('Mệnh chủ vận trình hanh thông.')).not.toThrow();
  });

  it('throws ProviderUnavailableError with the shared message on Han script', () => {
    expect(() => assertNoCjk('命宫')).toThrow(CJK_REJECTION_MESSAGE);
    expect(() => assertNoCjk('命宫')).toThrow(ProviderUnavailableError);
  });
});

describe('buildProviderMetadata', () => {
  it('stringifies usage and defaults missing counters to "0"', () => {
    expect(buildProviderMetadata('openai-compat', 'gpt-4o-mini', undefined)).toEqual({
      provider: 'openai-compat',
      model: 'gpt-4o-mini',
      totalTokens: '0',
      promptTokens: '0',
      completionTokens: '0',
    });
  });

  it('includes the kind field only when provided (preserves openai-compat no-kind invariant)', () => {
    const withKind = buildProviderMetadata('deepseek', 'deepseek-v4-pro', { totalTokens: 3 }, 'conversation');
    expect(withKind.kind).toBe('conversation');

    const withoutKind = buildProviderMetadata('openai-compat', 'gpt-4o-mini', { totalTokens: 3 });
    expect('kind' in withoutKind).toBe(false);
  });
});
