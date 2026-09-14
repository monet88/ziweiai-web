---
name: services
description: "Skill for the Services area of ziweiai-web. 146 symbols across 60 files."
---

# Services

146 symbols | 60 files | Cohesion: 89%

## When to Use

- Working with code in `apps/`
- Understanding how buildVisionUserPrompt, assertCanUseAiVisionExplanation, utcDayKey work
- Modifying services-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/api/src/modules/conversations/services/conversations.service.ts` | createConversation, listConversationsForChart, getConversationDetail, assertConversationEnabled, appendMessageAndGenerate (+7) |
| `apps/api/src/modules/vision-shared/vision-analysis.service.ts` | analyze, persistVisionHistory, rollbackOrphanedVisionResult, deleteOrphanedVisionImage, deleteVisionResult (+3) |
| `apps/api/src/modules/charts/services/charts.service.ts` | getChartDetail, computeHoroscope, getAdapter, assertCanCreateChart, assertMangpaiEnabled (+1) |
| `apps/api/src/modules/fortune/services/fortune-summary.ts` | viTerm, ganZhi, primaryPalace, mutagens, renderDailyCanonicalText (+1) |
| `apps/api/src/modules/fortune/services/annual-report.service.ts` | getAnnualReport, createAnnualReport, loadZiweiSnapshot, buildExplanationContext, AnnualReportService |
| `apps/api/src/modules/draws-lenormand/lenormand-deck.ts` | getLenormandSpread, hashSeed, nextRandom, drawLenormandDeterministic |
| `apps/api/src/modules/almanac/almanac.service.ts` | select, runEngine, assertPremiumEntitlement, assertCanCreate |
| `apps/api/src/modules/fortune/services/destiny-timeline.service.ts` | viTerm, getDestinyTimeline, loadZiweiSnapshot, DestinyTimelineService |
| `apps/api/src/modules/fortune/services/fortune.service.ts` | getDailyFortune, getMonthlyFortune, loadZiweiSnapshot, FortuneService |
| `apps/api/src/modules/divinations/services/divinations.service.ts` | createDivination, buildCastNowBirthInput, pick, assertCanCreateChart |

## Entry Points

Start here when exploring this area:

- **`buildVisionUserPrompt`** (Function) — `apps/api/src/modules/vision-shared/vision-prompts.ts:76`
- **`assertCanUseAiVisionExplanation`** (Function) — `apps/api/src/modules/quotas/vision-quota.ts:7`
- **`utcDayKey`** (Function) — `apps/api/src/modules/quotas/quotas.service.ts:13`
- **`throwQuotaRateLimited`** (Function) — `apps/api/src/modules/quotas/quota-http.ts:18`
- **`drawStickDeterministic`** (Function) — `apps/api/src/modules/draws-sticks/stick-deck.ts:45`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `DailyQuotaExceededError` | Class | `apps/api/src/modules/quotas/quota-errors.ts` | 15 |
| `ApiErrorHttpException` | Class | `apps/api/src/common/http/api-error.ts` | 8 |
| `ChartsService` | Class | `apps/api/src/modules/charts/services/charts.service.ts` | 33 |
| `ConversationsService` | Class | `apps/api/src/modules/conversations/services/conversations.service.ts` | 33 |
| `FortuneService` | Class | `apps/api/src/modules/fortune/services/fortune.service.ts` | 23 |
| `DestinyTimelineService` | Class | `apps/api/src/modules/fortune/services/destiny-timeline.service.ts` | 39 |
| `AnnualReportService` | Class | `apps/api/src/modules/fortune/services/annual-report.service.ts` | 31 |
| `buildVisionUserPrompt` | Function | `apps/api/src/modules/vision-shared/vision-prompts.ts` | 76 |
| `assertCanUseAiVisionExplanation` | Function | `apps/api/src/modules/quotas/vision-quota.ts` | 7 |
| `utcDayKey` | Function | `apps/api/src/modules/quotas/quotas.service.ts` | 13 |
| `throwQuotaRateLimited` | Function | `apps/api/src/modules/quotas/quota-http.ts` | 18 |
| `drawStickDeterministic` | Function | `apps/api/src/modules/draws-sticks/stick-deck.ts` | 45 |
| `getLenormandSpread` | Function | `apps/api/src/modules/draws-lenormand/lenormand-deck.ts` | 20 |
| `drawLenormandDeterministic` | Function | `apps/api/src/modules/draws-lenormand/lenormand-deck.ts` | 54 |
| `assertEmailIdentityRequired` | Function | `apps/api/src/modules/auth/identity.guard.ts` | 29 |
| `assertChartSnapshotEligibleForAi` | Function | `apps/api/src/common/entitlement/ai-snapshot-eligibility.ts` | 3 |
| `assertAnnualReportEnabled` | Function | `apps/api/src/common/entitlement/ai-entitlement.guard.ts` | 10 |
| `buildFailedExplanationRetentionTimestamp` | Function | `apps/api/src/database/persistence-lifecycle.ts` | 6 |
| `shouldStorePrompt` | Function | `apps/api/src/database/persistence-lifecycle.ts` | 10 |
| `buildExplanationRequestIdempotencyKey` | Function | `apps/api/src/database/idempotency.ts` | 33 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateChart → IsLegacyQuotaMessage` | cross_community | 4 |
| `CreateChart → ApiErrorHttpException` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Ai | 10 calls |
| Jobs | 3 calls |
| Cluster_20 | 1 calls |
| Dreams | 1 calls |
| Almanac | 1 calls |
| Adapters | 1 calls |

## How to Explore

1. `gitnexus_context({name: "buildVisionUserPrompt"})` — see callers and callees
2. `gitnexus_query({query: "services"})` — find related execution flows
3. Read key files listed above for implementation details
