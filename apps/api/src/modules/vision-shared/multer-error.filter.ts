import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { ApiErrorFilter } from '../../common/http/api-error.filter';
import { ApiErrorHttpException } from '../../common/http/api-error';

// Multer ném MulterError (name='MulterError') với .code khi giới hạn upload bị vượt — vd
// 'LIMIT_FILE_SIZE' khi ảnh > 4MB. KHÔNG có @types/multer trong workspace nên nhận diện theo cấu trúc.
interface MulterLikeError {
  name: string;
  code?: string;
  message?: string;
}

function isMulterError(error: unknown): error is MulterLikeError {
  return error instanceof Error && error.name === 'MulterError';
}

/**
 * US-017e/f: chuẩn hoá lỗi Multer (upload multipart) thành API error envelope tiếng Việt.
 *
 * FileInterceptor reject TRƯỚC khi handler chạy, nên validation INVALID_INPUT trong controller bị bỏ
 * qua; nếu không xử lý, MulterError rơi xuống ApiErrorFilter và bị serialize thành 500 INTERNAL_ERROR
 * với message tiếng Anh thô ('File too large') — khiến input sai của người dùng trông như lỗi máy chủ
 * (review PR #28). Filter này KẾ THỪA ApiErrorFilter (review PR #31: dùng super.catch thay vì khởi tạo
 * instance thủ công — đúng pattern Nest, an toàn nếu ApiErrorFilter có DI sau này): map MulterError →
 * 400 INVALID_INPUT (tiếng Việt); mọi lỗi khác ủy quyền super.catch để KHÔNG nhân đôi logic envelope.
 */
@Catch()
export class MulterExceptionFilter extends ApiErrorFilter {
  override catch(exception: unknown, host: ArgumentsHost): void {
    if (isMulterError(exception)) {
      const message =
        exception.code === 'LIMIT_FILE_SIZE'
          ? 'Ảnh vượt quá dung lượng cho phép (tối đa 4MB).'
          : 'Tệp tải lên không hợp lệ.';
      super.catch(new ApiErrorHttpException(HttpStatus.BAD_REQUEST, 'INVALID_INPUT', message), host);
      return;
    }
    super.catch(exception, host);
  }
}
