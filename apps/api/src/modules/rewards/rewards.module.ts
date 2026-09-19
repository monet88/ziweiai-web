import { Module } from '@nestjs/common';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { WalletModule } from '../wallet/wallet.module';

import { TurnstileModule } from '../../common/turnstile/turnstile.module';

import { AdMobVerifierService } from './admob-verifier.service';

@Module({
  imports: [DatabaseModule, AuthModule, WalletModule, TurnstileModule],
  controllers: [RewardsController],
  providers: [RewardsService, AdMobVerifierService],
  exports: [RewardsService, AdMobVerifierService],
})
export class RewardsModule {}

