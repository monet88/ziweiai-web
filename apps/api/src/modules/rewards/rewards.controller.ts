import { Controller, Post, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';

@Controller('rewards')
@UseGuards(SupabaseAuthGuard)
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post('checkin')
  async checkin(@Req() req: AuthenticatedRequest) {
    const userId = req.authenticatedUser?.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    const result = await this.rewardsService.dailyCheckin(userId);
    return result;
  }
}
