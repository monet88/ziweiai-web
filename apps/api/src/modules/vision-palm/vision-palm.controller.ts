import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
  UseFilters,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { AuthenticatedUser } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { SUPPORTED_VISION_MIME_TYPES } from '../../providers/ai/vision-prompt';
import { VisionAnalysisService } from '../vision-shared/vision-analysis.service';
import { MulterExceptionFilter } from '../vision-shared/multer-error.filter';

// Giới hạn kích thước ảnh (decision 0012: 1 ảnh ≤ 4MB). multer reject sớm khi vượt (LIMIT_FILE_SIZE).
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

// Hình dạng tối thiểu của file upload (multer memoryStorage). Khai báo cục bộ để KHÔNG phụ thuộc
// @types/multer (không có trong workspace) — chỉ cần các field thật sự dùng.
interface UploadedImageFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

/**
 * POST /vision/palm (US-017f): luận giải Xem Tay từ ảnh lòng bàn tay.
 *
 * Cùng khuôn vision-face: multipart/form-data field `image` (1 ảnh ≤ 4MB) + `question` (tuỳ chọn).
 * Controller chỉ validate đầu vào (INVALID_INPUT) rồi uỷ quyền VisionAnalysisService với kind='palm'
 * (gate + upload + vision LLM dùng chung). multer memoryStorage → file.buffer in-memory (không ghi đĩa).
 */
@Controller('vision/palm')
export class VisionPalmController {
  constructor(private readonly service: VisionAnalysisService) {}

  @Post()
  @HttpCode(200)
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_BYTES } }))
  async analyze(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: UploadedImageFile | undefined,
    @Body('question') question: unknown,
  ) {
    if (!file) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        'Vui lòng tải lên một tấm ảnh lòng bàn tay.',
        request.requestId ?? null,
      );
    }

    const mimeType = file.mimetype.trim().toLowerCase();
    if (!SUPPORTED_VISION_MIME_TYPES.has(mimeType)) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        'Định dạng ảnh không được hỗ trợ. Chỉ chấp nhận JPEG, PNG hoặc WebP.',
        request.requestId ?? null,
      );
    }

    return this.service.analyze({
      kind: 'palm',
      user: currentUser,
      ipAddress: request.ip ?? 'unknown',
      imageBytes: file.buffer,
      mimeType,
      question: typeof question === 'string' ? question : undefined,
    });
  }
}
