# Divination Casting Flow (time-based systems)

Scope: Mai Hoa, Luc Hao, Dai Luc Nham, Ky Mon. Bat Tu / Tu Vi unchanged.

Date: 2026-06-25 (refined with locked decisions)

## Problem Statement

How might we make the four time-based divination systems produce a reading that
targets the user's actual question, at the moment of casting, without asking for
meaningless birth / gender data?

## Recommended Direction

Introduce a dedicated DivinationForm shared by all four systems, replacing the
reused BirthForm on the four divination routes. It captures, at cast time:

- a mandatory question (free text),
- a purpose (preset list + free-text custom fallback).

The cast moment is always the server's "now" at submit time -- no picker. The
flow runs through a new POST /divinations endpoint, fully separate from the
natal POST /charts flow. The snapshot stays pure engine output; the question +
purpose live in a separate divination_context record linked to the snapshot, so
history can show "question + purpose + cast date" and be shareable, and every
explanation reuses the stored question to target the reading per system.

## Locked Decisions

1. Question: mandatory. No question -> cannot cast.
2. Cast moment: always server "now". No picker, no past, no future.
3. Storage: separate `divination_context` record linked to the snapshot.
   Snapshot stays pure engine output.
4. Prompt injection: per-system tailoring. Each system frames the question in
   its own terms (Mai Hoa -> the / dung, Luc Hao -> ung / the, etc.).
5. Purpose: preset list + free-text custom fallback.
6. History: card shows question + purpose + cast date, visually distinct from
   natal chart cards.
7. API: new `POST /divinations` endpoint, separate from `POST /charts`.

## Key Assumptions to Validate

- [ ] AI readings improve meaningfully when the prompt carries question + purpose
      (test: run 2-3 real hexagrams with vs without, compare).
- [ ] 4-5 purpose presets cover most real questions; custom text handles the rest.
- [ ] Per-system question framing is worth the extra prompt-builder work vs a
      single shared injection block.

## MVP Scope

In:

- New contract: `createDivinationRequestSchema` (question, purpose, chartSystem)
  + `divinationContextSchema`. Does not touch `BirthInput` or
  `createChartRequestSchema`.
- New `POST /divinations`: controller + service that builds `BirthInput` from
  server `now`, runs the existing system adapter, persists snapshot +
  `divination_context`.
- `DivinationForm.svelte` rendered on /meihua, /liuyao, /daliuren, /qimen
  instead of BirthForm. Question mandatory, purpose preset + custom.
- Persist question + purpose in `divination_context` linked to the snapshot.
- History card shows question + purpose + cast date, distinct from natal cards.
- Per-system explanation prompt builders consume question + purpose.

Out (separate follow-up):

- Manual number / line casting (Mai Hoa two numbers + Luc Hao six line states)
  was delivered as US-026 (decision 0022); it is no longer a follow-up. What
  remains out is the coin-toss animation UI for Luc Hao: the contract already
  accepts the resulting line states, so this is a presentation-only follow-up.

## Not Doing (and Why)

- Cast-moment picker / past / future: dropped. Cast = server now at submit;
  simplest UX and correct for ~99% of real use.
- Number / coin casting in this pass: high cost, applies to only two of the
  four systems.
- Touching Bat Tu / Tu Vi: they correctly use birth date; out of scope.
- Reusing POST /charts: rejected. A separate POST /divinations keeps the
  divination flow and its persistence cleanly isolated.
- Asking the question only at explanation time: rejected. Mandatory + must
  persist for history / sharing means capture once at cast time.

## Open Questions (for the story / plan + decision record)

- Exact `divination_context` table shape + RLS (owner-scoped, TO authenticated,
  per decision 0020) and how history joins it.
- Whether the four prompt builders share a common injection helper while still
  framing per system.
