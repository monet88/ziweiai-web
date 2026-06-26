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
  return { ip: '127.0.0.1', requestId: 'req-1' } as unknown as AuthenticatedRequest;
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
