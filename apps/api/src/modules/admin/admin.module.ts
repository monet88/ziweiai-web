import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AdminController],
})
export class AdminModule {}
