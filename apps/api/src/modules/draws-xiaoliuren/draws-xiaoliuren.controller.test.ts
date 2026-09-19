import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser, XiaoLiuRenDraw } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import type { DrawsXiaoLiuRenService } from './draws-xiaoliuren.service';
import { DrawsXiaoLiuRenController } from './draws-xiaoliuren.controller';

function expectApiError(error: unknown, status: HttpStatus, code: string, requestId: string | null): void {
  expect(error).toBeInstanceOf(ApiErrorHttpException);
  const apiError = error as ApiErrorHttpException;
  const response = apiError.getResponse() as { code: string; requestId: string | null };

  expect(apiError.getStatus()).toBe(status);
  expect(response.code).toBe(code);
  expect(response.requestId).toBe(requestId);
}

describe('DrawsXiaoLiuRenController', () => {
  const user: AuthenticatedUser = { userId: '11111111-1111-1111-1111-111111111111', email: 'user@example.com' };
  const request = { ip: '127.0.0.1', requestId: 'req-xlr-1' } as AuthenticatedRequest;

  it('rejects empty question with INVALID_INPUT', async () => {
    const service = { drawXiaoLiuRen: vi.fn() } as Pick<DrawsXiaoLiuRenService, 'drawXiaoLiuRen'>;
    const controller = new DrawsXiaoLiuRenController(service as DrawsXiaoLiuRenService);

    try {
      await controller.draw(user, request, { question: '   ' });
      throw new Error('expected controller to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.BAD_REQUEST, 'INVALID_INPUT', 'req-xlr-1');
    }

    expect(service.drawXiaoLiuRen).not.toHaveBeenCalled();
  });

  it('passes valid payload to service', async () => {
    const mockResponse: XiaoLiuRenDraw = {
      question: 'Hôm nay thế nào?',
      method: 'time',
      numbers: [1, 1, 1],
      firstPalace: {
        key: 'dai_an',
        index: 0,
        name: 'Đại An',
        element: 'Mộc',
        direction: 'Đông',
        auspice: 'dai_cat',
        auspiceLabel: 'Đại Cát',
        deity: 'Thanh Long',
        meaning: 'Ý nghĩa',
        poem: 'Thơ',
        advice: 'Khuyên',
      },
      secondPalace: {
        key: 'dai_an',
        index: 0,
        name: 'Đại An',
        element: 'Mộc',
        direction: 'Đông',
        auspice: 'dai_cat',
        auspiceLabel: 'Đại Cát',
        deity: 'Thanh Long',
        meaning: 'Ý nghĩa',
        poem: 'Thơ',
        advice: 'Khuyên',
      },
      targetPalace: {
        key: 'dai_an',
        index: 0,
        name: 'Đại An',
        element: 'Mộc',
        direction: 'Đông',
        auspice: 'dai_cat',
        auspiceLabel: 'Đại Cát',
        deity: 'Thanh Long',
        meaning: 'Ý nghĩa',
        poem: 'Thơ',
        advice: 'Khuyên',
      },
      flowDescription: 'Dòng khí',
      narrative: 'Luận giải',
    };

    const service = {
      drawXiaoLiuRen: vi.fn().mockResolvedValue(mockResponse),
    } as Pick<DrawsXiaoLiuRenService, 'drawXiaoLiuRen'>;
    const controller = new DrawsXiaoLiuRenController(service as DrawsXiaoLiuRenService);

    const result = await controller.draw(user, request, {
      question: 'Hôm nay thế nào?',
      method: 'time',
    });

    expect(result).toEqual(mockResponse);
    expect(service.drawXiaoLiuRen).toHaveBeenCalledWith(user, '127.0.0.1', {
      question: 'Hôm nay thế nào?',
      method: 'time',
    });
  });
});
