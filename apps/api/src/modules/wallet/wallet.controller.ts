import { Controller, Get, Req, BadRequestException } from '@nestjs/common';
import { WalletEngineService } from './wallet-engine.service';
import { TransactionListResponse } from '@ziweiai/contracts';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletEngineService: WalletEngineService) {}

  @Get('transactions')
  async getUserTransactions(@Req() req: any): Promise<TransactionListResponse> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is missing');
    }

    const { data, total } = await this.walletEngineService.getUserTransactions(userId);
    return { data, total };
  }
}
