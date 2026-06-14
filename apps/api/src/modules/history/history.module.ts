import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { HistoryController } from './history.controller';
import { HistoryService } from './services/history.service';

@Module({
  imports: [DatabaseModule],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}
