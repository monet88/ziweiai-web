import { HttpStatus } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiErrorHttpException } from '../../../common/http/api-error';
import type { SupabasePersistenceGateway } from '../../../database/supabase-persistence.gateway';
import type { QuotasService } from '../../quotas/quotas.service';
import { DailyQuotaExceededError } from '../../quotas/quota-errors';
import { DivinationsService } from './divinations.service';

function expectApiError(error: unknown, status: HttpStatus, code: string): void {
  expect(error).toBeInstanceOf(ApiErrorHttpException);
  const apiError = error as ApiErrorHttpException;
  const response = apiError.getResponse() as { code: string };
  expect(apiError.getStatus()).toBe(status);
  expect(response.code).toBe(code);
}

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SNAPSHOT_ID = '22222222-2222-4222-8222-222222222222';

describe('DivinationsService', () => {
  let persistenceGateway: Pick<SupabasePersistenceGateway, 'createChartSnapshot' | 'createDivinationContext'>;
  let quotasService: Pick<QuotasService, 'assertCanCreateChart'>;
  let service: DivinationsService;

  beforeEach(() => {
    persistenceGateway = {
      createChartSnapshot: vi.fn().mockImplementation((params: Record<string, unknown>) => {
        const snapshot = params.snapshot as {
          chartSystem: string;
          inputHash: { digest: string };
          calculationConfidence: { level: string };
        };
        return Promise.resolve({
          id: SNAPSHOT_ID,
          ownerUserId: params.ownerUserId,
          birthProfileId: params.birthProfileId ?? null,
          chartSystem: snapshot.chartSystem,
          snapshotDedupeKey: params.snapshotDedupeKey,
          snapshot,
          inputHashDigest: snapshot.inputHash.digest,
          confidenceLevel: snapshot.calculationConfidence.level,
          createdAt: new Date().toISOString(),
        });
      }),
      createDivinationContext: vi.fn().mockImplementation((params: Record<string, unknown>) =>
        Promise.resolve({
          id: '33333333-3333-4333-8333-333333333333',
          ownerUserId: USER_ID,
          chartSnapshotId: SNAPSHOT_ID,
          question: params.question,
          purposeKey: params.purposeKey,
          purposeCustom: params.purposeCustom,
          castAt: params.castAt,
          createdAt: params.castAt,
        }),
      ),
    };
    quotasService = { assertCanCreateChart: vi.fn().mockResolvedValue(undefined) };
    service = new DivinationsService(
      persistenceGateway as SupabasePersistenceGateway,
      quotasService as QuotasService,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('casts a divination, persists snapshot + context, and nulls purposeCustom for presets', async () => {
    const response = await service.createDivination(USER_ID, '127.0.0.1', {
      chartSystem: 'mei-hua-yi-shu',
      question: 'Tôi có nên đổi việc không?',
      purposeKey: 'career',
    });

    expect(quotasService.assertCanCreateChart).toHaveBeenCalledTimes(1);
    expect(persistenceGateway.createChartSnapshot).toHaveBeenCalledTimes(1);
    const contextArg = (persistenceGateway.createDivinationContext as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(contextArg.purposeKey).toBe('career');
    expect(contextArg.purposeCustom).toBeNull();
    expect(response.divinationContext.question).toBe('Tôi có nên đổi việc không?');
    expect(response.reusedExistingSnapshot).toBe(false);
  });

  it('keeps purposeCustom when purposeKey is custom', async () => {
    await service.createDivination(USER_ID, '127.0.0.1', {
      chartSystem: 'liu-yao',
      question: 'Việc mua nhà năm nay thế nào?',
      purposeKey: 'custom',
      purposeCustom: 'Mua nhà',
    });

    const contextArg = (persistenceGateway.createDivinationContext as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(contextArg.purposeKey).toBe('custom');
    expect(contextArg.purposeCustom).toBe('Mua nhà');
  });

  it('manual Mai Hoa casting produces a number-based snapshot', async () => {
    const response = await service.createDivination(USER_ID, '127.0.0.1', {
      chartSystem: 'mei-hua-yi-shu',
      question: 'Quẻ này nói gì?',
      purposeKey: 'decision',
      castMethod: 'manual',
      meihuaManual: { upperNumber: 7, lowerNumber: 3 },
    });

    // The real MeiHuaAdapter runs in-process; manual numbers select method 'number-based'.
    const meihua = (response.snapshot as { meihua?: { method?: string } }).meihua;
    expect(meihua?.method).toBe('number-based');
  });

  it('maps typed quota errors to 429 RATE_LIMITED', async () => {
    quotasService.assertCanCreateChart = vi.fn().mockRejectedValue(new DailyQuotaExceededError('Đã vượt hạn mức.'));
    service = new DivinationsService(
      persistenceGateway as SupabasePersistenceGateway,
      quotasService as QuotasService,
    );

    try {
      await service.createDivination(USER_ID, '127.0.0.1', {
        chartSystem: 'qi-men-dun-jia',
        question: 'Chuyến đi sắp tới có thuận không?',
        purposeKey: 'decision',
      });
      throw new Error('expected quota gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMITED');
    }
    expect(persistenceGateway.createChartSnapshot).not.toHaveBeenCalled();
  });

  it('propagates unexpected (non-quota) errors instead of masking them as 429', async () => {
    const dbError = new Error('connection reset while counting quota');
    quotasService.assertCanCreateChart = vi.fn().mockRejectedValue(dbError);
    service = new DivinationsService(
      persistenceGateway as SupabasePersistenceGateway,
      quotasService as QuotasService,
    );

    await expect(
      service.createDivination(USER_ID, '127.0.0.1', {
        chartSystem: 'qi-men-dun-jia',
        question: 'Chuyến đi sắp tới có thuận không?',
        purposeKey: 'decision',
      }),
    ).rejects.toBe(dbError);
    expect(persistenceGateway.createChartSnapshot).not.toHaveBeenCalled();
  });
});
