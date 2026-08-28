import { Module } from '@nestjs/common';
import { WalletEngineService } from './wallet-engine.service';
import { WalletController } from './wallet.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [WalletController],
  providers: [WalletEngineService],
  exports: [WalletEngineService],
})
export class WalletModule {}
