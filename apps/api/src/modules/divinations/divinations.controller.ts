import { Body, Controller, Post, Req } from '@nestjs/common';
import {
  createDivinationRequestSchema,
  type AuthenticatedUser,
  type CreateDivinationResponse,
} from '@ziweiai/contracts';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { DivinationsService } from './services/divinations.service';

@Controller('divinations')
export class DivinationsController {
  constructor(private readonly divinationsService: DivinationsService) {}

  @Post()
  async createDivination(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ): Promise<CreateDivinationResponse> {
    const input = createDivinationRequestSchema.parse(body);
    // email === null ⟺ phiên ẩn danh (decision 0009): quota daily-per-IP cho đường anon.
    return this.divinationsService.createDivination(
      currentUser.userId,
      request.ip ?? 'unknown',
      input,
      currentUser.email === null,
    );
  }
}
