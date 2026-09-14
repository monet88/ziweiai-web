---
name: repositories
description: "Skill for the Repositories area of ziweiai-web. 76 symbols across 13 files."
---

# Repositories

76 symbols | 13 files | Cohesion: 68%

## When to Use

- Working with code in `apps/`
- Understanding how normalizePostgresTimestamp, toProfileRecord, toBirthProfileRecord work
- Modifying repositories-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/api/src/database/persistence-mappers.ts` | toProfileRecord, toBirthProfileRecord, toHistoryViewRecord, toVisionResultRecord, toReferralRecord (+8) |
| `apps/api/src/database/repositories/explanations.repository.ts` | countExplanationRequestsSince, ExplanationsRepository, findExplanationResultByRequestId, listExplanationResultsForChart, findLatestExplanationResultForChart (+8) |
| `apps/api/src/database/repositories/admin.repository.ts` | adminListUsers, adminListTransactions, adminGetAnalytics, adminGetAuditLogs, getSystemConfigs (+5) |
| `apps/api/src/database/repositories/charts.repository.ts` | findLatestBirthProfileByInputHash, createBirthProfile, countChartSnapshotsSince, ChartsRepository, findChartSnapshotByDedupeKey (+3) |
| `apps/api/src/database/repositories/annual-reports.repository.ts` | AnnualReportsRepository, findAnnualReportByChartAndYear, findLatestAnnualReportByChartId, findLatestAnnualReportsForCharts, createAnnualReport (+1) |
| `apps/api/src/database/repositories/vision.repository.ts` | createVisionResult, findVisionResultsByIds, findVisionResultById, deleteVisionResult, VisionRepository |
| `apps/api/src/database/repositories/profiles.repository.ts` | findProfileByUserId, listReferralsByReferrerId, updateFcmToken, listActiveFcmTokens, ProfilesRepository |
| `apps/api/src/database/repositories/conversations.repository.ts` | countConversationUserMessagesSince, ConversationsRepository, createConversation, listConversationsForChart, findConversationById |
| `apps/api/src/database/repositories/divinations.repository.ts` | DivinationsRepository, createDivinationContext, findDivinationContextBySnapshotId, findDivinationContextsByChartIds |
| `apps/api/src/database/repositories/history.repository.ts` | createHistoryView, listHistoryViews, HistoryRepository |

## Entry Points

Start here when exploring this area:

- **`normalizePostgresTimestamp`** (Function) — `apps/api/src/database/postgres-timestamp.ts:0`
- **`toProfileRecord`** (Function) — `apps/api/src/database/persistence-mappers.ts:52`
- **`toBirthProfileRecord`** (Function) — `apps/api/src/database/persistence-mappers.ts:64`
- **`toHistoryViewRecord`** (Function) — `apps/api/src/database/persistence-mappers.ts:132`
- **`toVisionResultRecord`** (Function) — `apps/api/src/database/persistence-mappers.ts:143`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `VisionRepository` | Class | `apps/api/src/database/repositories/vision.repository.ts` | 6 |
| `SupabaseBaseRepository` | Class | `apps/api/src/database/repositories/supabase-base.repository.ts` | 4 |
| `ProfilesRepository` | Class | `apps/api/src/database/repositories/profiles.repository.ts` | 6 |
| `HistoryRepository` | Class | `apps/api/src/database/repositories/history.repository.ts` | 6 |
| `ExplanationsRepository` | Class | `apps/api/src/database/repositories/explanations.repository.ts` | 6 |
| `DivinationsRepository` | Class | `apps/api/src/database/repositories/divinations.repository.ts` | 6 |
| `ConversationsRepository` | Class | `apps/api/src/database/repositories/conversations.repository.ts` | 8 |
| `ChartsRepository` | Class | `apps/api/src/database/repositories/charts.repository.ts` | 6 |
| `AnnualReportsRepository` | Class | `apps/api/src/database/repositories/annual-reports.repository.ts` | 6 |
| `AdminRepository` | Class | `apps/api/src/database/repositories/admin.repository.ts` | 4 |
| `normalizePostgresTimestamp` | Function | `apps/api/src/database/postgres-timestamp.ts` | 0 |
| `toProfileRecord` | Function | `apps/api/src/database/persistence-mappers.ts` | 52 |
| `toBirthProfileRecord` | Function | `apps/api/src/database/persistence-mappers.ts` | 64 |
| `toHistoryViewRecord` | Function | `apps/api/src/database/persistence-mappers.ts` | 132 |
| `toVisionResultRecord` | Function | `apps/api/src/database/persistence-mappers.ts` | 143 |
| `toReferralRecord` | Function | `apps/api/src/database/persistence-mappers.ts` | 187 |
| `toExplanationResultRecord` | Function | `apps/api/src/database/persistence-mappers.ts` | 119 |
| `toAnnualReportRecord` | Function | `apps/api/src/database/persistence-mappers.ts` | 219 |
| `toChartSnapshotRecord` | Function | `apps/api/src/database/persistence-mappers.ts` | 77 |
| `toExplanationRequestRecord` | Function | `apps/api/src/database/persistence-mappers.ts` | 104 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleShareRedirect → NormalizePostgresTimestamp` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Database | 2 calls |
| Jobs | 2 calls |

## How to Explore

1. `gitnexus_context({name: "normalizePostgresTimestamp"})` — see callers and callees
2. `gitnexus_query({query: "repositories"})` — find related execution flows
3. Read key files listed above for implementation details
