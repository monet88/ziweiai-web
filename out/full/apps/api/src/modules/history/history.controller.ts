import { Controller, Get, Query } from '@nestjs/common';
import { type AuthenticatedUser } from '@ziweiai/contracts';
import { z } from 'zod';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HistoryService } from './services/history.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async listHistory(@CurrentUser() currentUser: AuthenticatedUser, @Query('limit') limit: string | undefined) {
    const parsedLimit = z.coerce.number().int().min(1).max(50).default(20).parse(limit ?? '20');
    return this.historyService.listHistory(currentUser.userId, parsedLimit);
  }
}
