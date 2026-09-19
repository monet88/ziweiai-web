import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { DrawsXiaoLiuRenController } from './draws-xiaoliuren.controller';
import { DrawsXiaoLiuRenService } from './draws-xiaoliuren.service';

@Module({
  imports: [DatabaseModule, AiProvidersModule],
  controllers: [DrawsXiaoLiuRenController],
  providers: [DrawsXiaoLiuRenService],
  exports: [DrawsXiaoLiuRenService],
})
export class DrawsXiaoLiuRenModule {}
