import { Module } from '@nestjs/common';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { QuotasModule } from '../quotas/quotas.module';
import { AlmanacController } from './almanac.controller';
import { AlmanacService } from './almanac.service';

@Module({
  imports: [QuotasModule, AiProvidersModule],
  controllers: [AlmanacController],
  providers: [AlmanacService],
})
export class AlmanacModule {}
