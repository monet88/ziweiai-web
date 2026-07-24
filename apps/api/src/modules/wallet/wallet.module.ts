import { Module } from '@nestjs/common';
import { WalletEngineService } from './wallet-engine.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [WalletEngineService],
  exports: [WalletEngineService],
})
export class WalletModule {}
