import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiEnv } from '../../config/env';
import type {
  AiConversationProvider,
  ConversationProviderResult,
} from './ai-explanation-provider';
import { ConversationProviderRouter } from './conversation-provider-router';
import { DeepseekExplanationProvider } from './deepseek-explanation-provider';
import { GeminiExplanationProvider } from './gemini-explanation-provider';
import { OpenAiCompatibleExplanationProvider } from './openai-compatible-explanation-provider';
import { ProviderTimeoutError, ProviderUnavailableError } from './provider-errors';

// Build a router with hand-rolled provider doubles so we can flip availability + streaming support
// per case without going through env. The real chain order is openai-compat -> deepseek -> gemini.
function buildRouter(overrides: {
  openAiCompat?: Partial<AiConversationProvider>;
  deepseek?: Partial<AiConversationProvider>;
  gemini?: Partial<AiConversationProvider>;
}): ConversationProviderRouter {
  const make = (name: string, extra: Partial<AiConversationProvider> = {}): AiConversationProvider => ({
    providerName: name,
    isAvailable: () => true,
    isVisionCapable: () => false,
    generateExplanation: vi.fn(),
    generateConversation: vi.fn(async () => ({
      renderedMarkdown: `${name}-full`,
      providerMetadata: { provider: name },
    })),
    ...extra,
  });

  return new ConversationProviderRouter(
    make('deepseek', overrides.deepseek) as unknown as DeepseekExplanationProvider,
    make('openai-compat', overrides.openAiCompat) as unknown as OpenAiCompatibleExplanationProvider,
    make('gemini', overrides.gemini) as unknown as GeminiExplanationProvider,
  );
}

async function* fakeStream(chunks: string[]): AsyncGenerator<string, ConversationProviderResult, void> {
  for (const chunk of chunks) {
    yield chunk;
  }
  return { renderedMarkdown: chunks.join(''), providerMetadata: { provider: 'openai-compat' } };
}

describe('ConversationProviderRouter.resolveStreamingProvider', () => {
  const originalDefault = apiEnv.AI_DEFAULT_PROVIDER;

  afterEach(() => {
    apiEnv.AI_DEFAULT_PROVIDER = originalDefault;
    vi.restoreAllMocks();
  });

  it('returns the openai-compat provider when it is available and supports streaming (auto)', () => {
    apiEnv.AI_DEFAULT_PROVIDER = 'auto';
    const router = buildRouter({
      openAiCompat: { generateConversationStream: () => fakeStream(['a']) },
    });

    const provider = router.resolveStreamingProvider('auto');
    expect(provider?.providerName).toBe('openai-compat');
  });

  it('returns null when the first available provider does not support streaming', () => {
    const router = buildRouter({
      // deepseek preference: chain is [deepseek]; deepseek has no generateConversationStream.
    });

    expect(router.resolveStreamingProvider('deepseek')).toBeNull();
  });

  it('returns null when the streaming-capable provider is unavailable', () => {
    apiEnv.AI_DEFAULT_PROVIDER = 'auto';
    const router = buildRouter({
      openAiCompat: { isAvailable: () => false, generateConversationStream: () => fakeStream(['a']) },
      deepseek: {},
    });

    // First available is deepseek (no streaming) -> null, controller falls back to non-stream.
    expect(router.resolveStreamingProvider('auto')).toBeNull();
  });
});

describe('ConversationProviderRouter.generate', () => {
  const originalDefault = apiEnv.AI_DEFAULT_PROVIDER;

  afterEach(() => {
    apiEnv.AI_DEFAULT_PROVIDER = originalDefault;
    vi.restoreAllMocks();
  });

  it('falls back to the next configured provider when the first provider times out', async () => {
    apiEnv.AI_DEFAULT_PROVIDER = 'auto';
    const router = buildRouter({
      openAiCompat: {
        generateConversation: vi.fn(async () => {
          throw new ProviderTimeoutError('openai slow');
        }),
      },
      deepseek: {
        generateConversation: vi.fn(async () => ({
          renderedMarkdown: 'deepseek fallback',
          providerMetadata: { provider: 'deepseek' },
        })),
      },
    });

    const result = await router.generate('auto', {} as never);

    expect(result.renderedMarkdown).toBe('deepseek fallback');
  });

  it('does not fail over when a provider returns CJK-guard content', async () => {
    apiEnv.AI_DEFAULT_PROVIDER = 'auto';
    const deepseekGenerate = vi.fn(async () => ({
      renderedMarkdown: 'deepseek fallback',
      providerMetadata: { provider: 'deepseek' },
    }));
    const router = buildRouter({
      openAiCompat: {
        generateConversation: vi.fn(async () => {
          throw new ProviderUnavailableError('Provider returned chữ Hán; nội dung không hợp lệ.');
        }),
      },
      deepseek: {
        generateConversation: deepseekGenerate,
      },
    });

    await expect(router.generate('auto', {} as never)).rejects.toThrow('chữ Hán');
    expect(deepseekGenerate).not.toHaveBeenCalled();
  });
});
