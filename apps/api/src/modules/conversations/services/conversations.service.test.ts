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
