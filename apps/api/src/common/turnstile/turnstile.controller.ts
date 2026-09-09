import { Controller, Post, Body, Req, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../modules/auth/decorators/public.decorator';
import { TurnstileService } from './turnstile.service';
import { TurnstileVerifyRequestSchema } from '@ziweiai/contracts';

@Controller('auth/turnstile')
export class TurnstileController {
  constructor(private readonly turnstileService: TurnstileService) {}

  @Public()
  @Post('verify')
  async verify(@Req() req: Request, @Body() body: unknown) {
    const parseResult = TurnstileVerifyRequestSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException('Dữ liệu xác thực Turnstile không hợp lệ.');
    }

    const clientIp =
      (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress ||
      parseResult.data.remoteIp;

    const result = await this.turnstileService.verifyToken(
      parseResult.data.token,
      clientIp,
    );
    if (!result.success) {
      throw new BadRequestException('Xác thực Turnstile chống bot thất bại.');
    }

    return {
      success: true,
      challengeTs: result.challengeTs,
      hostname: result.hostname,
    };
  }
}
