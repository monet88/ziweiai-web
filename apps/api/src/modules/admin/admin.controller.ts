import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const topupSchema = z.object({
  amount: z.number().int(),
});

@Controller('admin')
@UseGuards(SuperAdminGuard)
export class AdminController {
  constructor(private readonly persistenceGateway: SupabasePersistenceGateway) {}

  @Get('users')
  async listUsers() {
    const users = await this.persistenceGateway.adminListUsers();
    return { users };
  }

  @Get('transactions')
  async listTransactions() {
    const transactions = await this.persistenceGateway.adminListTransactions();
    return { transactions };
  }

  @Get('analytics')
  async getAnalytics() {
    const analytics = await this.persistenceGateway.adminGetAnalytics();
    return { analytics };
  }

  @Post('users/:userId/xu')
  async topupXU(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(topupSchema, 'Dữ liệu không hợp lệ')) body: { amount: number },
  ) {
    const actorEmail = req.user?.email;
    const success = await this.persistenceGateway.adminTopupXU(userId, body.amount, actorEmail);
    return { success, amount: body.amount };
  }

  @Post('users/:userId/ban')
  async banUser(@Param('userId') userId: string) {
    const success = await this.persistenceGateway.adminBanUser(userId, true);
    return { success };
  }

  @Post('users/:userId/unban')
  async unbanUser(@Param('userId') userId: string) {
    const success = await this.persistenceGateway.adminBanUser(userId, false);
    return { success };
  }
}
