---
name: chart
description: "Skill for the Chart area of ziweiai-web. 135 symbols across 38 files."
---

# Chart

135 symbols | 38 files | Cohesion: 79%

## When to Use

- Working with code in `apps/`
- Understanding how analyzeMangpaiReading, translateBaziKey, formatBaziStemBranchLabel work
- Modifying chart-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/lib/features/chart/chart-display.ts` | formatPillarItems, formatBaziPillarDescription, formatBaziPillarRows, getQimenPalaceByIndex, buildQimenPalaceCells (+20) |
| `packages/contracts/src/chart/bazi-terms.ts` | translateBaziKey, formatBaziStemBranchLabel, lookupOrThrow, toBaziHeavenlyStemKey, toBaziEarthlyBranchKey (+3) |
| `apps/web/src/lib/features/chart/horoscope-chips.ts` | destinationPalaceName, buildMonthlyChips, buildDailyChips, parseDecadalRange, buildDecadalChips (+2) |
| `apps/web/src/lib/features/chart/horoscope-selection.svelte.ts` | createHoroscopeSelection, ensureDefault, selectDecadal, selectYearly, selectMonthly (+1) |
| `packages/contracts/src/chart/liuyao-terms.ts` | translateLiuyaoLineValueKey, translateLiuyaoLineStateKey, translateLiuyaoRoleKey, translateLiuyaoSixSpiritKey, translateLiuyaoSixKinKey (+1) |
| `packages/astro-engine/src/mangpai-reading.ts` | elementLabel, strengthRelation, assessStrength, suggestFavorable, analyzeMangpaiReading |
| `packages/contracts/src/chart/qimen-terms.ts` | translateQimenStarKey, translateQimenGateKey, translateQimenSpiritKey, translateQimenDunKey, translateQimenYuanKey |
| `apps/web/src/lib/features/chart/chart-display.test.ts` | buildSnapshotFixture, buildDaliurenSnapshot, buildQimenSnapshot, qimenStarForIndex, qimenGateForIndex |
| `apps/web/src/lib/features/chart/palace-view-builder.ts` | translateLegacyAwareKey, buildStarToken, buildPalaceView, buildPalaceViews |
| `packages/contracts/src/chart/meihua-terms.ts` | translateMeihuaTrigramKey, translateMeihuaElementKey, translateMeihuaRelationKey, formatMeihuaHexagramLabel |

## Entry Points

Start here when exploring this area:

- **`analyzeMangpaiReading`** (Function) — `packages/astro-engine/src/mangpai-reading.ts:135`
- **`translateBaziKey`** (Function) — `packages/contracts/src/chart/bazi-terms.ts:227`
- **`formatBaziStemBranchLabel`** (Function) — `packages/contracts/src/chart/bazi-terms.ts:231`
- **`buildMangpaiExplanationPrompt`** (Function) — `apps/api/src/providers/ai/build-mangpai-explanation-prompt.ts:27`
- **`buildBaziExplanationPrompt`** (Function) — `apps/api/src/providers/ai/build-bazi-explanation-prompt.ts:26`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `analyzeMangpaiReading` | Function | `packages/astro-engine/src/mangpai-reading.ts` | 135 |
| `translateBaziKey` | Function | `packages/contracts/src/chart/bazi-terms.ts` | 227 |
| `formatBaziStemBranchLabel` | Function | `packages/contracts/src/chart/bazi-terms.ts` | 231 |
| `buildMangpaiExplanationPrompt` | Function | `apps/api/src/providers/ai/build-mangpai-explanation-prompt.ts` | 27 |
| `buildBaziExplanationPrompt` | Function | `apps/api/src/providers/ai/build-bazi-explanation-prompt.ts` | 26 |
| `formatPillarItems` | Function | `apps/web/src/lib/features/chart/chart-display.ts` | 284 |
| `formatBaziPillarDescription` | Function | `apps/web/src/lib/features/chart/chart-display.ts` | 293 |
| `formatBaziPillarRows` | Function | `apps/web/src/lib/features/chart/chart-display.ts` | 308 |
| `fetchChartHoroscope` | Function | `apps/web/src/lib/api-client/charts.ts` | 43 |
| `createHoroscopeSelection` | Function | `apps/web/src/lib/features/chart/horoscope-selection.svelte.ts` | 37 |
| `ensureDefault` | Function | `apps/web/src/lib/features/chart/horoscope-selection.svelte.ts` | 44 |
| `selectDecadal` | Function | `apps/web/src/lib/features/chart/horoscope-selection.svelte.ts` | 59 |
| `selectYearly` | Function | `apps/web/src/lib/features/chart/horoscope-selection.svelte.ts` | 64 |
| `selectMonthly` | Function | `apps/web/src/lib/features/chart/horoscope-selection.svelte.ts` | 75 |
| `selectDaily` | Function | `apps/web/src/lib/features/chart/horoscope-selection.svelte.ts` | 90 |
| `formatAsOf` | Function | `apps/web/src/lib/features/chart/horoscope-query.ts` | 23 |
| `buildHoroscopeQueryOptions` | Function | `apps/web/src/lib/features/chart/horoscope-query.ts` | 47 |
| `createHoroscopeQuery` | Function | `apps/web/src/lib/features/chart/horoscope-query.ts` | 67 |
| `createHoroscopePanelModel` | Function | `apps/web/src/lib/features/chart/horoscope-panel-model.svelte.ts` | 42 |
| `buildHoroscopeOverlay` | Function | `apps/web/src/lib/features/chart/horoscope-overlay.ts` | 46 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateHoroscopePanelModel → MapStatusToKind` | cross_community | 7 |
| `CreateHoroscopePanelModel → ApiError` | cross_community | 7 |
| `CreateHoroscopePanelModel → Open` | cross_community | 7 |
| `CreateChartDetailModel → MapStatusToKind` | cross_community | 6 |
| `CreateChartDetailModel → ApiError` | cross_community | 6 |
| `CreateChartDetailModel → Open` | cross_community | 6 |
| `CreateHoroscopePanelModel → BuildUrl` | cross_community | 5 |
| `CreateHoroscopePanelModel → CreateHeaders` | cross_community | 5 |
| `BuildDaliurenChartFromXuanshu → LookupOrThrow` | cross_community | 4 |
| `BuildBaziDossierData → ToSexagenaryYearVi` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Api-client | 4 calls |
| Dossier | 4 calls |
| Services | 1 calls |

## How to Explore

1. `gitnexus_context({name: "analyzeMangpaiReading"})` — see callers and callees
2. `gitnexus_query({query: "chart"})` — find related execution flows
3. Read key files listed above for implementation details
