import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { WalletModule } from '../wallet/wallet.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [DatabaseModule, WalletModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
