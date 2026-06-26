import { HttpStatus } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../../common/http/api-error';
import { apiEnv } from '../../../config/env';
import type { SupabasePersistenceGateway } from '../../../database/supabase-persistence.gateway';
import type { ConversationProviderRouter } from '../../../providers/ai/conversation-provider-router';
import type { QuotasService } from '../../quotas/quotas.service';
import { ConversationsService } from './conversations.service';

function expectApiError(error: unknown, status: HttpStatus, code: string): void {
  expect(error).toBeInstanceOf(ApiErrorHttpException);
  const apiError = error as ApiErrorHttpException;
  const response = apiError.getResponse() as { code: string };
  expect(apiError.getStatus()).toBe(status);
  expect(response.code).toBe(code);
}

const CONVERSATION_ID = '33333333-3333-3333-3333-333333333333';
const emailUser: AuthenticatedUser = { userId: '11111111-1111-1111-1111-111111111111', email: 'user@example.com' };

describe('ConversationsService entitlement gate', () => {
  const originalConversationEnabled = apiEnv.AI_CONVERSATION_ENABLED;
  const originalFreeForAll = apiEnv.AI_EXPLANATION_FREE_FOR_ALL;

  let persistenceGateway: Pick<SupabasePersistenceGateway, 'findConversationById' | 'findChartSnapshotById'>;
  let quotasService: Pick<QuotasService, 'assertCanCreateConversationMessage'>;
  let conversationRouter: Pick<ConversationProviderRouter, 'generate'>;
  let service: ConversationsService;

  beforeEach(() => {
    apiEnv.AI_CONVERSATION_ENABLED = true;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = true;
    persistenceGateway = {
      findConversationById: vi.fn().mockResolvedValue({ id: CONVERSATION_ID, chartSnapshotId: 'chart-1' }),
      findChartSnapshotById: vi.fn().mockResolvedValue({ snapshot: {} }),
    };
    quotasService = { assertCanCreateConversationMessage: vi.fn().mockResolvedValue(undefined) };
    conversationRouter = { generate: vi.fn() };
    service = new ConversationsService(
      persistenceGateway as SupabasePersistenceGateway,
      quotasService as QuotasService,
      conversationRouter as ConversationProviderRouter,
    );
  });

  afterEach(() => {
    apiEnv.AI_CONVERSATION_ENABLED = originalConversationEnabled;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = originalFreeForAll;
    vi.restoreAllMocks();
  });

  it('chặn PAYMENT_REQUIRED khi AI gate không free-for-all (trước quota + provider)', async () => {
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = false;
    try {
      await service.appendMessageAndGenerate(emailUser, '127.0.0.1', CONVERSATION_ID, {
        content: 'Xin chào',
        providerPreference: 'auto',
      });
      throw new Error('expected premium gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.PAYMENT_REQUIRED, 'PAYMENT_REQUIRED');
    }
    // Gate must fire BEFORE quota consumption and provider work.
    expect(quotasService.assertCanCreateConversationMessage).not.toHaveBeenCalled();
    expect(conversationRouter.generate).not.toHaveBeenCalled();
  });

  it('cho qua gate khi free-for-all (đến bước quota)', async () => {
    await service
      .appendMessageAndGenerate(emailUser, '127.0.0.1', CONVERSATION_ID, {
        content: 'Xin chào',
        providerPreference: 'auto',
      })
      .catch(() => undefined);
    // With the gate open, quota enforcement is reached (provider stubs are intentionally minimal).
    expect(quotasService.assertCanCreateConversationMessage).toHaveBeenCalledTimes(1);
  });
});

describe('ConversationsService.listConversationsForChart', () => {
  const CHART_ID = '44444444-4444-4444-8444-944444444444';

  function buildService(
    gateway: Pick<SupabasePersistenceGateway, 'findChartSnapshotById' | 'listConversationsForChart'>,
  ): ConversationsService {
    return new ConversationsService(
      gateway as SupabasePersistenceGateway,
      {} as QuotasService,
      {} as ConversationProviderRouter,
    );
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('trả NOT_FOUND khi chart không thuộc người dùng (không lộ tồn tại lá số người khác)', async () => {
    const gateway = {
      findChartSnapshotById: vi.fn().mockResolvedValue(null),
      listConversationsForChart: vi.fn(),
    };
    const service = buildService(gateway);

    try {
      await service.listConversationsForChart(emailUser.userId, CHART_ID);
      throw new Error('expected NOT_FOUND to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.NOT_FOUND, 'NOT_FOUND');
    }
    // Ownership check must short-circuit BEFORE listing conversations.
    expect(gateway.listConversationsForChart).not.toHaveBeenCalled();
  });

  it('trả danh sách conversation của chart (newest-first từ gateway) trong shape items', async () => {
    const OWNER_ID = '11111111-1111-4111-8111-911111111111';
    const ID_NEWER = '55555555-5555-4555-8555-955555555555';
    const ID_OLDER = '66666666-6666-4666-8666-966666666666';
    const conversations = [
      { id: ID_NEWER, ownerUserId: OWNER_ID, chartSnapshotId: CHART_ID, title: null, status: 'active', createdAt: '2026-06-26T02:00:00.000Z', updatedAt: '2026-06-26T02:00:00.000Z' },
      { id: ID_OLDER, ownerUserId: OWNER_ID, chartSnapshotId: CHART_ID, title: null, status: 'active', createdAt: '2026-06-26T01:00:00.000Z', updatedAt: '2026-06-26T01:00:00.000Z' },
    ];
    const gateway = {
      findChartSnapshotById: vi.fn().mockResolvedValue({ snapshot: {} }),
      listConversationsForChart: vi.fn().mockResolvedValue(conversations),
    };
    const service = buildService(gateway);

    const result = await service.listConversationsForChart(emailUser.userId, CHART_ID);

    expect(gateway.listConversationsForChart).toHaveBeenCalledWith(emailUser.userId, CHART_ID);
    expect(result.items.map((c) => c.id)).toEqual([ID_NEWER, ID_OLDER]);
  });
});

// US-027 (decision 0026): real provider token streaming. The streaming generate runs the SAME gate
// order as the non-stream path (enabled -> entitlement 402 -> quota 429 -> persist user) BEFORE any
// token flows, yields deltas, and persists the assistant message ONLY after the stream completes.
describe('ConversationsService.appendMessageAndGenerateStream', () => {
  const originalConversationEnabled = apiEnv.AI_CONVERSATION_ENABLED;
  const originalFreeForAll = apiEnv.AI_EXPLANATION_FREE_FOR_ALL;

  // A snapshot shaped just enough for buildExplanationContext + the (non-divination) inquiry skip.
  const SNAPSHOT = {
    chartSystem: 'zi-wei-dou-shu',
    calculationConfidence: {
      level: 'medium',
      reasons: ['MANUAL_TIMEZONE'],
      visibleMessageKey: 'birth.time.verified',
      blocksExactReading: false,
    },
    ruleSource: { canonicalLibrary: { name: 'iztro', version: '2.0.0' } },
  };

  const ASSISTANT_RECORD = {
    id: '77777777-7777-4777-8777-777777777777',
    ownerUserId: emailUser.userId,
    conversationId: CONVERSATION_ID,
    role: 'assistant',
    content: 'placeholder',
    quickPromptKey: null,
    providerName: 'openai-compat',
    providerMetadata: { provider: 'openai-compat' },
    createdAt: '2026-06-26T03:00:00.000Z',
  };

  async function* providerStream(
    chunks: string[],
    failAfter?: number,
  ): AsyncGenerator<string, { renderedMarkdown: string; providerMetadata: Record<string, string> }, void> {
    let emitted = 0;
    for (const chunk of chunks) {
      yield chunk;
      emitted += 1;
      if (failAfter !== undefined && emitted >= failAfter) {
        const { ProviderUnavailableError } = await import('../../../providers/ai/provider-errors');
        throw new ProviderUnavailableError('upstream blew up mid-stream');
      }
    }
    return { renderedMarkdown: chunks.join(''), providerMetadata: { provider: 'openai-compat' } };
  }

  async function drain(
    generator: AsyncGenerator<string, unknown, void>,
  ): Promise<{ deltas: string[]; result: unknown }> {
    const deltas: string[] = [];
    let next = await generator.next();
    while (!next.done) {
      deltas.push(next.value as string);
      next = await generator.next();
    }
    return { deltas, result: next.value };
  }

  function buildStreamingService(streamProvider: unknown | null) {
    const createConversationMessage = vi
      .fn()
      .mockResolvedValue({ ...ASSISTANT_RECORD });
    const persistenceGateway = {
      findConversationById: vi.fn().mockResolvedValue({ id: CONVERSATION_ID, chartSnapshotId: 'chart-1' }),
      findChartSnapshotById: vi.fn().mockResolvedValue({ snapshot: SNAPSHOT }),
      listRecentConversationMessages: vi.fn().mockResolvedValue([]),
      createConversationMessage,
    };
    const quotasService = { assertCanCreateConversationMessage: vi.fn().mockResolvedValue(undefined) };
    const conversationRouter = {
      generate: vi.fn().mockResolvedValue({
        renderedMarkdown: 'non-stream full text',
        providerMetadata: { provider: 'gemini' },
      }),
      resolveStreamingProvider: vi.fn().mockReturnValue(streamProvider),
    };
    const service = new ConversationsService(
      persistenceGateway as unknown as SupabasePersistenceGateway,
      quotasService as unknown as QuotasService,
      conversationRouter as unknown as ConversationProviderRouter,
    );
    return { service, persistenceGateway, quotasService, conversationRouter, createConversationMessage };
  }

  beforeEach(() => {
    apiEnv.AI_CONVERSATION_ENABLED = true;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = true;
  });

  afterEach(() => {
    apiEnv.AI_CONVERSATION_ENABLED = originalConversationEnabled;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = originalFreeForAll;
    vi.restoreAllMocks();
  });

  it('blocks with PAYMENT_REQUIRED before quota / persist / streaming when the AI gate is closed', async () => {
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = false;
    const { service, quotasService, conversationRouter, createConversationMessage } = buildStreamingService({
      generateConversationStream: vi.fn(),
    });

    try {
      await service
        .appendMessageAndGenerateStream(emailUser, '127.0.0.1', CONVERSATION_ID, {
          content: 'Xin chào',
          providerPreference: 'auto',
        })
        .next();
      throw new Error('expected gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.PAYMENT_REQUIRED, 'PAYMENT_REQUIRED');
    }
    expect(quotasService.assertCanCreateConversationMessage).not.toHaveBeenCalled();
    expect(conversationRouter.resolveStreamingProvider).not.toHaveBeenCalled();
    expect(createConversationMessage).not.toHaveBeenCalled();
  });

  it('persists the user message, streams deltas, then persists the assistant message after completion', async () => {
    const streamProvider = {
      generateConversationStream: vi.fn(() => providerStream(['Xin ', 'chao ', 'ban'])),
    };
    const { service, persistenceGateway, createConversationMessage } = buildStreamingService(streamProvider);

    const { deltas, result } = await drain(
      service.appendMessageAndGenerateStream(emailUser, '127.0.0.1', CONVERSATION_ID, {
        content: 'Xin chào',
        providerPreference: 'auto',
      }),
    );

    expect(deltas).toEqual(['Xin ', 'chao ', 'ban']);
    // user persisted first, assistant persisted last (full accumulated text + provider metadata).
    expect(createConversationMessage).toHaveBeenCalledTimes(2);
    expect(createConversationMessage.mock.calls[0]?.[0]).toMatchObject({ role: 'user', content: 'Xin chào' });
    expect(createConversationMessage.mock.calls[1]?.[0]).toMatchObject({
      role: 'assistant',
      content: 'Xin chao ban',
      providerName: 'openai-compat',
    });
    expect((result as { id: string }).id).toBe(ASSISTANT_RECORD.id);
    expect(persistenceGateway.listRecentConversationMessages).toHaveBeenCalledTimes(1);
  });

  it('does NOT persist an assistant message when the provider errors mid-stream', async () => {
    const streamProvider = {
      generateConversationStream: vi.fn(() => providerStream(['Xin ', 'chao'], 2)),
    };
    const { service, createConversationMessage } = buildStreamingService(streamProvider);

    const generator = service.appendMessageAndGenerateStream(emailUser, '127.0.0.1', CONVERSATION_ID, {
      content: 'Xin chào',
      providerPreference: 'auto',
    });

    const collected: string[] = [];
    await expect(
      (async () => {
        let next = await generator.next();
        while (!next.done) {
          collected.push(next.value as string);
          next = await generator.next();
        }
      })(),
    ).rejects.toBeInstanceOf(ApiErrorHttpException);

    expect(collected).toEqual(['Xin ', 'chao']);
    // Only the user message was persisted; the partial assistant text is dropped.
    expect(createConversationMessage).toHaveBeenCalledTimes(1);
    expect(createConversationMessage.mock.calls[0]?.[0]).toMatchObject({ role: 'user' });
  });

  it('falls back to the non-stream path and emits the full text as one chunk when no provider streams', async () => {
    const { service, conversationRouter, createConversationMessage } = buildStreamingService(null);

    const { deltas, result } = await drain(
      service.appendMessageAndGenerateStream(emailUser, '127.0.0.1', CONVERSATION_ID, {
        content: 'Xin chào',
        providerPreference: 'deepseek',
      }),
    );

    expect(conversationRouter.generate).toHaveBeenCalledTimes(1);
    expect(deltas).toEqual(['non-stream full text']);
    expect(createConversationMessage).toHaveBeenCalledTimes(2);
    expect(createConversationMessage.mock.calls[1]?.[0]).toMatchObject({
      role: 'assistant',
      content: 'non-stream full text',
    });
    expect((result as { id: string }).id).toBe(ASSISTANT_RECORD.id);
  });

  it('propagates .return() to the provider iterator when the consumer stops early (client disconnect)', async () => {
    // P2-1: when the controller aborts mid-stream (client disconnect), calling .return() on the
    // service generator must flow down to the provider iterator's .return() so the upstream fetch is
    // cancelled and no more tokens are billed. A hand-rolled iterator records the .return() call.
    const providerReturn = vi.fn(async () => ({ value: undefined, done: true }) as IteratorReturnResult<undefined>);
    let pulls = 0;
    const providerIterator = {
      next: vi.fn(async () => {
        pulls += 1;
        return { value: `tok-${pulls}`, done: false } as IteratorYieldResult<string>;
      }),
      return: providerReturn,
      [Symbol.asyncIterator]() {
        return this;
      },
    };
    const streamProvider = { generateConversationStream: vi.fn(() => providerIterator) };
    const { service, createConversationMessage } = buildStreamingService(streamProvider);

    const generator = service.appendMessageAndGenerateStream(emailUser, '127.0.0.1', CONVERSATION_ID, {
      content: 'Xin chào',
      providerPreference: 'auto',
    });

    const first = await generator.next();
    expect(first.value).toBe('tok-1');
    await generator.return(undefined as never);

    expect(providerReturn).toHaveBeenCalledOnce();
    // No assistant message is persisted on an early disconnect — the stream never completed.
    expect(createConversationMessage).toHaveBeenCalledTimes(1);
    expect(createConversationMessage.mock.calls[0]?.[0]).toMatchObject({ role: 'user' });
  });
});
