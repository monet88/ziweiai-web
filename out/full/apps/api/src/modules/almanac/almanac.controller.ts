import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { almanacSelectionSchema } from '@ziweiai/contracts';
import { z } from 'zod';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import type { AuthenticatedUser } from '@ziweiai/contracts';
import { AlmanacService } from './almanac.service';

const almanacSelectRequestSchema = almanacSelectionSchema
  .pick({ topic: true, startDate: true, endDate: true })
  .extend({
    startDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  });

@Controller('almanac/select')
export class AlmanacController {
  constructor(private readonly service: AlmanacService) {}

  @Post()
  @HttpCode(200)
  async select(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    const input = almanacSelectRequestSchema.safeParse(body);
    if (!input.success) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        input.error.issues[0]?.message ?? 'Dữ liệu yêu cầu không hợp lệ.',
        request.requestId ?? null,
      );
    }

    return this.service.select(
      currentUser,
      request.ip ?? 'unknown',
      input.data.topic,
      input.data.startDate,
      input.data.endDate,
    );
  }
}
