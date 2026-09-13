import { Controller, Post, Get, UseGuards, Req, Body, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { RewardsService } from './rewards.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { TurnstileService } from '../../common/turnstile/turnstile.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('rewards')
@UseGuards(SupabaseAuthGuard)
export class RewardsController {
  constructor(
    private readonly rewardsService: RewardsService,
    private readonly turnstileService: TurnstileService,
  ) {}

  /**
   * Google AdMob Server-Side Verification (SSV) Callback
   * Endpoint tiếp nhận request GET trực tiếp từ máy chủ Google AdMob
   */
  @Public()
  @Get('admob-ssv')
  async handleAdMobSsv(@Req() req: Request) {
    const rawUrl = req.originalUrl || req.url || '';
    const rawQuery = rawUrl.includes('?') ? rawUrl.split('?')[1] : '';
    const queryParams = (req.query || {}) as Record<string, any>;
    return this.rewardsService.handleAdMobSsv(rawQuery, queryParams);
  }

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

    // Nếu client gửi turnstileToken, tiến hành xác thực chống bot qua Cloudflare.
    // Trường hợp người dùng di động/trình duyệt bảo mật bị chặn Turnstile (token rỗng),
    // vì request đã qua SupabaseAuthGuard (JWT hợp lệ) và RPC daily_checkin có khóa dòng ACID
    // bảo đảm 1 tài khoản chỉ được nhận duy nhất 1 lần/ngày, hệ thống vẫn cho phép người dùng thật điểm danh.
    if (body?.turnstileToken && body.turnstileToken.trim().length > 0) {
      const turnstileResult = await this.turnstileService.verifyToken(
        body.turnstileToken,
        clientIp,
      );
      if (!turnstileResult.success && !turnstileResult.isBypassed) {
        throw new BadRequestException(
          'Xác thực chống bot không thành công (Turnstile verification failed).',
        );
      }
    }

    const result = await this.rewardsService.dailyCheckin(userId, body?.referralCode);
    return result;
  }

  @Post('welcome-bonus')
  async claimWelcomeBonus(
    @Req() req: AuthenticatedRequest,
    @Body() body?: { turnstileToken?: string },
  ) {
    const userId = req.authenticatedUser?.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    if (!req.authenticatedUser?.email) {
      throw new BadRequestException('Tài khoản ẩn danh không đủ điều kiện nhận 15 XU tân thủ.');
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

    return this.rewardsService.claimWelcomeBonus(userId, req.authenticatedUser.email);
  }

  @Post('ad-reward')
  async claimAdReward(
    @Req() req: AuthenticatedRequest,
    @Body() body?: { adToken?: string; impressionId?: string },
  ) {
    const userId = req.authenticatedUser?.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    return this.rewardsService.claimAdReward(userId, body?.adToken, body?.impressionId);
  }

  @Get('status')
  async getStatus(@Req() req: AuthenticatedRequest) {
    const userId = req.authenticatedUser?.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    return this.rewardsService.getCheckinStatus(userId);
  }

  @Get('referrals')
  async getReferrals(@Req() req: AuthenticatedRequest) {
    const userId = req.authenticatedUser?.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    return this.rewardsService.getReferralHistory(userId);
  }

  @Get('partner-hub')
  async getPartnerHub(@Req() req: AuthenticatedRequest) {
    const userId = req.authenticatedUser?.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    const host = req.headers?.['host'] as string | undefined;
    const proto = (req.headers?.['x-forwarded-proto'] as string | undefined) || 'https';
    const origin = host ? `${proto}://${host}` : undefined;

    return this.rewardsService.getPartnerHubData(userId, origin);
  }
}

