---
name: ziwei
description: "Skill for the Ziwei area of ziweiai-web. 92 symbols across 10 files."
---

# Ziwei

92 symbols | 10 files | Cohesion: 88%

## When to Use

- Working with code in `packages/`
- Understanding how createZiWeiPaiPan, getRealAge, toSexagenaryYearVi work
- Modifying ziwei-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/xuanshu-runtime/lib/ziwei/index.ts` | toYmdHms, createEmptyPalaceList, wrapGongWei, appendStar, splitStars (+71) |
| `packages/astro-engine/src/adapters/shared/liuyao-daliuren-summary.ts` | getPrevQi, getNextQi, getYueJiangInfo |
| `packages/xuanshu-runtime/lib/qimen/index.ts` | initializeJieQi, calculateAge |
| `packages/xuanshu-runtime/lib/liuyao/index.ts` | initializeJieQi, calculateAge |
| `packages/xuanshu-runtime/lib/daliuren/index.ts` | initializeJieQi, calculateAge |
| `packages/xuanshu-runtime/lib/meihua/index.ts` | initializeJieQi, calculateAge |
| `packages/core/src/ziwei/lunar-date.ts` | toSexagenaryYearVi, normalizeLegacyLunarDate |
| `packages/xuanshu-runtime/lib/bazi/index.ts` | initializeJieQi |
| `packages/astro-engine/src/adapters/lunar-javascript-qimen-adapter.ts` | getPrevJie |
| `packages/xuanshu-runtime/lib/utils/common.ts` | getRealAge |

## Entry Points

Start here when exploring this area:

- **`createZiWeiPaiPan`** (Function) — `packages/xuanshu-runtime/lib/ziwei/index.ts:1037`
- **`getRealAge`** (Function) — `packages/xuanshu-runtime/lib/utils/common.ts:170`
- **`toSexagenaryYearVi`** (Function) — `packages/core/src/ziwei/lunar-date.ts:70`
- **`normalizeLegacyLunarDate`** (Function) — `packages/core/src/ziwei/lunar-date.ts:78`
- **`ZiWeiPaiPan`** (Class) — `packages/xuanshu-runtime/lib/ziwei/index.ts:121`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ZiWeiPaiPan` | Class | `packages/xuanshu-runtime/lib/ziwei/index.ts` | 121 |
| `createZiWeiPaiPan` | Function | `packages/xuanshu-runtime/lib/ziwei/index.ts` | 1037 |
| `getRealAge` | Function | `packages/xuanshu-runtime/lib/utils/common.ts` | 170 |
| `toSexagenaryYearVi` | Function | `packages/core/src/ziwei/lunar-date.ts` | 70 |
| `normalizeLegacyLunarDate` | Function | `packages/core/src/ziwei/lunar-date.ts` | 78 |
| `getPaiPan` | Method | `packages/xuanshu-runtime/lib/ziwei/index.ts` | 211 |
| `getSex` | Method | `packages/xuanshu-runtime/lib/ziwei/index.ts` | 452 |
| `getNanNvYinYang` | Method | `packages/xuanshu-runtime/lib/ziwei/index.ts` | 456 |
| `getShengXiao` | Method | `packages/xuanshu-runtime/lib/ziwei/index.ts` | 485 |
| `getYueJiangData` | Method | `packages/xuanshu-runtime/lib/ziwei/index.ts` | 496 |
| `getShiErGongDiZhi` | Method | `packages/xuanshu-runtime/lib/ziwei/index.ts` | 505 |
| `getShiErGongTianGan` | Method | `packages/xuanshu-runtime/lib/ziwei/index.ts` | 509 |
| `getMingGongGongWei` | Method | `packages/xuanshu-runtime/lib/ziwei/index.ts` | 513 |
| `getShenGongGongWei` | Method | `packages/xuanshu-runtime/lib/ziwei/index.ts` | 534 |
| `getMingGongDiZhi` | Method | `packages/xuanshu-runtime/lib/ziwei/index.ts` | 555 |
| `getShenGongDiZhi` | Method | `packages/xuanshu-runtime/lib/ziwei/index.ts` | 559 |
| `getShiErMingGong` | Method | `packages/xuanshu-runtime/lib/ziwei/index.ts` | 563 |
| `getShiErShenGong` | Method | `packages/xuanshu-runtime/lib/ziwei/index.ts` | 578 |
| `getWuXingJu` | Method | `packages/xuanshu-runtime/lib/ziwei/index.ts` | 584 |
| `getZiWeiXingGongWei` | Method | `packages/xuanshu-runtime/lib/ziwei/index.ts` | 600 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Constructor → GetPrevJie` | cross_community | 3 |
| `Constructor → GetPrevQi` | cross_community | 3 |
| `Constructor → GetNextQi` | cross_community | 3 |
| `Constructor → GetPrevJie` | cross_community | 3 |
| `Constructor → GetPrevQi` | cross_community | 3 |
| `Constructor → GetNextQi` | cross_community | 3 |
| `GetPaiPan → GetShiErGongDiZhi` | intra_community | 3 |
| `GetPaiPan → GetMingGongGongWei` | intra_community | 3 |
| `GetPaiPan → CreateEmptyPalaceList` | intra_community | 3 |
| `BuildDaLiuRenSummary → GetPrevQi` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Qimen | 3 calls |
| Bazi | 2 calls |
| Adapters | 1 calls |

## How to Explore

1. `gitnexus_context({name: "createZiWeiPaiPan"})` — see callers and callees
2. `gitnexus_query({query: "ziwei"})` — find related execution flows
3. Read key files listed above for implementation details
