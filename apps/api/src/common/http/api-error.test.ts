import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ApiErrorHttpException } from './api-error';

describe('ApiErrorHttpException', () => {
  it('thay message rỗng bằng fallback để không tự làm gãy schema lỗi API', () => {
    const error = new ApiErrorHttpException(HttpStatus.BAD_GATEWAY, 'INTERNAL_ERROR', '   ');
    const response = error.getResponse() as { message: string };

    expect(response.message).toBe('Đã xảy ra lỗi ứng dụng nội bộ.');
  });
});
