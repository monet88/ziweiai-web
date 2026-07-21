import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { ModeratorGuard } from '../../common/guards/moderator.guard';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const topupSchema = z.object({
  amount: z.number().int(),
});

const configSchema = z.object({
  value: z.any(),
});

@Controller('admin')
@UseGuards(SupabaseAuthGuard)
export class AdminController {
  constructor(private readonly persistenceGateway: SupabasePersistenceGateway) {}

  @Get('users')
  @UseGuards(ModeratorGuard)
  async listUsers() {
    const users = await this.persistenceGateway.adminListUsers();
    return { users };
  }

  @Get('transactions')
  @UseGuards(ModeratorGuard)
  async listTransactions(
    @Req() req: any,
  ) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const type = req.query.type;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const result = await this.persistenceGateway.adminListTransactions(page, limit, type, startDate, endDate);
    return { transactions: result.data, count: result.count, page, limit };
  }

  @Get('analytics')
  @UseGuards(ModeratorGuard)
  async getAnalytics(@Req() req: any) {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const analytics = await this.persistenceGateway.adminGetAnalytics(startDate, endDate);
    return { analytics };
  }

  @Get('configs')
  @UseGuards(ModeratorGuard)
  async getConfigs() {
    const configs = await this.persistenceGateway.getSystemConfigs();
    return { configs };
  }

  @Get('audit-logs')
  @UseGuards(ModeratorGuard)
  async getAuditLogs(@Req() req: any) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const action = req.query.action;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const result = await this.persistenceGateway.adminGetAuditLogs(page, limit, action, startDate, endDate);
    return { logs: result.data, count: result.count, page, limit };
  }

  @Post('configs/:key')
  @UseGuards(SuperAdminGuard)
  async updateConfig(
    @Req() req: any,
    @Param('key') key: string,
    @Body(new ZodValidationPipe(configSchema, 'Dữ liệu không hợp lệ')) body: { value: any },
  ) {
    const actorEmail = req.authenticatedUser?.email;
    await this.persistenceGateway.updateSystemConfig(key, body.value, actorEmail);
    return { success: true };
  }

  @Post('users/:userId/xu')
  @UseGuards(SuperAdminGuard)
  async topupXU(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(topupSchema, 'Dữ liệu không hợp lệ')) body: { amount: number },
  ) {
    const actorEmail = req.authenticatedUser?.email;
    const success = await this.persistenceGateway.adminTopupXU(userId, body.amount, actorEmail);
    return { success, amount: body.amount };
  }

  @Post('users/:userId/ban')
  @UseGuards(SuperAdminGuard)
  async banUser(@Req() req: any, @Param('userId') userId: string) {
    const actorEmail = req.authenticatedUser?.email;
    const success = await this.persistenceGateway.adminBanUser(userId, true, actorEmail);
    return { success };
  }

  @Post('users/:userId/unban')
  @UseGuards(SuperAdminGuard)
  async unbanUser(@Req() req: any, @Param('userId') userId: string) {
    const actorEmail = req.authenticatedUser?.email;
    const success = await this.persistenceGateway.adminBanUser(userId, false, actorEmail);
    return { success };
  }
}
