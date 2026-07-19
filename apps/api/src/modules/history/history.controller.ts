import { Controller, Get, Query } from '@nestjs/common';
import { type AuthenticatedUser } from '@ziweiai/contracts';
import { z } from 'zod';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HistoryService } from './services/history.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async listHistory(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('limit', new ZodValidationPipe(z.coerce.number().int().min(1).max(50).default(20), 'Giá trị limit không hợp lệ.')) parsedLimit: number,
  ) {
    return this.historyService.listHistory(currentUser.userId, parsedLimit);
  }
}
