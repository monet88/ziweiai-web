import { Controller, Post, Get, UseGuards, Req, Body, BadRequestException } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';

@Controller('rewards')
@UseGuards(SupabaseAuthGuard)
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post('checkin')
  async checkin(@Req() req: AuthenticatedRequest, @Body() body?: { referralCode?: string }) {
    const userId = req.authenticatedUser?.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    const result = await this.rewardsService.dailyCheckin(userId, body?.referralCode);
    return result;
  }

  @Post('ad-reward')
  async claimAdReward(@Req() req: AuthenticatedRequest) {
    const userId = req.authenticatedUser?.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    return this.rewardsService.claimAdReward(userId);
  }

  @Get('referrals')
  async getReferrals(@Req() req: AuthenticatedRequest) {
    const userId = req.authenticatedUser?.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    return this.rewardsService.getReferralHistory(userId);
  }
}

