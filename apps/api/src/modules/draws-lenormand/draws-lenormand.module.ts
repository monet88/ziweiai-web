import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { QuotasModule } from '../quotas/quotas.module';
import { DrawsLenormandController } from './draws-lenormand.controller';
import { DrawsLenormandService } from './draws-lenormand.service';

@Module({
  imports: [DatabaseModule, QuotasModule, AiProvidersModule],
  controllers: [DrawsLenormandController],
  providers: [DrawsLenormandService],
})
export class DrawsLenormandModule {}
