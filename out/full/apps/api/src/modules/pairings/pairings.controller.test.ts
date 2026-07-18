import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser, BirthInput, PairingSnapshot } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import type { PairingsService } from './pairings.service';
import { PairingsController } from './pairings.controller';

function expectApiError(error: unknown, status: HttpStatus, code: string, requestId: string | null): void {
  expect(error).toBeInstanceOf(ApiErrorHttpException);
  const apiError = error as ApiErrorHttpException;
  const response = apiError.getResponse() as { code: string; requestId: string | null };

  expect(apiError.getStatus()).toBe(status);
  expect(response.code).toBe(code);
  expect(response.requestId).toBe(requestId);
}

function birth(year: number): BirthInput {
  return {
    calendar: 'gregorian',
    date: { year, month: 6, day: 15, isLeapMonth: null },
    time: { hour: 12, minute: 0, isUnknown: false },
    sexOrGenderForChart: 'female',
    place: {
      label: 'Ho Chi Minh City',
      manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
    },
    locale: 'vi-VN',
    source: 'user-entered',
  };
}

const validBody = { primary: birth(1990), partner: birth(1992), relationType: 'love' };

describe('PairingsController', () => {
  const user: AuthenticatedUser = { userId: '11111111-1111-1111-1111-111111111111', email: 'user@example.com' };
  const request = { ip: '127.0.0.1', requestId: 'req-1' } as AuthenticatedRequest;

  it('từ chối body sai với INVALID_INPUT (kèm requestId)', async () => {
    const service = { createPairing: vi.fn() } as Pick<PairingsService, 'createPairing'>;
    const controller = new PairingsController(service as PairingsService);

    try {
      await controller.create(user, request, { primary: birth(1990), relationType: 'love' });
      throw new Error('expected controller to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.BAD_REQUEST, 'INVALID_INPUT', 'req-1');
    }

    expect(service.createPairing).not.toHaveBeenCalled();
  });

  it('truyền input đã parse, user và ip xuống service', async () => {
    const response = { relationType: 'love' } as PairingSnapshot;
    const service = { createPairing: vi.fn().mockResolvedValue(response) } as Pick<PairingsService, 'createPairing'>;
    const controller = new PairingsController(service as PairingsService);

    await expect(controller.create(user, request, validBody)).resolves.toEqual(response);

    expect(service.createPairing).toHaveBeenCalledWith(
      user,
      '127.0.0.1',
      expect.objectContaining({ relationType: 'love' }),
    );
  });

  it('dùng ip fallback "unknown" khi request.ip vắng', async () => {
    const response = { relationType: 'business' } as PairingSnapshot;
    const service = { createPairing: vi.fn().mockResolvedValue(response) } as Pick<PairingsService, 'createPairing'>;
    const controller = new PairingsController(service as PairingsService);

    await controller.create(user, { requestId: 'req-2' } as AuthenticatedRequest, {
      ...validBody,
      relationType: 'business',
    });

    expect(service.createPairing).toHaveBeenCalledWith(user, 'unknown', expect.objectContaining({ relationType: 'business' }));
  });
});
