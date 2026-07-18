import { HttpException, HttpStatus } from '@nestjs/common';
import { apiErrorSchema, type ApiErrorCode } from '@ziweiai/contracts';

function normalizeApiErrorMessage(message: string): string {
  const normalized = message.trim();
  return normalized.length > 0 ? normalized : 'Đã xảy ra lỗi ứng dụng nội bộ.';
}

export class ApiErrorHttpException extends HttpException {
  constructor(status: HttpStatus, code: ApiErrorCode, message: string, requestId: string | null = null) {
    super(apiErrorSchema.parse({ code, message: normalizeApiErrorMessage(message), requestId }), status);
  }
}
