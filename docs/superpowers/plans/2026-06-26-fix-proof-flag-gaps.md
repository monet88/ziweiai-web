# Fix Harness Proof-Flag Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the seven flagged proof-flag gaps in the harness matrix by recording one durable decision that defines what a `0` proof flag means, then correcting flags + story evidence so the matrix stops misreporting.

**Architecture:** Two distinct gap classes. Class A "N/A by design" stories already declare the tier as `-`/`n/a` in their own Validation table, so `0` is correct and must stay `0`; the fix is documentation (decision + evidence annotation), never fabricating a `1`. Class B "under-reported platform" stories actually exercise the platform tier in their `verify_command` (a real `pnpm -F @ziweiai/web check` / `pnpm -F @ziweiai/api test`) but the flag was never flipped; the fix is to run the real check and set `--platform 1` only if green.

**Tech Stack:** `scripts/bin/harness-cli.exe` (SQLite durable layer), pnpm@10.17.1 + Turbo workspace, Vitest (api/contracts), svelte-check (web).

---

## Gap Classification (source of truth for this plan)

Read directly from `query matrix --numeric` + each story's Validation table.

| Story | u i e p | Class | Resolution |
|---|---|---|---|
| US-003 | 1 0 0 0 | A: Integration/E2E/Platform marked `-` in story | keep flags, annotate evidence as N/A-by-design |
| US-004 | 0 0 0 1 | A: Unit/Integration/E2E marked `-` in story | keep flags, annotate evidence as N/A-by-design |
| US-020-e2e | 0 0 1 1 | A: Unit/Integration marked `n/a (thuan E2E)` | keep flags, annotate evidence as N/A-by-design |
| US-019-supabase-cloud-migration | 1 1 0 1 | A: E2E debt intentionally split to US-020 | keep flags, annotate evidence as deferred-by-split |
| US-025 | 1 1 1 0 | B: verify runs `pnpm -F @ziweiai/web check` (platform tier) | run check, flip `--platform 1` if green |
| US-026 | 1 1 1 0 | B: same verify chain as US-025 | run check, flip `--platform 1` if green |
| US-017i | 1 1 1 0 | B: epic US-017 platform proof = api test + web check + single zod | run checks, flip `--platform 1` if green |
| US-017k | 1 1 1 0 | B: touches web dashboard-history, web check applies | run checks, flip `--platform 1` if green |

---

### Task 1: Record intake (classify this work)

**Files:** durable layer only (`harness.db`).

- [ ] **Step 1: Record the intake row**

Run:
```bash
scripts/bin/harness-cli.exe intake --type "harness improvement" --summary "Resolve 7 proof-flag gaps: record decision defining 0-flag semantics + correct under-reported platform flags" --lane normal
```
Expected: prints a new intake id (note it for the trace `--intake`).

---

### Task 2: Author the durable decision (0025)

**Files:**
- Create: `docs/decisions/0025-proof-flag-na-vs-unproven.md`

This decision defines that a `0` proof flag is overloaded - it can mean "N/A by design" OR "not yet proven" - and sets the rule: a tier marked `-`/`n/a` in a story's Validation table stays `0` and must carry an evidence note; a `1` is only ever set from a real green run.

- [ ] **Step 1: Write the decision doc using the repo template shape**

