import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { pairingRequestSchema, type AuthenticatedUser, type PairingSnapshot } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { PairingsService } from './pairings.service';

@Controller('pairings')
export class PairingsController {
  constructor(private readonly service: PairingsService) {}

  @Post()
  @HttpCode(200)
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ): Promise<PairingSnapshot> {
    const input = pairingRequestSchema.safeParse(body);
    if (!input.success) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        input.error.issues[0]?.message ?? 'Dữ liệu Hợp Hôn không hợp lệ.',
        request.requestId ?? null,
      );
    }

    return this.service.createPairing(currentUser, request.ip ?? 'unknown', input.data);
  }
}
