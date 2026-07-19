import { Module } from '@nestjs/common';
import { ShareController } from './share.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ShareController],
})
export class ShareModule {}
