import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { stickDrawSchema } from '@ziweiai/contracts';
import { z } from 'zod';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import type { AuthenticatedUser } from '@ziweiai/contracts';
import { DrawsSticksService } from './draws-sticks.service';

const stickDrawRequestSchema = stickDrawSchema
  .pick({ question: true, seed: true })
  .extend({ question: z.string().trim().min(1) });

@Controller('draws/stick')
export class DrawsSticksController {
  constructor(private readonly service: DrawsSticksService) {}

  @Post()
  @HttpCode(200)
  async draw(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    const input = stickDrawRequestSchema.safeParse(body);
    if (!input.success) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        input.error.issues[0]?.message ?? 'Dữ liệu yêu cầu không hợp lệ.',
        request.requestId ?? null,
      );
    }

    return this.service.drawStick(
      currentUser,
      request.ip ?? 'unknown',
      input.data.question,
      input.data.seed,
    );
  }
}
