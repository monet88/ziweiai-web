import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser, CreateExplanationResponse } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { ExplanationsController } from './explanations.controller';
import type { ExplanationsService } from './services/explanations.service';

const USER: AuthenticatedUser = { userId: '11111111-1111-4111-8111-111111111111', email: 'user@example.com' };
const CHART_ID = '22222222-2222-4222-8222-222222222222';

const MOCK_RESPONSE: CreateExplanationResponse = {
  request: {
    id: '33333333-3333-4333-8333-333333333333',
    ownerUserId: USER.userId,
    chartSnapshotId: CHART_ID,
    idempotencyKey: 'idemp-key-test-123456',
    providerName: 'openai-compat',
    requestState: 'completed',
    promptStorageMode: 'not_stored',
    failureRetainsUntil: null,
    createdAt: '2026-06-18T00:00:00.000Z',
    updatedAt: '2026-06-18T00:00:00.000Z',
  },
  result: {
    id: '44444444-4444-4444-8444-444444444444',
    ownerUserId: USER.userId,
    explanationRequestId: '33333333-3333-4333-8333-333333333333',
    chartSnapshotId: CHART_ID,
    cacheScope: 'user_snapshot',
    renderedMarkdown: 'Bản cung Mệnh sáng lạn.',
    providerMetadata: {},
    createdAt: '2026-06-18T00:00:00.000Z',
  },
  explanationContext: {
    chartSystem: 'zi-wei-dou-shu',
    visibleMessageKeys: ['birth.time.verified'],
    confidence: { level: 'high', reasons: [], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
    sourceLabel: 'iztro@2.5.8',
  },
};

function createService(overrides: Partial<Record<keyof ExplanationsService, unknown>> = {}) {
  const service = {
    createExplanation: vi.fn(async () => MOCK_RESPONSE),
    createExplanationStream: vi.fn(async function* () {
      yield 'Bản cung ';
      yield 'Mệnh sáng lạn.';
      return MOCK_RESPONSE;
    }),
    ...overrides,
  };

  return service as unknown as ExplanationsService;
}

function createRequest(): AuthenticatedRequest {
  return {
    ip: '127.0.0.1',
    requestId: 'req-exp-1',
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as AuthenticatedRequest;
}

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
    .filter((chunk) => chunk.trim().startsWith('data: '))
    .map((chunk) => JSON.parse(chunk.trim().slice(6)));
}

describe('ExplanationsController', () => {
  it('calls createExplanation on non-streaming POST', async () => {
    const service = createService();
    const controller = new ExplanationsController(service);
    const request = createRequest();

    const result = await controller.createExplanation(USER, request, {
      chartSnapshotId: CHART_ID,
      explanationKind: 'overview',
      providerPreference: 'auto',
      userConsentedToStorePrompt: false,
    });

    expect(service.createExplanation).toHaveBeenCalledWith(USER, '127.0.0.1', expect.anything());
    expect(result).toEqual(MOCK_RESPONSE);
  });

  describe('createExplanationStream', () => {
    it('emits chunk and done frames with correct SSE headers', async () => {
      const service = createService();
      const controller = new ExplanationsController(service);
      const request = createRequest();
      const { res, writes, headers } = createResponse();

      await controller.createExplanationStream(
        USER,
        request,
        res as any,
        {
          chartSnapshotId: CHART_ID,
          explanationKind: 'overview',
          providerPreference: 'auto',
          userConsentedToStorePrompt: false,
        },
      );

      expect(headers['Content-Type']).toBe('text/event-stream');
      expect(headers['Cache-Control']).toBe('no-cache, no-transform');
      expect(headers['Connection']).toBe('keep-alive');
      expect(res.end).toHaveBeenCalled();

      const frames = parseSseFrames(writes);
      expect(frames).toEqual([
        { type: 'chunk', delta: 'Bản cung ' },
        { type: 'chunk', delta: 'Mệnh sáng lạn.' },
        { type: 'done', ...MOCK_RESPONSE },
      ]);
    });

    it('returns a normal JSON error if gate throws before headers are flushed', async () => {
      const service = createService({
        createExplanationStream: vi.fn(() => {
          throw new ApiErrorHttpException(HttpStatus.PAYMENT_REQUIRED, 'PAYMENT_REQUIRED', 'Không đủ XU');
        }),
      });
      const controller = new ExplanationsController(service);
      const request = createRequest();
      const { res } = createResponse();

      await controller.createExplanationStream(
        USER,
        request,
        res as any,
        {
          chartSnapshotId: CHART_ID,
          explanationKind: 'overview',
          providerPreference: 'auto',
          userConsentedToStorePrompt: false,
        },
      );

      expect(res.status).toHaveBeenCalledWith(402);
      expect(res.json).toHaveBeenCalledWith({
        code: 'PAYMENT_REQUIRED',
        message: 'Không đủ XU',
        requestId: 'req-exp-1',
      });
      expect(res.write).not.toHaveBeenCalled();
    });

    it('emits an SSE error frame if an error occurs mid-stream after headers are flushed', async () => {
      const service = createService({
        createExplanationStream: vi.fn(async function* () {
          yield 'Phần mở đầu...';
          throw new ApiErrorHttpException(HttpStatus.GATEWAY_TIMEOUT, 'PROVIDER_TIMEOUT', 'Timeout');
        }),
      });
      const controller = new ExplanationsController(service);
      const request = createRequest();
      const { res, writes } = createResponse();

      await controller.createExplanationStream(
        USER,
        request,
        res as any,
        {
          chartSnapshotId: CHART_ID,
          explanationKind: 'overview',
          providerPreference: 'auto',
          userConsentedToStorePrompt: false,
        },
      );

      const frames = parseSseFrames(writes);
      expect(frames).toEqual([
        { type: 'chunk', delta: 'Phần mở đầu...' },
        {
          type: 'error',
          error: {
            code: 'PROVIDER_TIMEOUT',
            message: 'Timeout',
            requestId: 'req-exp-1',
          },
        },
      ]);
    });
  });
});
