import { Body, Controller, Post, Req, UseInterceptors } from '@nestjs/common';
import {
  createDivinationRequestSchema,
  divinationChatRequestSchema,
  compatibilityExplainRequestSchema,
  type AuthenticatedUser,
  type CreateDivinationResponse,
  type DivinationChatResponse,
  type CompatibilityExplainResponse,
} from '@ziweiai/contracts';
import { z } from 'zod';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { DivinationsService } from './services/divinations.service';
import { DivinationChatService } from './services/divination-chat.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RequireXU } from '../../common/interceptors/billing.interceptor';

@Controller('divinations')
export class DivinationsController {
  constructor(
    private readonly divinationsService: DivinationsService,
    private readonly divinationChatService: DivinationChatService,
  ) {}

  @Post()
  async createDivination(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createDivinationRequestSchema)) input: z.infer<typeof createDivinationRequestSchema>,
  ): Promise<CreateDivinationResponse> {
    // email === null ⟺ phiên ẩn danh (decision 0009): quota daily-per-IP cho đường anon.
    return this.divinationsService.createDivination(
      currentUser.userId,
      request.ip ?? 'unknown',
      input,
      currentUser.email === null,
    );
  }

  @Post('chat')
  @UseInterceptors(RequireXU(1))
  async chat(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(divinationChatRequestSchema)) input: z.infer<typeof divinationChatRequestSchema>,
  ): Promise<DivinationChatResponse> {
    return this.divinationChatService.chat(
      currentUser,
      request.ip ?? 'unknown',
      input,
    );
  }

  @Post('compatibility/explain')
  @UseInterceptors(RequireXU(15))
  async explainCompatibility(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(compatibilityExplainRequestSchema)) input: z.infer<typeof compatibilityExplainRequestSchema>,
  ): Promise<CompatibilityExplainResponse> {
    return this.divinationChatService.explainCompatibility(
      currentUser,
      request.ip ?? 'unknown',
      input,
    );
  }
}
