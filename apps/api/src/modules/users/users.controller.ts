import { Controller, Delete, HttpCode, UseGuards, Get, Post, Body, BadRequestException } from '@nestjs/common';
import { EmailIdentityGuard } from '../auth/identity.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type AuthenticatedUser, userFcmTokenRequestSchema, type UserFcmTokenResponse } from '@ziweiai/contracts';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(EmailIdentityGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete('me')
  @HttpCode(204)
  async deleteMe(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.usersService.deleteAccount(user.userId);
  }

  @Get('me/balance')
  async getWalletBalance(@CurrentUser() user: AuthenticatedUser): Promise<{ balance: number }> {
    const balance = await this.usersService.getWalletBalance(user.userId);
    return { balance };
  }

  @Post('me/fcm-token')
  @HttpCode(200)
  async updateFcmToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ): Promise<UserFcmTokenResponse> {
    const parseResult = userFcmTokenRequestSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException('Invalid payload: token is required');
    }

    await this.usersService.updateFcmToken(
      user.userId,
      parseResult.data.token,
      parseResult.data.platform,
    );

    return { success: true };
  }
}
