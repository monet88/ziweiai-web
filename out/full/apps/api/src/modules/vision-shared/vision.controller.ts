import { Controller, Delete, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { type AuthenticatedUser } from '@ziweiai/contracts';
import { z } from 'zod';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VisionAnalysisService } from './vision-analysis.service';

const visionResultIdSchema = z.uuid();

/**
 * DELETE /vision/results/:id (US-017 follow-up, decision 0023): quyền được quên.
 *
 * Vision lưu ảnh sinh trắc (mặt/tay) vĩnh viễn nên người dùng PHẢI tự xoá được. Endpoint
 * kind-agnostic (xoá theo vision result id, không phân biệt face/palm). Owner-scoped trong
 * service: chỉ xoá mục của chính người gọi. Trả 204 No Content khi xoá xong.
 */
@Controller('vision/results')
export class VisionController {
  constructor(private readonly service: VisionAnalysisService) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteVisionResult(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    const parsed = visionResultIdSchema.safeParse(id);
    if (!parsed.success) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        'Mã mục Xem Tướng/Xem Tay không hợp lệ.',
      );
    }

    await this.service.deleteVisionResult(currentUser, parsed.data);
  }
}