Content (matches `docs/templates/decision.md` structure):
```markdown
# 0025 Proof flag 0 means N/A-by-design or unproven; never fabricate a 1

Date: 2026-06-26

## Status

Accepted

## Context

`query matrix --numeric` shows four proof tiers (unit/integration/e2e/platform)
per story as `1`/`0`. A `0` is ambiguous: some stories legitimately have no work
at a tier (US-003 marks Integration/E2E/Platform `-`; US-004 marks
Unit/Integration/E2E `-`; US-020-e2e marks Unit/Integration `n/a (thuan E2E)`;
US-019 split its E2E debt to US-020), while others simply never had a real flag
flipped after a green run (US-025, US-026, US-017i, US-017k all run a platform-
tier check in their verify_command but still report platform 0). Reading the
matrix alone, an N/A-by-design 0 is indistinguishable from an unproven 0, which
makes the control panel misleading.

## Decision

1. A proof tier a story's Validation table marks `-` or `n/a` is N/A by design.
   It stays `0` and is NOT flipped to `1`. Its `--evidence` must state the tier
   is N/A and why, so the 0 is readable as intentional.
2. A proof flag is set to `1` only from a real, green verification run recorded
   in evidence. Never set `1` to "fill" a tier that was not actually exercised.
3. When a story's `verify_command` already exercises a tier (e.g. it runs
   `pnpm -F @ziweiai/web check` = platform), the flag must reflect the last
   green run; a stale `0` there is a reporting bug to correct, not new work.

## Alternatives Considered

1. Add a distinct `n/a` enum value to the proof columns. Rejected: schema change
   to the durable layer for a reporting nuance; evidence text carries the same
   information without migration.
2. Flip all N/A-by-design tiers to `1` for a clean matrix. Rejected: fabricates
   proof and violates "never claim a pass you did not run".
3. Leave all 0s as-is. Rejected: the matrix stays ambiguous and the under-
   reported platform flags keep misrepresenting shipped, validated work.

## Consequences

Positive:

- The matrix becomes truthful: every 0 is either annotated N/A or a genuine gap.
- Under-reported platform flags for already-merged work get corrected.

Tradeoffs:

- N/A-by-design tiers still render as `0`; readers must check evidence text.

## Follow-Up

- If N/A-vs-unproven ambiguity keeps causing friction, revisit alternative 1
  (dedicated enum) via `backlog add`.
```

- [ ] **Step 2: Register the decision in the durable layer**

Run:
```bash
scripts/bin/harness-cli.exe decision add --id 0025-proof-flag-na-vs-unproven --title "Proof flag 0 means N/A-by-design or unproven; never fabricate a 1" --doc docs/decisions/0025-proof-flag-na-vs-unproven.md --notes "Defines 0-flag semantics; gates Task 3 (annotate) vs Task 4 (flip)." --status accepted
```
Expected: prints the decision row id.

- [ ] **Step 3: Verify it persisted**

Run: `scripts/bin/harness-cli.exe query decisions`
Expected: row `0025-proof-flag-na-vs-unproven` with status accepted.

---

### Task 3: Annotate Class A stories (N/A by design) - evidence only, flags unchanged

**Files:** durable layer only. Do NOT change any proof flag for these four.

- [ ] **Step 1: US-003 evidence note**

Run:
```bash
scripts/bin/harness-cli.exe story update --id US-003 --evidence "Per decision 0025: Integration/E2E/Platform are N/A by design (story Validation marks them '-'); only Unit applies. Unit green via 'pnpm -F @ziweiai/web test'."
```
Expected: story row updated; `query matrix --numeric` still shows US-003 `1 0 0 0`.

- [ ] **Step 2: US-004 evidence note**

Run:
```bash
scripts/bin/harness-cli.exe story update --id US-004 --evidence "Per decision 0025: Unit/Integration/E2E are N/A by design (story Validation marks them '-'); only Platform applies. Platform green via 'pnpm -F @ziweiai/web check'."
```
Expected: US-004 stays `0 0 0 1`.

- [ ] **Step 3: US-020-e2e evidence note (append, do not clobber existing root-cause evidence)**

First read current evidence:
Run: `scripts/bin/harness-cli.exe query sql "SELECT evidence FROM story WHERE id='US-020-e2e-ziwei-flow-stabilization'"`
Then re-set evidence = existing text + " | Per decision 0025: Unit/Integration are N/A by design (pure E2E story)."
Run:
```bash
scripts/bin/harness-cli.exe story update --id US-020-e2e-ziwei-flow-stabilization --evidence "<existing text> | Per decision 0025: Unit/Integration are N/A by design (pure E2E story)."
```
Expected: US-020-e2e stays `0 0 1 1`.

- [ ] **Step 4: US-019 evidence note (append)**

