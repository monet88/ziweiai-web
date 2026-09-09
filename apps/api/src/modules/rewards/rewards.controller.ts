import { Controller, Post, Get, UseGuards, Req, Body, BadRequestException } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { TurnstileService } from '../../common/turnstile/turnstile.service';

@Controller('rewards')
@UseGuards(SupabaseAuthGuard)
export class RewardsController {
  constructor(
    private readonly rewardsService: RewardsService,
    private readonly turnstileService: TurnstileService,
  ) {}

  @Post('checkin')
  async checkin(
    @Req() req: AuthenticatedRequest,
    @Body() body?: { referralCode?: string; turnstileToken?: string },
  ) {
    const userId = req.authenticatedUser?.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    const clientIp =
      (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress;

    const turnstileResult = await this.turnstileService.verifyToken(
      body?.turnstileToken,
      clientIp,
    );
    if (!turnstileResult.success) {
      throw new BadRequestException(
        'Xác thực chống bot không thành công (Turnstile verification failed).',
      );
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

