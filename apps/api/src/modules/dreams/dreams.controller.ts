import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { dreamInterpretationSchema } from '@ziweiai/contracts';
import { z } from 'zod';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import type { AuthenticatedUser } from '@ziweiai/contracts';
import { DreamsService } from './dreams.service';

const dreamInterpretRequestSchema = dreamInterpretationSchema
  .pick({ dream: true })
  .extend({ dream: z.string().trim().min(1) });

@Controller('dreams/interpret')
export class DreamsController {
  constructor(private readonly service: DreamsService) {}

  @Post()
  @HttpCode(200)
  async interpret(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    const input = dreamInterpretRequestSchema.safeParse(body);
    if (!input.success) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        input.error.issues[0]?.message ?? 'Dữ liệu yêu cầu không hợp lệ.',
        request.requestId ?? null,
      );
    }

    return this.service.interpretDream(currentUser, request.ip ?? 'unknown', input.data.dream);
  }
}
