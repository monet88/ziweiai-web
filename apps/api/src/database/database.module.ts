import { Module } from '@nestjs/common';
import { SupabasePersistenceGateway } from './supabase-persistence.gateway';
import { SUPABASE_CLIENT, createSupabaseServiceRoleClient } from './supabase-client';

@Module({
  providers: [
    { provide: SUPABASE_CLIENT, useFactory: createSupabaseServiceRoleClient },
    SupabasePersistenceGateway,
  ],
  exports: [SupabasePersistenceGateway],
})
export class DatabaseModule {}
