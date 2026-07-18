import { HttpStatus } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { apiEnv } from '../../config/env';
import { assertCanUseAiVisionExplanation } from './vision-quota';

function expectVisionQuotaExceeded(error: unknown): void {
  expect(error).toBeInstanceOf(ApiErrorHttpException);
  const apiError = error as ApiErrorHttpException;
  const response = apiError.getResponse() as { code: string; message: string };

  expect(apiError.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
  expect(response.code).toBe('VISION_QUOTA_EXCEEDED');
  expect(response.message).toContain('hình ảnh');
}

describe('assertCanUseAiVisionExplanation', () => {
  const originalLimit = apiEnv.API_VISION_REQUESTS_PER_DAY_PER_USER;

  afterEach(() => {
    apiEnv.API_VISION_REQUESTS_PER_DAY_PER_USER = originalLimit;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('cho qua khi usage nhỏ hơn limit', async () => {
    apiEnv.API_VISION_REQUESTS_PER_DAY_PER_USER = 5;
    const countVisionSince = vi.fn().mockResolvedValue(4);

    await expect(assertCanUseAiVisionExplanation(countVisionSince, 'user-1')).resolves.toBeUndefined();
  });

  it('chặn 429 khi usage bằng limit', async () => {
    apiEnv.API_VISION_REQUESTS_PER_DAY_PER_USER = 5;
    const countVisionSince = vi.fn().mockResolvedValue(5);

    try {
      await assertCanUseAiVisionExplanation(countVisionSince, 'user-1');
      throw new Error('expected vision quota to throw');
    } catch (error) {
      expectVisionQuotaExceeded(error);
    }
  });

  it('đếm trong cửa sổ 24 giờ gần nhất', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00.000Z'));
    const countVisionSince = vi.fn().mockResolvedValue(0);

    await assertCanUseAiVisionExplanation(countVisionSince, 'user-1');

    expect(countVisionSince).toHaveBeenCalledWith('user-1', '2026-06-17T12:00:00.000Z');
  });
});
