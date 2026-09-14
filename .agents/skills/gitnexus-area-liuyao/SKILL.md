---
name: liuyao
description: "Skill for the Liuyao area of ziweiai-web. 29 symbols across 3 files."
---

# Liuyao

29 symbols | 3 files | Cohesion: 83%

## When to Use

- Working with code in `packages/`
- Understanding how createLiuYaoPaiPan, generateYaoShu, applyTarget work
- Modifying liuyao-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/xuanshu-runtime/lib/liuyao/index.ts` | toYmdHms, diffParts, formatBirthMarker, formatKongWang, LiuYaoPaiPan (+22) |
| `packages/xuanshu-runtime/lib/utils/common.ts` | generateYaoShu |
| `packages/xuanshu-runtime/lib/config/shenShaConfig.ts` | filterShenSha |

## Entry Points

Start here when exploring this area:

- **`createLiuYaoPaiPan`** (Function) — `packages/xuanshu-runtime/lib/liuyao/index.ts:693`
- **`generateYaoShu`** (Function) — `packages/xuanshu-runtime/lib/utils/common.ts:198`
- **`applyTarget`** (Function) — `packages/xuanshu-runtime/lib/liuyao/index.ts:646`
- **`filterShenSha`** (Function) — `packages/xuanshu-runtime/lib/config/shenShaConfig.ts:230`
- **`LiuYaoPaiPan`** (Class) — `packages/xuanshu-runtime/lib/liuyao/index.ts:180`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `LiuYaoPaiPan` | Class | `packages/xuanshu-runtime/lib/liuyao/index.ts` | 180 |
| `createLiuYaoPaiPan` | Function | `packages/xuanshu-runtime/lib/liuyao/index.ts` | 693 |
| `generateYaoShu` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 198 |
| `applyTarget` | Function | `packages/xuanshu-runtime/lib/liuyao/index.ts` | 646 |
| `filterShenSha` | Function | `packages/xuanshu-runtime/lib/config/shenShaConfig.ts` | 230 |
| `getPaiPan` | Method | `packages/xuanshu-runtime/lib/liuyao/index.ts` | 257 |
| `getShengXiao` | Method | `packages/xuanshu-runtime/lib/liuyao/index.ts` | 590 |
| `getGuaAs` | Method | `packages/xuanshu-runtime/lib/liuyao/index.ts` | 601 |
| `getYueJiangData` | Method | `packages/xuanshu-runtime/lib/liuyao/index.ts` | 606 |
| `calculateFuShen` | Method | `packages/xuanshu-runtime/lib/liuyao/index.ts` | 615 |
| `initializeLiuYaoData` | Method | `packages/xuanshu-runtime/lib/liuyao/index.ts` | 488 |
| `initializeDateModeYaoData` | Method | `packages/xuanshu-runtime/lib/liuyao/index.ts` | 502 |
| `initializeManualModeYaoData` | Method | `packages/xuanshu-runtime/lib/liuyao/index.ts` | 533 |
| `initializeAutoModeYaoData` | Method | `packages/xuanshu-runtime/lib/liuyao/index.ts` | 543 |
| `applyYaoShu` | Method | `packages/xuanshu-runtime/lib/liuyao/index.ts` | 552 |
| `constructor` | Method | `packages/xuanshu-runtime/lib/liuyao/index.ts` | 232 |
| `initializeGanZhi` | Method | `packages/xuanshu-runtime/lib/liuyao/index.ts` | 460 |
| `getYearGanZhi` | Method | `packages/xuanshu-runtime/lib/liuyao/index.ts` | 565 |
| `getMonthGanZhi` | Method | `packages/xuanshu-runtime/lib/liuyao/index.ts` | 576 |
| `getDayGanZhi` | Method | `packages/xuanshu-runtime/lib/liuyao/index.ts` | 583 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CalculateChart → GetGuaAs` | cross_community | 4 |
| `CalculateChart → CalculateFuShen` | cross_community | 4 |
| `CalculateChart → GetSolar` | cross_community | 4 |
| `CalculateChart → ToYmdHms` | cross_community | 4 |
| `Constructor → ToNumber` | cross_community | 4 |
| `Constructor → GetMonthInGanZhi` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Qimen | 2 calls |
| Ziwei | 2 calls |
| Bazi | 2 calls |
| Adapters | 1 calls |

## How to Explore

1. `gitnexus_context({name: "createLiuYaoPaiPan"})` — see callers and callees
2. `gitnexus_query({query: "liuyao"})` — find related execution flows
3. Read key files listed above for implementation details
