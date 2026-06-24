import { HttpStatus } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type AuthenticatedUser, type BirthInput, type PairingRequest } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { apiEnv } from '../../config/env';
import type { QuotasService } from '../quotas/quotas.service';
import { PairingsService } from './pairings.service';

function expectApiError(error: unknown, status: HttpStatus, code: string): void {
  expect(error).toBeInstanceOf(ApiErrorHttpException);
  const apiError = error as ApiErrorHttpException;
  const response = apiError.getResponse() as { code: string };

  expect(apiError.getStatus()).toBe(status);
  expect(response.code).toBe(code);
}

function birth(year: number, month: number, day: number, hour: number): BirthInput {
  return {
    calendar: 'gregorian',
    date: { year, month, day, isLeapMonth: null },
    time: { hour, minute: 0, isUnknown: false },
    sexOrGenderForChart: 'female',
    place: {
      label: 'Ho Chi Minh City',
      manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
    },
    locale: 'vi-VN',
    source: 'test-fixture',
  };
}

const request: PairingRequest = { primary: birth(1990, 6, 15, 12), partner: birth(1992, 3, 8, 9), relationType: 'love' };

describe('PairingsService', () => {
  const originalHepanEnabled = apiEnv.EXTENDED_SYSTEM_HEPAN_ENABLED;
  const originalFreeForAll = apiEnv.AI_EXPLANATION_FREE_FOR_ALL;
  const user: AuthenticatedUser = { userId: '11111111-1111-1111-1111-111111111111', email: 'user@example.com' };
  let quotasService: Pick<QuotasService, 'assertCanCreatePairing'>;
  let service: PairingsService;

  beforeEach(() => {
    apiEnv.EXTENDED_SYSTEM_HEPAN_ENABLED = true;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = true;
    quotasService = { assertCanCreatePairing: vi.fn().mockResolvedValue(undefined) };
    service = new PairingsService(quotasService as QuotasService);
  });

  afterEach(() => {
    apiEnv.EXTENDED_SYSTEM_HEPAN_ENABLED = originalHepanEnabled;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = originalFreeForAll;
    vi.restoreAllMocks();
  });

  it('chặn FEATURE_DISABLED khi cờ Hợp Hôn tắt', async () => {
    apiEnv.EXTENDED_SYSTEM_HEPAN_ENABLED = false;

    try {
      await service.createPairing(user, '127.0.0.1', request);
      throw new Error('expected hepan flag gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.FORBIDDEN, 'FEATURE_DISABLED');
    }

    expect(quotasService.assertCanCreatePairing).not.toHaveBeenCalled();
  });

  it('chặn PAYMENT_REQUIRED khi đã bật nhưng AI gate không free-for-all', async () => {
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = false;

    try {
      await service.createPairing(user, '127.0.0.1', request);
      throw new Error('expected premium gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.PAYMENT_REQUIRED, 'PAYMENT_REQUIRED');
    }

    expect(quotasService.assertCanCreatePairing).not.toHaveBeenCalled();
  });

  it('bọc lỗi quota raw thành 429 RATE_LIMITED', async () => {
    quotasService.assertCanCreatePairing = vi.fn().mockRejectedValue(new Error('Daily explanation quota exceeded.'));
    service = new PairingsService(quotasService as QuotasService);

    try {
      await service.createPairing(user, '127.0.0.1', request);
      throw new Error('expected quota gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMITED');
    }
  });

  it('trả pairingSnapshot hợp lệ (2 ziwei + compatibility) khi bật + free-for-all', async () => {
    const result = await service.createPairing(user, '127.0.0.1', request);

    expect(result.relationType).toBe('love');
    expect(result.primary.chartSystem).toBe('zi-wei-dou-shu');
    expect(result.partner.chartSystem).toBe('zi-wei-dou-shu');
    expect(result.compatibility.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.compatibility.dimensions.length).toBeGreaterThanOrEqual(1);
    expect(quotasService.assertCanCreatePairing).toHaveBeenCalledWith(user.userId, '127.0.0.1', false);
  });

  it('coi email rỗng là phiên ẩn danh (isAnonymous=true cho quota)', async () => {
    const anon: AuthenticatedUser = { userId: '22222222-2222-2222-2222-222222222222', email: '' };

    await service.createPairing(anon, '127.0.0.1', request);

    expect(quotasService.assertCanCreatePairing).toHaveBeenCalledWith(anon.userId, '127.0.0.1', true);
  });
});
