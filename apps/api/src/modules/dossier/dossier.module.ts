import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { WalletModule } from '../wallet/wallet.module';
import { DossierController } from './dossier.controller';
import { DossierService } from './dossier.service';

@Module({
  imports: [DatabaseModule, WalletModule],
  controllers: [DossierController],
  providers: [DossierService],
  exports: [DossierService],
})
export class DossierModule {}
