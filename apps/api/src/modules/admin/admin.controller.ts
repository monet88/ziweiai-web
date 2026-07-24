import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { reconcileTransactionSchema } from '@ziweiai/contracts';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('transactions')
  async getTransactions() {
    return this.adminService.getRecentTransactions();
  }

  @Post('reconcile')
  async reconcile(@Body() body: unknown) {
    const parseResult = reconcileTransactionSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException('Invalid payload schema');
    }

    return this.adminService.reconcileTransaction(
      parseResult.data.transactionId,
      parseResult.data.targetUserId,
    );
  }
}
