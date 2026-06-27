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
