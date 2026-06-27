import { Module } from '@nestjs/common';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { QuotasModule } from '../quotas/quotas.module';
import { DrawsLenormandController } from './draws-lenormand.controller';
import { DrawsLenormandService } from './draws-lenormand.service';

@Module({
  imports: [QuotasModule, AiProvidersModule],
  controllers: [DrawsLenormandController],
  providers: [DrawsLenormandService],
})
export class DrawsLenormandModule {}
