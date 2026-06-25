# 0022 Manual number-casting for Mai Hoa + Luc Hao

Date: 2026-06-25

## Status

Accepted

## Context

Decision 0021 established the divination flow with cast = server "now" for all
four time-based systems. The idea doc (`docs/ideas/divination-casting-flow.md`)
listed manual hexagram casting as a separate follow-up: Mai Hoa can be cast from
two numbers, and Luc Hao from six coin-toss line states. Dai Luc Nham and Ky Mon
have no number-casting in their tradition and remain time-only.

The user approved doing this as a second slice (US-026).

## Decision

Add an optional `castMethod` ('time' | 'manual') to the divination request,
limited to Mai Hoa and Luc Hao for the manual branch:

- Contract: `createDivinationRequestSchema` gains `castMethod` (default 'time'),
  `meihuaManual` (two positive numbers) and `liuyaoManual` (six line states).
  A `superRefine` enforces the system/payload match and rejects manual casting
  for Dai Luc Nham / Ky Mon. `meihuaMethodKeys` gains `'number-based'`.
- Engine: `ChartCalculationOptions` gains `meihuaManual` / `liuyaoManual`. The
  Mai Hoa adapter computes trigrams from the numbers (upper -> upper trigram,
  lower -> lower trigram, sum -> moving line) and tags `method: 'number-based'`.
  The Luc Hao adapter passes the line states to the vendored xuanshu runtime via
  `paiPanType: 2` + `manualYaoShu` (states map to codes 0-3) and tags
  `method: 'manual'`.
- API: the divinations service forwards the manual payload to the adapter when
  `castMethod === 'manual'`; the snapshot still persists via the same path, no
  schema change to `divination_context`.
- Web: `DivinationForm` shows a cast-method picker only for Mai Hoa / Luc Hao;
  Mai Hoa renders two number inputs, Luc Hao renders six line selectors.

## Alternatives Considered

1. Add number-casting to all four systems. Rejected: Dai Luc Nham / Ky Mon have
   no number-casting tradition; the vendored runtimes cast by time only.
2. Persist the cast method on `divination_context`. Deferred: the cast method is
   already encoded in the snapshot (`meihua.method` / `liuyao.method`); no need
   to duplicate it in the context record yet.

## Consequences

Positive:

- Mai Hoa and Luc Hao support the classic by-number / by-toss casting.
- No DB migration; the change is contract + engine + UI only.

Tradeoffs:

- The divination request schema now has system-conditional fields, enforced by
  superRefine rather than the type system.

## Follow-Up

- Coin-toss helper UI (animate three coins) could replace the six line dropdowns
  later; the contract already accepts the resulting line states.
