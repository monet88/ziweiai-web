import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DatabaseModule } from '../../database/database.module';
import { WalletModule } from '../wallet/wallet.module';
import { ModeratorGuard } from '../../common/guards/moderator.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';

@Module({
  imports: [DatabaseModule, WalletModule],
  controllers: [AdminController],
  providers: [AdminService, ModeratorGuard, SuperAdminGuard],
  exports: [AdminService],
})
export class AdminModule {}