Read current evidence, then append: " | Per decision 0025: E2E debt intentionally split to US-020-e2e-ziwei-flow-stabilization (now e2e=1); E2E here stays 0 by design."
Run:
```bash
scripts/bin/harness-cli.exe story update --id US-019-supabase-cloud-migration --evidence "<existing text> | Per decision 0025: E2E debt split to US-020 (e2e=1 there); stays 0 here by design."
```
Expected: US-019 stays `1 1 0 1`.

---

### Task 4: Correct Class B platform flags - run real checks, flip only if green

**Files:** durable layer only.

- [ ] **Step 1: Run the platform-tier checks**

Run: `pnpm -F @ziweiai/web check`
Expected: 0 errors (svelte-check + tsc).
Run: `pnpm -F @ziweiai/api test`
Expected: all tests pass.
Run: `pnpm why zod`
Expected: single zod v4 version.

If any check fails: STOP. Do not flip the flag. Record a `backlog add` and report the blocker instead.

- [ ] **Step 2: Flip US-025 platform (only if Step 1 green)**

Run:
```bash
scripts/bin/harness-cli.exe story update --id US-025 --platform 1 --evidence "<existing> | Per decision 0025: platform under-reported; web check 0/0 + api test green confirm platform tier already exercised by verify_command."
```
Expected: US-025 becomes `1 1 1 1`.

- [ ] **Step 3: Flip US-026 platform**

Run:
```bash
scripts/bin/harness-cli.exe story update --id US-026 --platform 1 --evidence "<existing> | Per decision 0025: platform under-reported; web check 0/0 + api test green."
```
Expected: US-026 becomes `1 1 1 1`.

- [ ] **Step 4: Flip US-017i platform**

Run:
```bash
scripts/bin/harness-cli.exe story update --id US-017i --platform 1 --evidence "<existing> | Per decision 0025: platform under-reported; api test green + single zod (epic US-017 platform proof = api test + web check + single zod)."
```
Expected: US-017i becomes `1 1 1 1`.

- [ ] **Step 5: Flip US-017k platform**

Run:
```bash
scripts/bin/harness-cli.exe story update --id US-017k --platform 1 --evidence "<existing> | Per decision 0025: platform under-reported; web check 0/0 + api test green (story touches web dashboard-history)."
```
Expected: US-017k becomes `1 1 1 1`.

---

### Task 5: Verify the corrected matrix + record trace

**Files:** durable layer only.

- [ ] **Step 1: Re-read the matrix**

Run: `scripts/bin/harness-cli.exe query matrix --numeric`
Expected: US-025/US-026/US-017i/US-017k now `1 1 1 1`; US-003/US-004/US-020-e2e/US-019 unchanged but carry N/A evidence.

- [ ] **Step 2: Record the trace**

Run:
```bash
scripts/bin/harness-cli.exe trace --intake <n> --story US-025 --summary "Resolve 7 proof-flag gaps: decision 0025 + annotate 4 N/A-by-design + flip 4 under-reported platform flags after green checks" --outcome completed --agent codex --actions "intake; decision add 0025; story evidence annotate US-003/004/020-e2e/019; ran web check + api test + pnpm why zod; flipped platform US-025/026/017i/017k" --read "docs/HARNESS.md,docs/FEATURE_INTAKE.md,story docs,matrix" --changed "docs/decisions/0025-proof-flag-na-vs-unproven.md,docs/superpowers/plans/2026-06-26-fix-proof-flag-gaps.md,harness.db" --friction "matrix 0-flag overloaded N/A vs unproven; platform flags not flipped after green verify"
```
Expected: trace id printed.

---

## Self-Review

1. Spec coverage: All seven user-listed gaps mapped in the classification table - US-003, US-004, US-020-e2e, US-025, US-026, US-017i, US-017k, plus US-019 e2e. Covered by Task 3 (Class A) and Task 4 (Class B).
2. Placeholder scan: `<n>` and `<existing>` are deliberate runtime substitutions (intake id, current evidence string), resolved at execution via the noted read commands - not lazy placeholders.
3. Type consistency: All enum values match the cheat-sheet (`intake --type "harness improvement"`, `--lane normal`, `decision --status accepted`, `trace --outcome completed`, numeric `--platform 1`). Flag names `--read`/`--changed` used, not `--files-read`.
