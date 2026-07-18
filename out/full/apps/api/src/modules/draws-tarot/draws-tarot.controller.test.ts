import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser, TarotDraw } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import type { DrawsTarotService } from './draws-tarot.service';
import { DrawsTarotController } from './draws-tarot.controller';

function expectApiError(error: unknown, status: HttpStatus, code: string, requestId: string | null): void {
  expect(error).toBeInstanceOf(ApiErrorHttpException);
  const apiError = error as ApiErrorHttpException;
  const response = apiError.getResponse() as { code: string; requestId: string | null };

  expect(apiError.getStatus()).toBe(status);
  expect(response.code).toBe(code);
  expect(response.requestId).toBe(requestId);
}

describe('DrawsTarotController', () => {
  const user: AuthenticatedUser = { userId: '11111111-1111-1111-1111-111111111111', email: 'user@example.com' };
  const request = { ip: '127.0.0.1', requestId: 'req-1' } as AuthenticatedRequest;

  it('rejects invalid body with INVALID_INPUT', async () => {
    const service = { drawTarot: vi.fn() } as Pick<DrawsTarotService, 'drawTarot'>;
    const controller = new DrawsTarotController(service as DrawsTarotService);

    try {
      await controller.draw(user, request, { question: '   ', spread: 'three-card' });
      throw new Error('expected controller to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.BAD_REQUEST, 'INVALID_INPUT', 'req-1');
    }

    expect(service.drawTarot).not.toHaveBeenCalled();
  });

  it('passes trimmed payload, ip, seed and spread to service', async () => {
    const response: TarotDraw = {
      question: 'Tôi nên làm gì?',
      spread: 'three-card',
      cards: [{ id: 'major_00', name: 'Kẻ Khờ (The Fool)', reversed: false, position: 0 }],
      narrative: 'Luận giải mẫu.',
      seed: 'seed-1',
    };
    const service = { drawTarot: vi.fn().mockResolvedValue(response) } as Pick<DrawsTarotService, 'drawTarot'>;
    const controller = new DrawsTarotController(service as DrawsTarotService);

    await expect(
      controller.draw(user, request, { question: '  Tôi nên làm gì?  ', spread: 'three-card', seed: 'seed-1' }),
    ).resolves.toEqual(response);

    expect(service.drawTarot).toHaveBeenCalledWith(user, '127.0.0.1', 'Tôi nên làm gì?', 'three-card', 'seed-1');
  });

  it('uses unknown ip fallback when request.ip is absent', async () => {
    const response: TarotDraw = {
      question: 'Tôi nên làm gì?',
      spread: 'three-card',
      cards: [{ id: 'major_00', name: 'Kẻ Khờ (The Fool)', reversed: false, position: 0 }],
      narrative: 'Luận giải mẫu.',
    };
    const service = { drawTarot: vi.fn().mockResolvedValue(response) } as Pick<DrawsTarotService, 'drawTarot'>;
    const controller = new DrawsTarotController(service as DrawsTarotService);

    await controller.draw(user, { requestId: 'req-2' } as AuthenticatedRequest, {
      question: 'Tôi nên làm gì?',
      spread: 'three-card',
    });

    expect(service.drawTarot).toHaveBeenCalledWith(user, 'unknown', 'Tôi nên làm gì?', 'three-card', undefined);
  });
});
