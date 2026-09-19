import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { JournalService } from './journal.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import {
  createJournalEntryRequestSchema,
  type CreateJournalEntryRequest,
} from '@ziweiai/contracts';

@Controller('journal')
@UseGuards(SupabaseAuthGuard)
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Get('entries')
  async getEntries(
    @Req() req: AuthenticatedRequest,
    @Query('month') month?: string,
  ) {
    const userId = req.authenticatedUser?.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }
    return this.journalService.getEntries(userId, month);
  }

  @Post('entries')
  async saveEntry(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateJournalEntryRequest,
  ) {
    const userId = req.authenticatedUser?.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    const parsed = createJournalEntryRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message || 'Dữ liệu nhật ký không hợp lệ');
    }

    return this.journalService.saveEntry(userId, parsed.data);
  }

  @Get('stats')
  async getStats(@Req() req: AuthenticatedRequest) {
    const userId = req.authenticatedUser?.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }
    const data = await this.journalService.getEntries(userId);
    return {
      currentStreakDays: data.currentStreakDays,
      averageResonanceScore: data.averageResonanceScore,
      totalEntriesCount: data.totalEntriesCount,
    };
  }
}
