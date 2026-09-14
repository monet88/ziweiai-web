---
name: api-client
description: "Skill for the Api-client area of ziweiai-web. 61 symbols across 27 files."
---

# Api-client

61 symbols | 27 files | Cohesion: 63%

## When to Use

- Working with code in `apps/`
- Understanding how fetchHealth, fetchFeatures, fetchHistory work
- Modifying api-client-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/lib/api-client/fetch-json.ts` | fetchJson, ApiError, mapStatusToKind, throwHttpError, parseResponseOrThrow (+4) |
| `apps/web/src/lib/api-client/admin.ts` | adminListUsers, adminTopupXU, adminListTransactions, adminBanUser, adminUnbanUser (+4) |
| `apps/web/src/lib/api-client/divinations.ts` | createMbtiQuiz, createVisionAnalysis, interpretDream, selectAlmanac, drawTarot (+4) |
| `apps/web/src/lib/api-client/conversations.ts` | createExplanation, fetchConversationsForChart, fetchConversationDetail, appendConversationMessage |
| `apps/web/src/lib/api-client/gallery.ts` | fetchGalleryShares, syncGalleryShares, deleteGalleryShare |
| `apps/web/src/lib/api-client/charts.ts` | fetchDailyFortune, fetchMonthlyFortune, createAnnualReport |
| `apps/web/src/lib/api-client/system.ts` | fetchHealth, fetchFeatures |
| `apps/web/src/lib/api-client/dossier.ts` | getDossierStatus, unlockDossier |
| `apps/web/src/lib/features/dossier/dossier-model.svelte.ts` | checkStatus, openOrUnlock |
| `apps/web/src/lib/api-client/history.ts` | fetchHistory |

## Entry Points

Start here when exploring this area:

- **`fetchHealth`** (Function) — `apps/web/src/lib/api-client/system.ts:8`
- **`fetchFeatures`** (Function) — `apps/web/src/lib/api-client/system.ts:12`
- **`fetchHistory`** (Function) — `apps/web/src/lib/api-client/history.ts:9`
- **`fetchGalleryShares`** (Function) — `apps/web/src/lib/api-client/gallery.ts:12`
- **`syncGalleryShares`** (Function) — `apps/web/src/lib/api-client/gallery.ts:20`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ApiError` | Class | `apps/web/src/lib/api-client/fetch-json.ts` | 23 |
| `fetchHealth` | Function | `apps/web/src/lib/api-client/system.ts` | 8 |
| `fetchFeatures` | Function | `apps/web/src/lib/api-client/system.ts` | 12 |
| `fetchHistory` | Function | `apps/web/src/lib/api-client/history.ts` | 9 |
| `fetchGalleryShares` | Function | `apps/web/src/lib/api-client/gallery.ts` | 12 |
| `syncGalleryShares` | Function | `apps/web/src/lib/api-client/gallery.ts` | 20 |
| `deleteGalleryShare` | Function | `apps/web/src/lib/api-client/gallery.ts` | 31 |
| `fetchJson` | Function | `apps/web/src/lib/api-client/fetch-json.ts` | 144 |
| `createExplanation` | Function | `apps/web/src/lib/api-client/conversations.ts` | 45 |
| `fetchConversationsForChart` | Function | `apps/web/src/lib/api-client/conversations.ts` | 183 |
| `fetchConversationDetail` | Function | `apps/web/src/lib/api-client/conversations.ts` | 194 |
| `appendConversationMessage` | Function | `apps/web/src/lib/api-client/conversations.ts` | 201 |
| `fetchDailyFortune` | Function | `apps/web/src/lib/api-client/charts.ts` | 56 |
| `fetchMonthlyFortune` | Function | `apps/web/src/lib/api-client/charts.ts` | 64 |
| `createAnnualReport` | Function | `apps/web/src/lib/api-client/charts.ts` | 72 |
| `adminListUsers` | Function | `apps/web/src/lib/api-client/admin.ts` | 13 |
| `adminTopupXU` | Function | `apps/web/src/lib/api-client/admin.ts` | 17 |
| `adminListTransactions` | Function | `apps/web/src/lib/api-client/admin.ts` | 25 |
| `adminBanUser` | Function | `apps/web/src/lib/api-client/admin.ts` | 37 |
| `adminUnbanUser` | Function | `apps/web/src/lib/api-client/admin.ts` | 41 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateHoroscopePanelModel → MapStatusToKind` | cross_community | 7 |
| `CreateHoroscopePanelModel → ApiError` | cross_community | 7 |
| `CreateHoroscopePanelModel → Open` | cross_community | 7 |
| `CreateHepanModel → MapStatusToKind` | cross_community | 6 |
| `CreateHepanModel → ApiError` | cross_community | 6 |
| `CreateHepanModel → Open` | cross_community | 6 |
| `Load → MapStatusToKind` | cross_community | 6 |
| `Load → ApiError` | cross_community | 6 |
| `Load → Open` | cross_community | 6 |
| `Load → MapStatusToKind` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Dossier | 2 calls |
| Jobs | 2 calls |
| Payment | 1 calls |

## How to Explore

1. `gitnexus_context({name: "fetchHealth"})` — see callers and callees
2. `gitnexus_query({query: "api-client"})` — find related execution flows
3. Read key files listed above for implementation details
