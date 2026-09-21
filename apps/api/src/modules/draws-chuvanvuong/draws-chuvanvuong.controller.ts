import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import {
  chuVanVuongDrawRequestSchema,
  type AuthenticatedUser,
} from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { DrawsChuVanVuongService } from './draws-chuvanvuong.service';

@Controller('draws/chuvanvuong')
export class DrawsChuVanVuongController {
  constructor(private readonly service: DrawsChuVanVuongService) {}

  @Post()
  @HttpCode(200)
  async draw(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    const input = chuVanVuongDrawRequestSchema.safeParse(body);
    if (!input.success) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        input.error.issues[0]?.message ?? 'Dữ liệu yêu cầu không hợp lệ.',
        request.requestId ?? null,
      );
    }

    return this.service.drawChuVanVuong(
      currentUser,
      request.ip ?? 'unknown',
      input.data,
    );
  }
}
