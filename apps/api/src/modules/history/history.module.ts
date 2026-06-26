import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { VisionSharedModule } from '../vision-shared/vision-shared.module';
import { HistoryController } from './history.controller';
import { HistoryService } from './services/history.service';

@Module({
  imports: [DatabaseModule, VisionSharedModule],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}
