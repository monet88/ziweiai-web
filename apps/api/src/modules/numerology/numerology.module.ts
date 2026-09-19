import { Module } from '@nestjs/common';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { NumerologyController } from './numerology.controller';
import { NumerologyService } from './numerology.service';

@Module({
  imports: [
    AiProvidersModule,
  ],
  controllers: [NumerologyController],
  providers: [NumerologyService],
})
export class NumerologyModule {}
