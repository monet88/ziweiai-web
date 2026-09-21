import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { DrawsChuVanVuongController } from './draws-chuvanvuong.controller';
import { DrawsChuVanVuongService } from './draws-chuvanvuong.service';

@Module({
  imports: [DatabaseModule, AiProvidersModule],
  controllers: [DrawsChuVanVuongController],
  providers: [DrawsChuVanVuongService],
  exports: [DrawsChuVanVuongService],
})
export class DrawsChuVanVuongModule {}
