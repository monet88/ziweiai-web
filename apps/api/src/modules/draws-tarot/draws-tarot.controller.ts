import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { tarotDrawSchema } from '@ziweiai/contracts';
import { z } from 'zod';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import type { AuthenticatedUser } from '@ziweiai/contracts';
import { DrawsTarotService } from './draws-tarot.service';

const tarotDrawRequestSchema = tarotDrawSchema
  .pick({ question: true, spread: true, seed: true })
  .extend({ question: z.string().trim().min(1) });

@Controller('draws/tarot')
export class DrawsTarotController {
  constructor(private readonly service: DrawsTarotService) {}

  @Post()
  @HttpCode(200)
  async draw(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    const input = tarotDrawRequestSchema.safeParse(body);
    if (!input.success) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        input.error.issues[0]?.message ?? 'Dữ liệu yêu cầu không hợp lệ.',
        request.requestId ?? null,
      );
    }

    return this.service.drawTarot(
      currentUser,
      request.ip ?? 'unknown',
      input.data.question,
      input.data.spread,
      input.data.seed,
    );
  }
}
