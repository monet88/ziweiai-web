---
name: bazi
description: "Skill for the Bazi area of ziweiai-web. 89 symbols across 5 files."
---

# Bazi

89 symbols | 5 files | Cohesion: 79%

## When to Use

- Working with code in `packages/`
- Understanding how getWuXing, getNaYin, formatDate work
- Modifying bazi-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/xuanshu-runtime/lib/utils/common.ts` | getWuXing, getNaYin, formatDate, getWeekDay, getXingZuo (+39) |
| `packages/xuanshu-runtime/lib/bazi/index.ts` | BaZiPaiPan, getYueJiangData, getPaiPan, calculateWuXingCount, getWuXingWangShuai (+35) |
| `packages/astro-engine/src/adapters/shared/liuyao-daliuren-summary.ts` | toYmdHms, getSolar |
| `packages/xuanshu-runtime/lib/bazi/baziMaps.ts` | expandSegments, buildRenYuanTable |
| `packages/astro-engine/src/adapters/lunar-javascript-qimen-adapter.ts` | getJieQi |

## Entry Points

Start here when exploring this area:

- **`getWuXing`** (Function) — `packages/xuanshu-runtime/lib/utils/common.ts:40`
- **`getNaYin`** (Function) — `packages/xuanshu-runtime/lib/utils/common.ts:47`
- **`formatDate`** (Function) — `packages/xuanshu-runtime/lib/utils/common.ts:102`
- **`getWeekDay`** (Function) — `packages/xuanshu-runtime/lib/utils/common.ts:127`
- **`getXingZuo`** (Function) — `packages/xuanshu-runtime/lib/utils/common.ts:145`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `BaZiPaiPan` | Class | `packages/xuanshu-runtime/lib/bazi/index.ts` | 181 |
| `getWuXing` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 40 |
| `getNaYin` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 47 |
| `formatDate` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 102 |
| `getWeekDay` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 127 |
| `getXingZuo` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 145 |
| `getAge` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 161 |
| `getZhiShiShen` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 244 |
| `analyzeShiShenPattern` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 256 |
| `getCurrentLiuNian` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 434 |
| `getTaiYuan` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 1248 |
| `getTaiXi` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 1268 |
| `getMingGong` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 1290 |
| `getShenGong` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 1317 |
| `analyzeGanZhiLiuYi` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 1499 |
| `calculateJiuXing` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 1641 |
| `getNineStarInfo` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 1700 |
| `calculateGuZhong` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 2023 |
| `guZhongToText` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 2074 |
| `calculateShenQiangShenRuo` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 2101 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Constructor → GetJieQi` | cross_community | 4 |
| `CalculateChart → GetSolar` | cross_community | 4 |
| `CalculateChart → GetSolar` | cross_community | 4 |
| `CalculateChart → FormatDate` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Cluster_42 | 1 calls |
| Adapters | 1 calls |
| Ziwei | 1 calls |
| Cluster_44 | 1 calls |
| Qimen | 1 calls |

## How to Explore

1. `gitnexus_context({name: "getWuXing"})` — see callers and callees
2. `gitnexus_query({query: "bazi"})` — find related execution flows
3. Read key files listed above for implementation details
