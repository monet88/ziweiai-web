import { Module } from '@nestjs/common';
import { TurnstileService } from './turnstile.service';
import { TurnstileController } from './turnstile.controller';

@Module({
  controllers: [TurnstileController],
  providers: [TurnstileService],
  exports: [TurnstileService],
})
export class TurnstileModule {}
