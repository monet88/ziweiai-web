import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { DailyQuotaExceededError, RateLimitWindowError } from './quota-errors';
import { throwQuotaRateLimited } from './quota-http';

function captureError(error: unknown): ApiErrorHttpException {
  try {
    throwQuotaRateLimited(error, 'Đã vượt hạn mức.');
  } catch (caught) {
    return caught as ApiErrorHttpException;
  }
}

describe('throwQuotaRateLimited', () => {
  it('maps typed daily quota errors to 429 RATE_LIMITED', () => {
    const error = captureError(new DailyQuotaExceededError('Daily explanation quota exceeded.'));

    expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(error.getResponse()).toMatchObject({
      code: 'RATE_LIMITED',
      message: 'Daily explanation quota exceeded.',
    });
  });

  it('maps typed rate-limit window errors to 429 RATE_LIMITED', () => {
    const error = captureError(new RateLimitWindowError('Too many requests in the current time window.'));

    expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(error.getResponse()).toMatchObject({
      code: 'RATE_LIMITED',
      message: 'Too many requests in the current time window.',
    });
  });

  it('keeps legacy raw quota error messages as 429 for compatibility', () => {
    const error = captureError(new Error('Daily chart quota exceeded.'));

    expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(error.getResponse()).toMatchObject({
      code: 'RATE_LIMITED',
      message: 'Daily chart quota exceeded.',
    });
  });

  it('does not misreport unknown quota infrastructure errors as user quota exhaustion', () => {
    const error = captureError(new Error('database connection reset'));

    expect(error.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(error.getResponse()).toMatchObject({
      code: 'INTERNAL_ERROR',
      message: 'Hệ thống kiểm soát hạn mức tạm thời không khả dụng. Vui lòng thử lại sau.',
    });
  });

  it('rethrows already-shaped API errors unchanged', () => {
    const existing = new ApiErrorHttpException(
      HttpStatus.FORBIDDEN,
      'FEATURE_DISABLED',
      'Tính năng đang tắt.',
    );

    expect(captureError(existing)).toBe(existing);
  });
});
