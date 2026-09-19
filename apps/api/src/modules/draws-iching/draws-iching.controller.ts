import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ichingDrawSchema } from '@ziweiai/contracts';
import { z } from 'zod';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import type { AuthenticatedUser } from '@ziweiai/contracts';
import { DrawsIchingService } from './draws-iching.service';

const ichingDrawRequestSchema = ichingDrawSchema
  .pick({ question: true, cast_array: true })
  .extend({ 
    question: z.string().trim().min(1),
    cast_array: z.array(z.union([z.literal(6), z.literal(7), z.literal(8), z.literal(9)])).length(6),
  });

@Controller('draws/iching')
export class DrawsIchingController {
  constructor(private readonly service: DrawsIchingService) {}

  @Post()
  @HttpCode(200)
  async draw(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    const input = ichingDrawRequestSchema.safeParse(body);
    if (!input.success) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        input.error.issues[0]?.message ?? 'Dữ liệu yêu cầu không hợp lệ.',
        request.requestId ?? null,
      );
    }

    return this.service.drawIChing(
      currentUser,
      request.ip ?? 'unknown',
      input.data.question,
      input.data.cast_array,
    );
  }
}
