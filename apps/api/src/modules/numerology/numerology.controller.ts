import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { z } from 'zod';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import type { AuthenticatedUser } from '@ziweiai/contracts';
import { NumerologyService } from './numerology.service';

const numerologyExplainSchema = z.object({
  lifePath: z.number(),
  destiny: z.number(),
  soulUrge: z.number(),
  personality: z.number(),
  fullName: z.string().trim().min(1),
});

@Controller('numerology')
export class NumerologyController {
  constructor(private readonly service: NumerologyService) {}

  @Post('explain')
  @HttpCode(200)
  async explain(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    const input = numerologyExplainSchema.safeParse(body);
    if (!input.success) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        input.error.issues[0]?.message ?? 'Dữ liệu yêu cầu không hợp lệ.',
        request.requestId ?? null,
      );
    }

    return this.service.explainNumerology(
      currentUser,
      request.ip ?? 'unknown',
      input.data,
    );
  }
}
