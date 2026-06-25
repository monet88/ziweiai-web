# 0021 Divination casting flow: dedicated endpoint + context record

Date: 2026-06-25

## Status

Accepted

## Context

The four time-based divination systems (Mai Hoa, Luc Hao, Dai Luc Nham, Ky Mon)
reuse the natal `BirthForm` and the `POST /charts` flow. This is wrong on two
fronts:

1. They are cast by time, not by birth date. Asking for birth date + gender is
   meaningless for them; the cast moment is "now".
2. Divination requires a question. Without it, the AI explanation only describes
   the hexagram/board generically instead of answering what the user asked.
   `explanationContextSchema` carries no question, so readings cannot target the
   actual inquiry (du than, luc than, ung ky).

Refined via `docs/ideas/divination-casting-flow.md` with the user. Seven
decisions were locked: mandatory question; cast = server "now" (no picker, no
past/future); store question + purpose in a separate record (snapshot stays pure
engine output); per-system prompt tailoring; purpose = preset list + free-text
fallback; history card shows question + purpose + cast date; new `POST
/divinations` endpoint separate from `POST /charts`.

## Decision

Add a parallel divination flow rather than overloading the natal chart flow:

- Contract: new `createDivinationRequestSchema` (chartSystem limited to the four
  time-based systems, mandatory question, purpose) + `divinationContextSchema`
  and a `divinationContextRecordSchema`. Do not touch `birthInputSchema` or
  `createChartRequestSchema`.
- API: new `POST /divinations` controller + service. The service builds a
  `BirthInput` from server `now`, runs the existing system adapter, persists the
  pure snapshot via the existing path, then persists a linked
  `divination_context` row (question + purpose + cast timestamp).
- DB: new `divination_context` table, owner-scoped, RLS `TO authenticated`
  (per decision 0020), linked to `chart_snapshots(id)`.
- Explanation: per-system prompt builders accept the stored question + purpose
  and frame them in each system's terms.
- Web: new `DivinationForm` rendered on /meihua, /liuyao, /daliuren, /qimen.
  History card shows question + purpose + cast date.

## Alternatives Considered

1. Overload `POST /charts` with optional question/purpose. Rejected: pollutes
   the natal request schema and the snapshot concept; the user chose a separate
   endpoint.
2. Store question/purpose on the chart snapshot. Rejected: the snapshot must
   stay pure engine output; context belongs in its own record.
3. Capture the question at explanation time only. Rejected: mandatory + must
   persist for history/sharing means it is captured once at cast time.
4. Allow future/past cast moments with a picker. Rejected: theoretically
   invalid for shi-gua; future is read via the changed hexagram. Cast = now.

## Consequences

Positive:

- Natal flow, snapshot, and contracts stay untouched.
- Divination readings can target the user's real question.
- History/sharing gets meaningful question + purpose context.

Tradeoffs:

- A new endpoint, table, and form to maintain in parallel with the chart flow.
- Per-system prompt tailoring is more work than one shared injection block.

## Follow-Up

- Manual hexagram casting by numbers / coin toss (Mai Hoa + Luc Hao only) is a
  separate later story; needs engine + contract extension.
- Shared injection helper across the four prompt builders can be extracted if
  duplication grows.
