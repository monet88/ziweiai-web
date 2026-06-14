import { Module } from '@nestjs/common';
import { SupabasePersistenceGateway } from './supabase-persistence.gateway';

@Module({
  providers: [SupabasePersistenceGateway],
  exports: [SupabasePersistenceGateway],
})
export class DatabaseModule {}
