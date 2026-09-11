import { Controller, Get, Post, Body, Param, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { reconcileTransactionSchema, updateAdminConfigSchema, type AuthenticatedUser } from '@ziweiai/contracts';
import { ModeratorGuard } from '../../common/guards/moderator.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(ModeratorGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('transactions')
  async getTransactions() {
    return this.adminService.getRecentTransactions();
  }

  @Get('users')
  async listUsers(@Query('search') search?: string) {
    return this.adminService.listUsers(search);
  }

  @Post('users/:userId/topup')
  @UseGuards(SuperAdminGuard)
  async topupUser(
    @Param('userId') userId: string,
    @Body() body: { amount: number; reason?: string },
    @CurrentUser() currentUser?: AuthenticatedUser,
  ) {
    if (typeof body?.amount !== 'number') {
      throw new BadRequestException('Amount is required and must be a number');
    }
    return this.adminService.topupUser(userId, body.amount, currentUser?.email || undefined);
  }

  @Post('users/:userId/xu')
  @UseGuards(SuperAdminGuard)
  async topupUserXu(
    @Param('userId') userId: string,
    @Body() body: { amount: number; reason?: string },
    @CurrentUser() currentUser?: AuthenticatedUser,
  ) {
    if (typeof body?.amount !== 'number') {
      throw new BadRequestException('Amount is required and must be a number');
    }
    return this.adminService.topupUser(userId, body.amount, currentUser?.email || undefined);
  }

  @Post('users/cleanup-anon')
  @UseGuards(SuperAdminGuard)
  async cleanupAnonUsers() {
    return this.adminService.cleanupAnonUsers();
  }

  @Get('referrals')
  async getReferralAnalytics() {
    return this.adminService.getReferralAnalytics();
  }

  @Get('analytics')
  async getAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getAnalytics(startDate, endDate);
  }

  @Get('configs')
  async getConfigs() {
    return this.adminService.getConfigs();
  }

  @Post('configs')
  @UseGuards(SuperAdminGuard)
  async updateConfig(@Body() body: unknown) {
    const parseResult = updateAdminConfigSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException('Invalid payload: key and value are required');
    }

    return this.adminService.updateConfig(parseResult.data.key, parseResult.data.value);
  }

  @Post('reconcile')
  @UseGuards(SuperAdminGuard)
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

  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? Math.max(1, Math.min(100, parseInt(limit, 10))) : 50;
    return this.adminService.getAuditLogs(pageNum, limitNum, action, startDate, endDate);
  }
}
