---
name: qimen
description: "Skill for the Qimen area of ziweiai-web. 59 symbols across 8 files."
---

# Qimen

59 symbols | 8 files | Cohesion: 81%

## When to Use

- Working with code in `packages/`
- Understanding how parseSolarDateTimeString, parseLunarDateTimeString, formatSolarDateTime work
- Modifying qimen-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/xuanshu-runtime/lib/qimen/index.ts` | getSolar, solarToDate, initializeDate, toYmdHms, diffParts (+29) |
| `packages/xuanshu-runtime/lib/utils/dateTime.ts` | toNumber, parseSolarDateTimeString, parseLunarDateTimeString, formatSolarDateTime, formatLunarDateTime (+7) |
| `packages/xuanshu-runtime/lib/liuyao/index.ts` | getSolar, solarToDate, initializeDate |
| `packages/xuanshu-runtime/lib/daliuren/index.ts` | getSolar, solarToDate, initializeDate |
| `packages/xuanshu-runtime/lib/meihua/index.ts` | getSolar, solarToDate, initializeDate |
| `packages/xuanshu-runtime/lib/bazi/index.ts` | constructor, initializeDate |
| `packages/xuanshu-runtime/lib/utils/common.ts` | parseDate |
| `packages/astro-engine/src/adapters/lunar-javascript-qimen-adapter.ts` | getPrevJieQi |

## Entry Points

Start here when exploring this area:

- **`parseSolarDateTimeString`** (Function) — `packages/xuanshu-runtime/lib/utils/dateTime.ts:22`
- **`parseLunarDateTimeString`** (Function) — `packages/xuanshu-runtime/lib/utils/dateTime.ts:42`
- **`formatSolarDateTime`** (Function) — `packages/xuanshu-runtime/lib/utils/dateTime.ts:63`
- **`formatLunarDateTime`** (Function) — `packages/xuanshu-runtime/lib/utils/dateTime.ts:67`
- **`solarPartsToDate`** (Function) — `packages/xuanshu-runtime/lib/utils/dateTime.ts:72`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `QiMenPaiPan` | Class | `packages/xuanshu-runtime/lib/qimen/index.ts` | 94 |
| `parseSolarDateTimeString` | Function | `packages/xuanshu-runtime/lib/utils/dateTime.ts` | 22 |
| `parseLunarDateTimeString` | Function | `packages/xuanshu-runtime/lib/utils/dateTime.ts` | 42 |
| `formatSolarDateTime` | Function | `packages/xuanshu-runtime/lib/utils/dateTime.ts` | 63 |
| `formatLunarDateTime` | Function | `packages/xuanshu-runtime/lib/utils/dateTime.ts` | 67 |
| `solarPartsToDate` | Function | `packages/xuanshu-runtime/lib/utils/dateTime.ts` | 72 |
| `getLunarMonthValue` | Function | `packages/xuanshu-runtime/lib/utils/dateTime.ts` | 90 |
| `lunarPartsToSolarParts` | Function | `packages/xuanshu-runtime/lib/utils/dateTime.ts` | 116 |
| `solarPartsToLunarParts` | Function | `packages/xuanshu-runtime/lib/utils/dateTime.ts` | 130 |
| `normalizeDateValue` | Function | `packages/xuanshu-runtime/lib/utils/dateTime.ts` | 146 |
| `convertDateValue` | Function | `packages/xuanshu-runtime/lib/utils/dateTime.ts` | 167 |
| `parseDate` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 116 |
| `createQiMenPaiPan` | Function | `packages/xuanshu-runtime/lib/qimen/index.ts` | 699 |
| `initializeDate` | Method | `packages/xuanshu-runtime/lib/qimen/index.ts` | 310 |
| `initializeDate` | Method | `packages/xuanshu-runtime/lib/liuyao/index.ts` | 426 |
| `initializeDate` | Method | `packages/xuanshu-runtime/lib/daliuren/index.ts` | 260 |
| `initializeDate` | Method | `packages/xuanshu-runtime/lib/meihua/index.ts` | 377 |
| `constructor` | Method | `packages/xuanshu-runtime/lib/bazi/index.ts` | 206 |
| `initializeDate` | Method | `packages/xuanshu-runtime/lib/bazi/index.ts` | 238 |
| `getPaiPan` | Method | `packages/xuanshu-runtime/lib/qimen/index.ts` | 201 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Constructor → ToNumber` | cross_community | 4 |
| `Constructor → GetMonthInGanZhi` | cross_community | 4 |
| `Constructor → GetPrevJieQi` | cross_community | 4 |
| `Constructor → GetJieQi` | cross_community | 4 |
| `Constructor → ToNumber` | cross_community | 4 |
| `Constructor → ToNumber` | cross_community | 4 |
| `Constructor → ToNumber` | cross_community | 4 |
| `Constructor → ToNumber` | intra_community | 4 |
| `Constructor → GetSolar` | cross_community | 3 |
| `Constructor → SolarToDate` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Bazi | 6 calls |
| Ziwei | 3 calls |
| Cluster_35 | 2 calls |
| Dreams | 1 calls |
| Adapters | 1 calls |

## How to Explore

1. `gitnexus_context({name: "parseSolarDateTimeString"})` — see callers and callees
2. `gitnexus_query({query: "qimen"})` — find related execution flows
3. Read key files listed above for implementation details
