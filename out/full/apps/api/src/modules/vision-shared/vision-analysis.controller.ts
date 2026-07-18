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
import type { AuthenticatedUser, VisionKind } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { SUPPORTED_VISION_MIME_TYPES } from '../../providers/ai/vision-prompt';
import { VisionAnalysisService } from './vision-analysis.service';
import { MulterExceptionFilter } from './multer-error.filter';

// Giới hạn kích thước ảnh (decision 0012: 1 ảnh ≤ 4MB). multer reject sớm khi vượt (LIMIT_FILE_SIZE).
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

// Hình dạng tối thiểu của file upload (multer memoryStorage). Khai báo cục bộ để KHÔNG phụ thuộc
// @types/multer (không có trong workspace) — chỉ cần các field thật sự dùng.
interface UploadedImageFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

// Mỗi loại vision chỉ khác nhau ở câu nhắc upload thiếu ảnh; phần còn lại (gate + upload + vision
// LLM) dùng chung qua VisionAnalysisService với kind tương ứng.
const MISSING_IMAGE_MESSAGE: Record<VisionKind, string> = {
  face: 'Vui lòng tải lên một tấm ảnh chân dung.',
  palm: 'Vui lòng tải lên một tấm ảnh lòng bàn tay.',
};

/**
 * POST /vision/face (US-017e) + POST /vision/palm (US-017f): luận giải Xem Tướng / Xem Tay từ ảnh.
 *
 * Hai route cùng một khuôn multipart/form-data: field `image` (1 ảnh ≤ 4MB) + `question` (tuỳ chọn).
 * Controller chỉ validate đầu vào (INVALID_INPUT) rồi uỷ quyền VisionAnalysisService (gate + upload +
 * vision LLM dùng chung) với kind tương ứng. multer memoryStorage → file.buffer in-memory (không ghi đĩa);
 * ảnh chỉ lưu Storage qua gateway.
 */
@Controller('vision')
export class VisionAnalysisController {
  constructor(private readonly service: VisionAnalysisService) {}

  @Post('face')
  @HttpCode(200)
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_BYTES } }))
  async analyzeFace(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: UploadedImageFile | undefined,
    @Body('question') question: unknown,
  ) {
    return this.analyze('face', currentUser, request, file, question);
  }

  @Post('palm')
  @HttpCode(200)
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_BYTES } }))
  async analyzePalm(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: UploadedImageFile | undefined,
    @Body('question') question: unknown,
  ) {
    return this.analyze('palm', currentUser, request, file, question);
  }

  private analyze(
    kind: VisionKind,
    currentUser: AuthenticatedUser,
    request: AuthenticatedRequest,
    file: UploadedImageFile | undefined,
    question: unknown,
  ) {
    if (!file) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        MISSING_IMAGE_MESSAGE[kind],
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
      kind,
      user: currentUser,
      ipAddress: request.ip ?? 'unknown',
      imageBytes: file.buffer,
      mimeType,
      question: typeof question === 'string' ? question : undefined,
    });
  }
}
