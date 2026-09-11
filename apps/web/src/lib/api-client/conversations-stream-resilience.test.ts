import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  streamExplanation,
  streamConversationMessage,
} from './conversations';

describe('conversations stream resilience & auto-reconnect', () => {
  const chartSnapshotId = '11111111-1111-4111-8111-111111111111';
  const ownerUserId = '22222222-2222-4222-8222-222222222222';
  const conversationId = '33333333-3333-4333-8333-333333333333';
  const explanationRequestId = '44444444-4444-4444-8444-444444444444';
  const resultId = '55555555-5555-4555-8555-555555555555';
  const msg1Id = '66666666-6666-4666-8666-666666666666';
  const msg2Id = '77777777-7777-4777-8777-777777777777';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retries fetch on transient 502 error before yielding any chunk', async () => {
    let callCount = 0;
    const encoder = new TextEncoder();

    const mockFetch = vi.fn().mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 502,
          json: () => Promise.resolve({ message: 'Bad Gateway' }),
        });
      }
      // Second attempt succeeds
      const validDoneEvent = {
        type: 'done',
        request: {
          id: explanationRequestId,
          ownerUserId,
          chartSnapshotId,
          idempotencyKey: '0123456789abcdef0123456789abcdef',
          requestState: 'completed',
          providerName: 'deepseek',
          promptStorageMode: 'not_stored',
          failureRetainsUntil: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        result: {
          id: resultId,
          ownerUserId,
          explanationRequestId,
          chartSnapshotId,
          renderedMarkdown: 'Lời bình Tử Vi',
          cacheScope: 'user_snapshot',
          providerName: 'deepseek',
          providerMetadata: {},
          createdAt: new Date().toISOString(),
        },
        explanationContext: {
          chartSystem: 'zi-wei-dou-shu',
          visibleMessageKeys: ['confidence.high'],
          confidence: {
            level: 'high',
            reasons: [],
            visibleMessageKey: 'confidence.high',
            blocksExactReading: false,
          },
          sourceLabel: 'Tử Vi Toàn Tập',
        },
      };

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              'data: {"type":"chunk","delta":"Lời bình Tử Vi"}\n\n' +
                `data: ${JSON.stringify(validDoneEvent)}\n\n`,
            ),
          );
          controller.close();
        },
      });
      return Promise.resolve({
        ok: true,
        body: stream,
      });
    });

    vi.stubGlobal('fetch', mockFetch);

    const receivedEvents: any[] = [];
    for await (const event of streamExplanation(
      'mock-token',
      { chartSnapshotId, scope: { type: 'overview' } } as any,
      undefined,
      { maxRetries: 2, initialDelayMs: 10, backoffFactor: 1 },
    )) {
      receivedEvents.push(event);
    }

    expect(callCount).toBe(2);
    expect(receivedEvents).toHaveLength(2);
    expect(receivedEvents[0]).toEqual({ type: 'chunk', delta: 'Lời bình Tử Vi' });
    expect(receivedEvents[1].type).toBe('done');
  });

  it('does not retry if AbortSignal is already aborted', async () => {
    const abortController = new AbortController();
    abortController.abort();

    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const receivedEvents: any[] = [];
    for await (const event of streamExplanation(
      'mock-token',
      { chartSnapshotId, scope: { type: 'overview' } } as any,
      abortController.signal,
    )) {
      receivedEvents.push(event);
    }

    expect(mockFetch).not.toHaveBeenCalled();
    expect(receivedEvents).toHaveLength(0);
  });

  it('attempts recovery sync via fetchConversationDetail when stream breaks mid-sentence', async () => {
    const encoder = new TextEncoder();
    let readCount = 0;

    const mockStream = new ReadableStream({
      pull(controller) {
        readCount += 1;
        if (readCount === 1) {
          controller.enqueue(encoder.encode('data: {"type":"chunk","delta":"Cung Mệnh có sao Tử Vi"}\n\n'));
        } else {
          // Simulate sudden socket drop
          controller.error(new Error('Connection reset by peer'));
        }
      },
    });

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/messages/stream')) {
        return Promise.resolve({
          ok: true,
          body: mockStream,
        });
      }
      if (url.includes(`/conversations/${conversationId}`)) {
        // detail response matching conversationDetailResponseSchema
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              conversation: {
                id: conversationId,
                ownerUserId,
                chartSnapshotId,
                title: 'Đàm đạo',
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              messages: [
                {
                  id: msg1Id,
                  ownerUserId,
                  conversationId,
                  role: 'user',
                  content: 'Hỏi về sao Tử Vi',
                  quickPromptKey: null,
                  providerName: 'system',
                  providerMetadata: {},
                  createdAt: new Date().toISOString(),
                },
                {
                  id: msg2Id,
                  ownerUserId,
                  conversationId,
                  role: 'assistant',
                  content: 'Cung Mệnh có sao Tử Vi tọa thủ, tính tình đôn hậu, quang minh chính đại.',
                  quickPromptKey: null,
                  providerName: 'deepseek',
                  providerMetadata: {},
                  createdAt: new Date().toISOString(),
                },
              ],
            }),
        });
      }
      return Promise.reject(new Error('Unknown url: ' + url));
    });

    vi.stubGlobal('fetch', mockFetch);

    const receivedEvents: any[] = [];
    for await (const event of streamConversationMessage(
      'mock-token',
      conversationId,
      { content: 'Hỏi về sao Tử Vi', providerPreference: 'auto' },
      undefined,
      { maxRetries: 0, initialDelayMs: 10 },
    )) {
      receivedEvents.push(event);
    }

    // Must receive initial chunk, recovered missing delta chunk, and done event!
    expect(receivedEvents.length).toBeGreaterThanOrEqual(2);
    expect(receivedEvents[0]).toEqual({ type: 'chunk', delta: 'Cung Mệnh có sao Tử Vi' });
    const lastEvent = receivedEvents[receivedEvents.length - 1];
    expect(lastEvent.type).toBe('done');
    expect(lastEvent.message.content).toContain('quang minh chính đại');
  });
});
