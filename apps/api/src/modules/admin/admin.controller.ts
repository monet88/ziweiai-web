import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const topupSchema = z.object({
  amount: z.number().int().positive(),
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

  @Post('users/:userId/xu')
  async topupXU(
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(topupSchema, 'Dữ liệu không hợp lệ')) body: { amount: number },
  ) {
    const success = await this.persistenceGateway.adminTopupXU(userId, body.amount);
    return { success, amount: body.amount };
  }
}
