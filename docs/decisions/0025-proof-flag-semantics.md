# 0025 Proof flag semantics: 0 means not-yet-proven, not not-applicable

Date: 2026-06-26

## Status

Accepted

## Context

The durable matrix (`query matrix --numeric`) shows four proof flags per story:
unit / integration / e2e / platform. A `0` is overloaded today. For some
stories `0` means "this layer is not applicable by design" (the story's own
Validation table prints `-` or `n/a` for that layer). For others `0` means
"this layer was actually run and green but the flag was never flipped to 1"
(under-reporting).

This ambiguity makes the matrix misleading: a reviewer cannot tell a real
coverage gap from a bookkeeping miss, and there is pressure to flip every `0`
to `1` to make the board look complete, which would fabricate proof.

Concrete cases on 2026-06-26:

- N/A by design (flag 0 is correct, story Validation table prints `-`/`n/a`):
  - US-003 unit-only (integration/e2e/platform = `-`).
  - US-004 platform-only (unit/integration/e2e = `-`).
  - US-020-e2e-ziwei-flow-stabilization e2e+platform only (unit/integration n/a,
    "thuan E2E").
  - US-019-supabase-cloud-migration e2e deliberately split out to US-020.
- Under-reported platform (verify_command actually runs a platform-tier check
  such as `pnpm -F @ziweiai/web check` or `pnpm -F @ziweiai/api test`, green,
  but the platform flag stayed 0):
  - US-017i, US-017k, US-025, US-026.

## Decision

1. A proof flag of `0` means "not yet proven" (either not-applicable by design,
   or applicable but unproven). `1` means "a real check at that tier ran green
   and is recorded in evidence". Never flip a flag to `1` without a green run.
2. When a layer is not-applicable by design, keep the flag at `0` and make the
   story's Validation table the source of truth: that layer's row must read `-`
   or `n/a` with a one-line reason. The matrix `0` is then read together with
   the story doc, not in isolation.
3. Under-reported flags get corrected by running the story's `verify_command`
   (or the explicit tier command) and, only on green, flipping the flag with
   `story update`, recording the command + result in evidence.
4. Do not add a new "n/a" enum value to the schema. The schema stays boolean;
   the story Validation table carries the not-applicable nuance. This avoids a
   migration and keeps the CLI contract stable.

## Alternatives Considered

1. Add a third state (e.g. `n/a`/`-1`) to each proof column. Rejected: schema
   migration + CLI enum change for nuance the story doc already carries; raises
   complexity for every future story.
2. Flip all `0` flags to `1` so the board reads complete. Rejected: fabricates
   proof for layers that were never run; directly violates "never claim a pass
   you did not run".
3. Leave the ambiguity as-is. Rejected: the matrix stays misleading and the
   next agent repeats the same triage.

## Consequences

Positive:

- The matrix `0` is interpretable: cross-check the story Validation table.
- Under-reported platform flags get corrected with real evidence, not guesses.
- No schema/CLI churn.

Tradeoffs:

- Reading a `0` requires opening the story doc to learn N/A vs unproven.
- Story authors must keep the Validation table's `-`/`n/a` rows accurate.

## Follow-Up

- Backfill US-017i, US-017k, US-025, US-026 platform flags after green verify.
- Refresh evidence text on the four N/A-by-design stories to state explicitly
  which layers are not-applicable and why.
