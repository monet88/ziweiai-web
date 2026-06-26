import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { ConversationsController } from './conversations.controller';
import type { ConversationsService } from './services/conversations.service';

const USER: AuthenticatedUser = { userId: '11111111-1111-4111-8111-111111111111', email: 'user@example.com' };
const CHART_ID = '22222222-2222-4222-8222-222222222222';
const CONVERSATION_ID = '33333333-3333-4333-8333-333333333333';

function createService(overrides: Partial<Record<keyof ConversationsService, unknown>> = {}) {
  const service = {
    createConversation: vi.fn(async () => ({ id: CONVERSATION_ID })),
    listConversationsForChart: vi.fn(async () => ({ items: [] })),
    getConversationDetail: vi.fn(async () => ({ id: CONVERSATION_ID, messages: [] })),
    appendMessageAndGenerate: vi.fn(async () => ({ fullText: 'xin chào', assistantMessage: { id: 'm1' } })),
    ...overrides,
  };

  return service as unknown as ConversationsService;
}

function createRequest(): AuthenticatedRequest {
  // The streaming handler registers/removes a 'close' listener for client-disconnect aborts; the
  // non-stream handlers ignore these. Stub on/off so both paths run without a real socket.
  return {
    ip: '127.0.0.1',
    requestId: 'req-1',
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as AuthenticatedRequest;
}

async function expectBadRequest(promise: Promise<unknown>): Promise<void> {
  // safeParse-based validation must surface a typed 400 INVALID_INPUT (đồng nhất VisionController),
  // not a raw ZodError. Khẳng định cả status lẫn code để khoá đúng hợp đồng lỗi.
  await expect(promise).rejects.toBeInstanceOf(ApiErrorHttpException);
  const error = await promise.catch((e) => e as ApiErrorHttpException);
  expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
  expect((error.getResponse() as { code: string }).code).toBe('INVALID_INPUT');
}

describe('ConversationsController input validation', () => {
  describe('createConversation', () => {
    it('ném 400 INVALID_INPUT khi body sai schema, không gọi service', async () => {
      const service = createService();
      const controller = new ConversationsController(service);

      await expectBadRequest(controller.createConversation(USER, { chartSnapshotId: 'not-a-uuid' }));
      expect(service.createConversation).not.toHaveBeenCalled();
    });
  });

  describe('listConversations', () => {
    it('ném 400 INVALID_INPUT khi thiếu chartSnapshotId', async () => {
      const service = createService();
      const controller = new ConversationsController(service);

      await expectBadRequest(controller.listConversations(USER, undefined));
      expect(service.listConversationsForChart).not.toHaveBeenCalled();
    });

    it('chuyển tiếp xuống service khi chartSnapshotId hợp lệ', async () => {
      const service = createService();
      const controller = new ConversationsController(service);

      await controller.listConversations(USER, CHART_ID);

      expect(service.listConversationsForChart).toHaveBeenCalledWith(USER.userId, CHART_ID);
    });
  });

  describe('getConversationDetail', () => {
    it('ném 400 INVALID_INPUT khi conversationId không phải uuid', async () => {
      const service = createService();
      const controller = new ConversationsController(service);

      await expectBadRequest(controller.getConversationDetail(USER, 'nope'));
      expect(service.getConversationDetail).not.toHaveBeenCalled();
    });

    it('chuyển tiếp xuống service khi conversationId hợp lệ', async () => {
      const service = createService();
      const controller = new ConversationsController(service);

      await controller.getConversationDetail(USER, CONVERSATION_ID);

      expect(service.getConversationDetail).toHaveBeenCalledWith(USER.userId, CONVERSATION_ID);
    });
  });

  describe('appendMessage', () => {
    it('ném 400 INVALID_INPUT khi conversationId không phải uuid, trước khi đụng tới body', async () => {
      const service = createService();
      const controller = new ConversationsController(service);

      await expectBadRequest(
        controller.appendMessage(USER, 'nope', { content: 'xin chào' }, createRequest()),
      );
      expect(service.appendMessageAndGenerate).not.toHaveBeenCalled();
    });

    it('ném 400 INVALID_INPUT khi body tin nhắn sai schema', async () => {
      const service = createService();
      const controller = new ConversationsController(service);

      await expectBadRequest(
        controller.appendMessage(USER, CONVERSATION_ID, { content: 123 }, createRequest()),
      );
      expect(service.appendMessageAndGenerate).not.toHaveBeenCalled();
    });
  });
});

// US-027 (decision 0026): the streaming endpoint consumes a REAL async iterator from the service
// (appendMessageAndGenerateStream), emits each delta as an SSE `chunk` frame, then a `done` frame
// with the persisted message. A gate/error firing BEFORE the first byte must return a normal JSON
// error with the correct status (headers not yet sent).
describe('ConversationsController.appendMessageStream', () => {
  function createResponse() {
    const writes: string[] = [];
    const headers: Record<string, string> = {};
    const closeHandlers: Array<() => void> = [];
    const res = {
      headersSent: false,
      destroyed: false,
      writableEnded: false,
      statusCode: 200,
      setHeader: vi.fn((key: string, value: string) => {
        headers[key] = value;
      }),
      flushHeaders: vi.fn(() => {
        res.headersSent = true;
      }),
      write: vi.fn((chunk: string) => {
        writes.push(chunk);
        return true;
      }),
      status: vi.fn((code: number) => {
        res.statusCode = code;
        return res;
      }),
      json: vi.fn(),
      on: vi.fn((event: string, handler: () => void) => {
        if (event === 'close') {
          closeHandlers.push(handler);
        }
      }),
      off: vi.fn(),
      end: vi.fn(() => {
        // Mirror Node: end() sets writableEnded before the eventual 'close'. The disconnect guard
        // relies on this so a normal end() is not mistaken for a client disconnect.
        res.writableEnded = true;
      }),
    };
    const fireClose = () => closeHandlers.forEach((handler) => handler());
    return { res, writes, headers, fireClose };
  }

  function parseSseFrames(writes: string[]): unknown[] {
    return writes
      .join('')
      .split('\n\n')
      .filter((frame) => frame.startsWith('data: '))
      .map((frame) => JSON.parse(frame.slice('data: '.length)));
  }

  const ASSISTANT_MESSAGE = {
    id: '77777777-7777-4777-8777-777777777777',
    ownerUserId: USER.userId,
    conversationId: CONVERSATION_ID,
    role: 'assistant',
    content: 'Xin chao ban',
    quickPromptKey: null,
    providerName: 'openai-compat',
    providerMetadata: { provider: 'openai-compat' },
    createdAt: '2026-06-26T03:00:00.000Z',
  };

  function streamingService(generator: () => AsyncGenerator<string, unknown, void>) {
    return createService({
      appendMessageAndGenerateStream: vi.fn(() => generator()),
    });
  }

  it('emits real chunk frames per delta then a done frame with the persisted message', async () => {
    async function* gen(): AsyncGenerator<string, unknown, void> {
      yield 'Xin ';
      yield 'chao ';
      yield 'ban';
      return ASSISTANT_MESSAGE;
    }
    const service = streamingService(gen);
    const controller = new ConversationsController(service);
    const { res, writes } = createResponse();

    await controller.appendMessageStream(USER, CONVERSATION_ID, { content: 'Xin chào' }, createRequest(), res as never);

    expect(res.flushHeaders).toHaveBeenCalledOnce();
    const frames = parseSseFrames(writes);
    expect(frames).toEqual([
      { type: 'chunk', delta: 'Xin ' },
      { type: 'chunk', delta: 'chao ' },
      { type: 'chunk', delta: 'ban' },
      { type: 'done', message: ASSISTANT_MESSAGE },
    ]);
    expect(res.end).toHaveBeenCalledOnce();
  });

  it('returns a JSON error with the typed status when a gate fires before the first byte', async () => {
    // The gate throws before any token is produced (mirrors entitlement/quota failures): the service
    // generator rejects on the first `.next()`, so headers are never flushed. A plain rejecting
    // iterator models this without an empty generator body.
    const service = createService({
      appendMessageAndGenerateStream: vi.fn(() => ({
        next: () =>
          Promise.reject(
            new ApiErrorHttpException(HttpStatus.PAYMENT_REQUIRED, 'PAYMENT_REQUIRED', 'Cần gói trả phí.'),
          ),
      })),
    });
    const controller = new ConversationsController(service);
    const { res } = createResponse();

    await controller.appendMessageStream(USER, CONVERSATION_ID, { content: 'Xin chào' }, createRequest(), res as never);

    expect(res.flushHeaders).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(HttpStatus.PAYMENT_REQUIRED);
    expect(res.json).toHaveBeenCalledWith({
      code: 'PAYMENT_REQUIRED',
      message: 'Cần gói trả phí.',
      requestId: 'req-1',
    });
  });

  it('surfaces an SSE error frame when the provider fails AFTER the stream opened', async () => {
    async function* gen(): AsyncGenerator<string, unknown, void> {
      yield 'Xin ';
      throw new ApiErrorHttpException(HttpStatus.BAD_GATEWAY, 'PROVIDER_UNAVAILABLE', 'Đứt giữa chừng.');
    }
    const service = streamingService(gen);
    const controller = new ConversationsController(service);
    const { res, writes } = createResponse();

    await controller.appendMessageStream(USER, CONVERSATION_ID, { content: 'Xin chào' }, createRequest(), res as never);

    expect(res.flushHeaders).toHaveBeenCalledOnce();
    const frames = parseSseFrames(writes);
    expect(frames).toEqual([
      { type: 'chunk', delta: 'Xin ' },
      { type: 'error', error: { code: 'PROVIDER_UNAVAILABLE', message: 'Đứt giữa chừng.', requestId: 'req-1' } },
    ]);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalledOnce();
  });

  // US-027 (decision 0026, revised): the controller drives the provider stream to completion so the
  // service ALWAYS persists the assistant message, even if the client disconnects mid-stream. We do
  // not abort on a client 'close' — the response 'close' is not a reliable mid-stream disconnect
  // signal under Node/Express (it can fire before the SSE ends), and a spurious abort would kill the
  // upstream fetch before the assistant message is persisted. After a disconnect, the controller
  // simply stops writing to the dead socket but keeps consuming so the service finishes + persists.
  // The disconnect-driven upstream-abort optimization is re-deferred to backlog #28.
  it('drives the stream to completion even if the client socket dies mid-stream (persist must win)', async () => {
    let consumedToEnd = false;
    async function* gen(): AsyncGenerator<string, unknown, void> {
      yield 'Xin ';
      yield 'chào';
      consumedToEnd = true;
      return ASSISTANT_MESSAGE;
    }
    const service = createService({
      appendMessageAndGenerateStream: vi.fn(() => gen()),
    });
    const controller = new ConversationsController(service);
    const { res, writes } = createResponse();
    // Simulate a dead client socket: writes are no-ops and the socket reports destroyed.
    (res as { destroyed: boolean }).destroyed = true;

    await controller.appendMessageStream(
      USER,
      CONVERSATION_ID,
      { content: 'Xin chào' },
      createRequest(),
      res as never,
    );

    // The generator was driven to its return value (service persisted), not abandoned at first delta.
    expect(consumedToEnd).toBe(true);
    // Nothing was written to the dead socket, and res.end() is skipped on a destroyed socket.
    expect(writes).toEqual([]);
    expect(res.end).not.toHaveBeenCalled();
  });

  it('does not leak a raw non-typed error message to the client (generic message instead)', async () => {
    // A non-ApiError, non-ProviderError leaking an internal detail (e.g. a DSN with a password) on the
    // first pull. A plain rejecting iterator models this without an empty generator body.
    const service = createService({
      appendMessageAndGenerateStream: vi.fn(() => ({
        next: () => Promise.reject(new Error('connect ECONNREFUSED 10.0.0.5:5432 password=supersecret')),
      })),
    });
    const controller = new ConversationsController(service);
    const { res } = createResponse();

    await controller.appendMessageStream(USER, CONVERSATION_ID, { content: 'Xin chào' }, createRequest(), res as never);

    // Headers never flushed (error before first byte) -> JSON error. Message must be generic.
    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_GATEWAY);
    const jsonArg = (res.json as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as {
      code: string;
      message: string;
    };
    expect(jsonArg.code).toBe('PROVIDER_UNAVAILABLE');
    expect(jsonArg.message).toBe('Đã xảy ra lỗi khi tạo nội dung. Vui lòng thử lại.');
    expect(jsonArg.message).not.toContain('supersecret');
    expect(jsonArg.message).not.toContain('ECONNREFUSED');
  });
});
