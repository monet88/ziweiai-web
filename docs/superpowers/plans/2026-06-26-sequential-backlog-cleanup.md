# Sequential Backlog Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the four "finish dangling work / raise reading quality / extend reading features / pay down debt" backlog groups in a dependency-correct order, each with a harness story + real validation.

**Architecture:** apps/api (NestJS prompt builders + conversations), packages/contracts (tarot spread enum), apps/web (Svelte 5 surfaces + component tests), scripts (harness-cli + Supabase migration tracking). Most items are prompt-only or test-only; only backlog #28 requires an architecture decision (provider streaming) and is gated behind user confirmation.

**Tech Stack:** NestJS + Vitest (api), Zod v4 (contracts), SvelteKit + Vitest + Playwright (web), Supabase migrations, Rust harness-cli.

---

## Pre-flight findings (verified 2026-06-26)

These changed the user-proposed ordering; read before starting.

1. **Local main is one merge behind origin.** Local `main` is at `5e9c19c`; `origin/main` is at `a7d28b8` (PRs #41/#42 squash-merged). Sync first or every "missing on main" check is wrong.
2. **Backlog #31 is already DONE on origin/main.** `conversations.service.ts` + persistence gateway both implement `listConversationsForChart`; the controller wires `GET /conversations?chartId=`. No code work — only verify + close the backlog row.
3. **Backlog #28 is NOT a client-only change.** Per ADR 0019 the activation condition is real backend streaming (`stream: true`); the provider is still `stream: false` (fake-chunk). That is an architecture/boundary change and must be confirmed with the user before any code. This plan stops at a decision gate for #28.
4. **#33 cannot be a CLI flag today.** `harness-cli story update` exposes only `--unit/--integration/--e2e/--platform 0|1`; there is no per-axis N/A marker and the CLI is a prebuilt binary (no Rust source in-repo to rebuild). #33 resolves as a documentation convention (decision 0025 already exists) + an evidence-string convention, not a code change.

---

## Task 0: Sync local main with origin

**Files:** none (git only)

- [ ] **Step 1: Fetch and inspect**

Run: `git fetch origin; git log --oneline origin/main -3`
Expected: top commit `a7d28b8 Merge pull request #42 ...`.

- [ ] **Step 2: Fast-forward local main**

Do NOT switch off the current working branch if it has uncommitted plan/decision files. Just update the ref:
Run: `git fetch origin main:main` (fails if not fast-forwardable — then stop and report)
Expected: `main` advanced to `a7d28b8`.

- [ ] **Step 3: Confirm conversations list is present**

Run: `git show origin/main:apps/api/src/modules/conversations/services/conversations.service.ts | Select-String listConversationsForChart`
Expected: method definition found.

---

## Task 1: Close backlog #31 (conversations list already implemented)

**Files:**
- Verify: `apps/api/src/modules/conversations/services/conversations.service.test.ts`
- Verify: `apps/api/src/modules/conversations/conversations.controller.test.ts`

- [ ] **Step 1: Run the conversations tests on origin/main code**

Run: `pnpm -F @ziweiai/api test conversations`
Expected: PASS (controller + service suites green, including list-by-chart).

- [ ] **Step 2: Close the backlog row with evidence**

Run:
```
scripts\bin\harness-cli.exe backlog close --id 31 --status implemented --outcome "GET /conversations list-by-chart implemented on origin/main (PR #41/#42, conversations.service.listConversationsForChart + persistence gateway + controller chartId query). Verified: pnpm -F @ziweiai/api test conversations green."
```
Expected: `Backlog #31 closed.` (confirm the exact `backlog close` flag names with `scripts\bin\harness-cli.exe backlog close --help` first; adjust if the binary uses `--note`/`--resolution`).

---

## Task 2: Decision gate for backlog #28 (stream hardening)

**Files:** none yet (gate only)

- [ ] **Step 1: Re-read ADR 0019**

Read: `docs/decisions/0019-defer-conversation-stream-hardening.md`. Confirm activation condition: backend must move from `fullText.split` fake-chunk to provider `stream: true`.

- [ ] **Step 2: STOP and confirm with the user**

Present two options and wait:
1. Implement real provider streaming now (OpenAI-compat `stream: true` + SSE pass-through + abort/timeout/retry client). High-risk: touches provider boundary, conversations controller, web stream client. Needs `decision add` + new ADR superseding the fake-chunk note.
2. Keep #28 deferred (recommended until streaming UX is actually needed; YAGNI per ADR 0019).

Do NOT write code for #28 without an explicit choice of option 1.

---

## Task 3: backlog #22 — B1 Bazi/Ziwei LLM prompt upgrade (prompt-only)

**Files:**
- Modify: `apps/api/src/providers/ai/build-bazi-explanation-prompt.ts`
- Modify: `apps/api/src/providers/ai/build-palace-explanation-prompt.ts` (Ziwei)
- Test: `apps/api/src/providers/ai/build-palace-explanation-prompt.test.ts` (exists), add `build-bazi-explanation-prompt.test.ts`

Constraint: prompt text only, Vietnamese, ZERO Han characters (the provider already rejects Han output). Do not change request/response schemas or provider wiring — cost stays on the user/provider plan.

- [ ] **Step 1: Write/extend failing test asserting richer prompt structure (no Han)**

`apps/api/src/providers/ai/build-bazi-explanation-prompt.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { buildBaziExplanationPrompt } from './build-bazi-explanation-prompt';
import { CJK_TEXT_PATTERN } from '@ziweiai/core';

describe('buildBaziExplanationPrompt', () => {
  it('asks for structured sections and contains no Han', () => {
    const prompt = buildBaziExplanationPrompt({ summary: { 'Tổng quan': 'x' } } as never, 'overview');
    expect(prompt).toMatch(/tổng quan/i);
    expect(CJK_TEXT_PATTERN.test(prompt)).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to see the baseline**

Run: `pnpm -F @ziweiai/api test build-bazi-explanation-prompt`
Expected: PASS now (asserts current behavior) or FAIL if you tightened the assertion ahead of the upgrade.

- [ ] **Step 3: Upgrade prompt copy**

> STALE (2026-06-27): this upgrade already shipped. `buildBaziExplanationPrompt.ts` already emits the mandated reasoning order (day master -> ten gods -> hidden stems -> na yin) plus the `## Tổng quan / ## Điểm mạnh / ## Điểm cần lưu ý / ## Gợi ý hành động` section headers; `buildPalaceExplanationPrompt.ts` carries the Ziwei equivalent. Verify with `pnpm -F @ziweiai/api test build-bazi-explanation-prompt` before touching copy; treat this step as a no-op unless the assertions reveal a real gap.

Originally: enrich both builders with explicit reasoning order (day master -> ten gods -> hidden stems -> na yin for Bazi; palace -> stars -> brightness -> mutagen for Ziwei), explicit section headers, a "no Han" reminder already present, and a length target. Keep all keys translated via `translateBaziKey`/`translateZiweiKey`.

- [ ] **Step 4: Run api tests + Han guard**

Run: `pnpm -F @ziweiai/api test`
Expected: PASS (271+ tests). No Han assertions fail.

- [ ] **Step 5: Commit**

```
git add apps/api/src/providers/ai/build-bazi-explanation-prompt.ts apps/api/src/providers/ai/build-palace-explanation-prompt.ts apps/api/src/providers/ai/build-bazi-explanation-prompt.test.ts
git commit -m "feat(prompt): upgrade Bazi/Ziwei explanation prompts (backlog #22)"
```

---

## Task 4: backlog #23 — B2 Bazi enrichment layer (prompt-only, VN)

**Files:**
- Modify: `apps/api/src/providers/ai/build-bazi-explanation-prompt.ts`
- Test: `apps/api/src/providers/ai/build-bazi-explanation-prompt.test.ts`

Scope: add shen-sha / tiao-hou / yong-shen / ge-ju GUIDANCE to the prompt only (ask the model to reason about them in Vietnamese terms). Do NOT compute these server-side — that would be an engine change, out of scope for a prompt backlog item.

- [ ] **Step 1: Failing test for enrichment guidance**

Add assertions that the prompt instructs the model to consider dụng thần / cách cục / điều hậu / thần sát (Vietnamese labels), still no Han.

- [ ] **Step 2: Run to confirm fail**

Run: `pnpm -F @ziweiai/api test build-bazi-explanation-prompt`
Expected: FAIL (new guidance lines absent).

- [ ] **Step 3: Add the guidance block**

Append a "Khung phân tích nâng cao" section listing the four lenses in Vietnamese, framed as instructions, before the closing length directive.

- [ ] **Step 4: Run api tests**

Run: `pnpm -F @ziweiai/api test`
Expected: PASS.

- [ ] **Step 5: Commit**

```
git add apps/api/src/providers/ai/build-bazi-explanation-prompt.ts apps/api/src/providers/ai/build-bazi-explanation-prompt.test.ts
git commit -m "feat(prompt): add Bazi enrichment guidance (shen-sha/tiao-hou/yong-shen/ge-ju) (backlog #23)"
```

---

## Task 5: backlog #27 — add @testing-library/svelte (DEBT, unblocks later UI proof)

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/src/lib/components/ui/PrimaryButton.test.ts` (first real component test)

This lands before #24/#29 web work so those features can carry component-level unit proof.

- [ ] **Step 1: Add dev deps (pinned)**

> STALE (2026-06-27): both deps are already in `apps/web/package.json` devDependencies (`@testing-library/svelte@^5.4.2`, `@testing-library/jest-dom@^6.9.1`) and `src/test/setup-testing-library.ts` is already wired into `vitest.config.ts`. Skip the install; confirm with `pnpm -F @ziweiai/web ls @testing-library/svelte @testing-library/jest-dom` and only re-add if a dep is genuinely missing.

Originally: `pnpm -F @ziweiai/web add -D @testing-library/svelte@^5 @testing-library/jest-dom@^6` (package.json devDependencies updated; single versions).

- [ ] **Step 2: Write one passing component test**

`apps/web/src/lib/components/ui/PrimaryButton.test.ts`:
```ts
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import PrimaryButton from './PrimaryButton.svelte';

describe('PrimaryButton', () => {
  it('renders label and is a real button', () => {
    render(PrimaryButton, { props: { label: 'Gửi' } });
    expect(screen.getByRole('button', { name: 'Gửi' })).toBeInTheDocument();
  });
});
```
(Adjust props to the actual PrimaryButton API; read the component first.)

- [ ] **Step 3: Run web tests**

Run: `pnpm -F @ziweiai/web test`
Expected: PASS including the new component test.

- [ ] **Step 4: Commit**

```
git add apps/web/package.json pnpm-lock.yaml apps/web/src/lib/components/ui/PrimaryButton.test.ts
git commit -m "chore(web): add @testing-library/svelte + first component test (backlog #27)"
```

---

## Task 6: backlog #24 — B5 Tarot spread expansion (single/diamond/moon/horseshoe)

**Files:**
- Modify: `packages/contracts/src/chart/tarot-draw.ts` (extend `tarotSpreadSchema` enum)
- Test: `packages/contracts/src/chart/us017-schemas.test.ts`
- Modify: `apps/api/src/modules/draws-tarot/draws-tarot.service.ts` (card count per spread)
- Modify: `apps/api/src/modules/draws-tarot/tarot-prompts.ts` (per-spread framing)
- Modify: `apps/web/src/lib/features/tarot/*` + `/tarot` route (spread radiogroup options)

> STALE (2026-06-27): the schema already contains ALL six spreads. `packages/contracts/src/chart/tarot-draw.ts` `tarotSpreadSchema` is `['single', 'three-card', 'diamond', 'moon', 'horseshoe', 'celtic-cross']` with card counts `single:1, three-card:3, diamond:4, moon:4, horseshoe:7, celtic-cross:10`, and `tarot-prompts.ts` already has `SPREAD_POSITIONS` + `SPREAD_LABELS_VI` for every spread (note horseshoe is 7, not 5). The enum/count work below is a no-op; this task is effectively the WEB radiogroup + any remaining route wiring only.

Originally assumed enum: `['three-card', 'celtic-cross']`, to add `single`, `diamond`, `moon`, `horseshoe`.

- [ ] **Step 1: Confirm contract coverage for the spread values**

The four spreads already live in `tarotSpreadSchema` with card counts in `TAROT_SPREAD_CARD_COUNTS` (1 / 3 / 4 / 4 / 7 / 10). Confirm `us017-schemas.test.ts` asserts the schema accepts every spread and the draw request validates with matching card counts; add any missing case.

- [ ] **Step 2: Run contracts test**

Run: `pnpm -F @ziweiai/contracts test`
Expected: PASS (schema already accepts the values). Only fails if you tighten an assertion ahead of a gap.

- [ ] **Step 3: Verify service card-count map + prompt framing**

`SPREAD_POSITIONS` + `SPREAD_LABELS_VI` in `tarot-prompts.ts` and the service card-count map already cover all six spreads; the parameterized loop in `tarot-prompts.test.ts` pins per-spread labels. Spot-check for drift only — no enum extension is needed. Keep `pnpm why zod` single-version.

- [ ] **Step 4: Web radiogroup + e2e**

Add the four options to the spread selector (Vietnamese labels, roving tabindex pattern already used). Extend or add a Playwright assertion selecting a new spread by value.

- [ ] **Step 5: Validate**

Run: `pnpm -F @ziweiai/contracts test; pnpm -F @ziweiai/api test draws-tarot; pnpm -F @ziweiai/web check; pnpm -F @ziweiai/web test`
Expected: all PASS.

- [ ] **Step 6: Commit**

```
git add packages/contracts/src/chart/tarot-draw.ts packages/contracts/src/chart/us017-schemas.test.ts apps/api/src/modules/draws-tarot apps/web/src/lib/features/tarot
git commit -m "feat(tarot): add single/diamond/moon/horseshoe spreads (backlog #24)"
```

---

## Task 7: backlog #29 — Coin-toss animation for Luc Hao manual casting (web, tiny)

**Files:**
- Modify: the Luc Hao manual cast component under `apps/web/src/lib/features/...` (the DivinationForm manual-toss path on `/liuyao`)
- Test: component test (now possible via Task 5) + existing e2e

Scope: animate the six line tosses (CSS transform/opacity only, per design rules). No logic change to the cast result — animation is presentation over the existing manual toss values.

- [ ] **Step 1: Locate the manual toss UI**

Read the `/liuyao` route + DivinationForm manual path to find where the six tosses render.

- [ ] **Step 2: Add animation (transform/opacity only)**

Animate each line reveal; respect `prefers-reduced-motion` (no motion when reduced).

- [ ] **Step 3: Component/e2e check**

Run: `pnpm -F @ziweiai/web check; pnpm -F @ziweiai/web test`
Expected: PASS. Manual cast result unchanged.

- [ ] **Step 4: Commit**

```
git commit -am "feat(web): coin-toss reveal animation for Luc Hao manual cast (backlog #29)"
```

---

## Task 8: backlog #25 — B4 Palm-line overlay with MediaPipe JS (web, normal)

**Files:**
- Modify: `apps/web/src/lib/features/...` palm route (`/palm`)
- Add dep: `@mediapipe/tasks-vision` (pinned) — NOT any PyTorch/python palmistry lib

Heavier than the others; keep it last in the reading-features group. Confirm with user that client-side MediaPipe (browser bundle size) is acceptable before adding the dep.

- [ ] **Step 1: Confirm dep choice with user (bundle-size + client-only)**

MediaPipe tasks-vision is a sizable client dep. STOP and confirm before `pnpm add`.

- [ ] **Step 2: Add dep + hand-landmark detection over the uploaded palm image**

Draw a canvas/SVG overlay of detected hand landmarks/lines on top of the existing palm upload preview. No server change; no PyTorch.

- [ ] **Step 3: Validate**

Run: `pnpm -F @ziweiai/web check; pnpm -F @ziweiai/web build`
Expected: PASS; static build still succeeds (incl. Han scan).

- [ ] **Step 4: Commit**

```
git commit -am "feat(web): palm-line overlay via MediaPipe JS hand landmarks (backlog #25)"
```

---

## Task 9: backlog #21 — E2E shared test user collides under parallel runs

**Files:**
- Modify: `apps/web/tests/e2e/global-setup.ts`
- Modify: `apps/web/playwright.config.ts`

Root cause from US-020 notes: a single shared test user under full-suite parallelism hits per-user quota + auth rate limits.

- [ ] **Step 1: Reproduce**

Run: `pnpm -F @ziweiai/web e2e` (full suite, 2 repeats) and capture which specs flake under parallelism.

- [ ] **Step 2: Give each worker its own user OR serialize auth-heavy specs**

Prefer per-worker user provisioning in `global-setup.ts` keyed by `process.env.TEST_PARALLEL_INDEX`, falling back to the shared user. Keep the anon-signup idempotent helper.

- [ ] **Step 3: Validate non-flaky**

Run: `pnpm -F @ziweiai/web e2e` twice.
Expected: full suite green both runs, no flake.

- [ ] **Step 4: Commit**

```
git commit -am "test(e2e): per-worker test users to remove shared-user collisions (backlog #21)"
```

---

## Task 10: backlog #32 — Mgmt-API migrations not recorded in schema_migrations

**Files:**
- Create: `docs/deploy/migration-tracking.md` (or extend `docs/deploy/aws-lightsail.md`)
- Possibly: a small script under `scripts/` to backfill `schema_migrations` rows

This is operational drift, not app code. Resolve as a documented procedure + optional backfill.

- [ ] **Step 1: Confirm current drift**

List cloud `schema_migrations` vs `apps/api/supabase/migrations/*` and identify which versions were applied via Mgmt API but not recorded.

- [ ] **Step 2: Document the canonical apply path**

Write the rule: apply via `supabase db push`/CLI so the version is recorded; if Mgmt API is used, insert the matching `schema_migrations` row manually. Include the exact SQL.

- [ ] **Step 3: Close backlog #32 with the doc reference**

Run: `scripts\bin\harness-cli.exe backlog close --id 32 ...` (confirm flags).

---

## Task 11: backlog #33 — Matrix N/A-by-design vs unproven (doc convention)

**Files:**
- Already created: `docs/decisions/0025-proof-flag-semantics.md`
- Modify: `docs/HARNESS.md` (note the convention)

The CLI binary has no per-axis N/A flag and no in-repo Rust source to rebuild, so the resolution is a convention, not a feature.

- [ ] **Step 1: Add a short convention note to HARNESS.md**

State: a `0` proof flag means "N/A-by-design OR unproven"; the story's Validation table is authoritative; N/A axes must carry an evidence string saying so (per decision 0025).

- [ ] **Step 2: Close backlog #33 referencing decision 0025**

Run: `scripts\bin\harness-cli.exe backlog close --id 33 ...` (confirm flags).

---

## Self-review notes

- Ordering rationale: sync (0) -> free win already-done (#31) -> decision gate (#28) -> prompt-only low-risk (#22, #23) -> test infra that unblocks UI proof (#27) -> reading features (#24, #29, #25) -> test/ops debt (#21, #32, #33).
- #28 and #25 each carry an explicit user-confirmation gate (architecture / heavy dependency). Do not skip them.
- Each feature task ends green via the smallest relevant validation; full `turbo build`/`turbo test` only if a task touches shared packages.
- After each task: `story add`/`story update` with numeric proof, and a `trace` at the end of the batch (with `--friction`).
- Harness enum reminder: `backlog close` flag names are unverified here — run `--help` before the first close.
*** End Patch
