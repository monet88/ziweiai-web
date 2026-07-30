import { Module } from '@nestjs/common';
import { SUPABASE_CLIENT, createSupabaseServiceRoleClient } from './supabase-client';
import { ProfilesRepository } from './repositories/profiles.repository';
import { ChartsRepository } from './repositories/charts.repository';
import { DivinationsRepository } from './repositories/divinations.repository';
import { ExplanationsRepository } from './repositories/explanations.repository';
import { HistoryRepository } from './repositories/history.repository';
import { VisionRepository } from './repositories/vision.repository';
import { ConversationsRepository } from './repositories/conversations.repository';
import { AnnualReportsRepository } from './repositories/annual-reports.repository';
import { AdminRepository } from './repositories/admin.repository';

const repositories = [
  ProfilesRepository,
  ChartsRepository,
  DivinationsRepository,
  ExplanationsRepository,
  HistoryRepository,
  VisionRepository,
  ConversationsRepository,
  AnnualReportsRepository,
  AdminRepository,
];

@Module({
  providers: [
    { provide: SUPABASE_CLIENT, useFactory: createSupabaseServiceRoleClient },
    ...repositories,
  ],
  exports: [...repositories, SUPABASE_CLIENT],
})
export class DatabaseModule {}
