import { HttpStatus } from '@nestjs/common';
import { ApiErrorHttpException } from '../../common/http/api-error';

// Bọc lỗi quota (raw Error từ QuotasService) thành 429 RATE_LIMITED — gom phần lặp ở các service
// (charts/explanations/tarot/pairings/mbti/fortune/annual). Nếu không bọc, raw Error rơi xuống
// ApiErrorFilter và trả 500 INTERNAL_ERROR. `fallbackMessage` (tiếng Việt) dùng khi error không phải
// Error chuẩn. Trả `never` để TypeScript biết control không chạy tiếp sau lời gọi trong khối catch.
//
// LƯU Ý: đây là mapper "catch-all" — MỌI lỗi (kể cả quota-store outage) đều thành 429. Các đường có
// chính sách phân biệt typed-error (divinations/conversations) hoặc hai mã lỗi (vision:
// VISION_QUOTA_EXCEEDED) KHÔNG dùng helper này vì hành vi rethrow/đa-mã của chúng là có chủ đích.
export function throwQuotaRateLimited(error: unknown, fallbackMessage: string): never {
  throw new ApiErrorHttpException(
    HttpStatus.TOO_MANY_REQUESTS,
    'RATE_LIMITED',
    error instanceof Error ? error.message : fallbackMessage,
  );
}
