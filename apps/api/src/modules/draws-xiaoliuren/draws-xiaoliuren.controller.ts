import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import {
  xiaoLiuRenDrawRequestSchema,
  type AuthenticatedUser,
} from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { DrawsXiaoLiuRenService } from './draws-xiaoliuren.service';

@Controller('draws/xiaoliuren')
export class DrawsXiaoLiuRenController {
  constructor(private readonly service: DrawsXiaoLiuRenService) {}

  @Post()
  @HttpCode(200)
  async draw(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    const input = xiaoLiuRenDrawRequestSchema.safeParse(body);
    if (!input.success) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        input.error.issues[0]?.message ?? 'Dữ liệu yêu cầu không hợp lệ.',
        request.requestId ?? null,
      );
    }

    return this.service.drawXiaoLiuRen(
      currentUser,
      request.ip ?? 'unknown',
      input.data,
    );
  }
}
