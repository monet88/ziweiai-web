import { HttpStatus } from '@nestjs/common';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { DailyQuotaExceededError, RateLimitWindowError } from './quota-errors';

function isLegacyQuotaMessage(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /quota exceeded|too many requests|vượt hạn mức/i.test(error.message);
}

// Bọc lỗi quota thành response có typed code cho các service dùng chung
// (charts/explanations/tarot/pairings/mbti/fortune/annual).
//
// Chỉ lỗi vượt hạn mức/rate-limit thật mới trả 429 RATE_LIMITED. Lỗi hạ tầng lạ từ DB/store không
// được báo nhầm là user vượt quota; trả 503 INTERNAL_ERROR với message chung để UI hướng dẫn thử lại.
// `isLegacyQuotaMessage` giữ tương thích với các test/service cũ còn mock raw Error chứa text quota.
export function throwQuotaRateLimited(error: unknown, fallbackMessage: string): never {
  if (error instanceof ApiErrorHttpException) {
    throw error;
  }

  if (
    error instanceof DailyQuotaExceededError ||
    error instanceof RateLimitWindowError ||
    isLegacyQuotaMessage(error)
  ) {
    throw new ApiErrorHttpException(
      HttpStatus.TOO_MANY_REQUESTS,
      'RATE_LIMITED',
      error instanceof Error ? error.message : fallbackMessage,
    );
  }

  throw new ApiErrorHttpException(
    HttpStatus.SERVICE_UNAVAILABLE,
    'INTERNAL_ERROR',
    'Hệ thống kiểm soát hạn mức tạm thời không khả dụng. Vui lòng thử lại sau.',
  );
}
