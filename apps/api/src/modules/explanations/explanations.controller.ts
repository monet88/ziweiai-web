import { Body, Controller, Post, Req } from '@nestjs/common';
import { createExplanationRequestSchema, type AuthenticatedUser } from '@ziweiai/contracts';
import { z } from 'zod';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { ExplanationsService } from './services/explanations.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('explanations')
export class ExplanationsController {
  constructor(private readonly explanationsService: ExplanationsService) {}

  @Post()
  async createExplanation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createExplanationRequestSchema)) input: z.infer<typeof createExplanationRequestSchema>,
  ) {
    return this.explanationsService.createExplanation(currentUser, request.ip ?? 'unknown', input);
  }
}
