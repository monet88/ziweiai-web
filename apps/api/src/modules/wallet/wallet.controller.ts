import { Controller, Get, Req, BadRequestException } from '@nestjs/common';
import { WalletEngineService } from './wallet-engine.service';
import { TransactionListResponse, type AuthenticatedUser } from '@ziweiai/contracts';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletEngineService: WalletEngineService) {}

  @Get('transactions')
  async getUserTransactions(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: AuthenticatedRequest,
  ): Promise<TransactionListResponse> {
    const userId = currentUser?.userId || req.authenticatedUser?.userId;
    if (!userId) {
      throw new BadRequestException('User ID is missing');
    }

    const { data, total } = await this.walletEngineService.getUserTransactions(userId);
    return { data, total };
  }
}
