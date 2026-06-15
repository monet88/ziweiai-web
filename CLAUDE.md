# CLAUDE.md

`ziweiai-web` — fullstack monorepo: NestJS backend (`apps/api`) + SvelteKit SPA web (`apps/web`, in progress) + shared internal packages. Product: Tử Vi / astrology readings, client-only Supabase auth, AI explanations. Migrating from a legacy Expo app to Svelte 5 runes.

Reply to the user in **Vietnamese**. Keep code identifiers in the repo's existing conventions.

## Project map

```text
apps/
  api/                    # NestJS backend (+ supabase/ migrations inside)
  web/                    # SvelteKit SPA — Svelte 5 runes (in progress, Phase 2+)
packages/
  config/                 # tsconfig/base + eslint/base (no runtime dep)
  contracts/              # Zod schemas + types — SHARED by api + web (zod v4)
  core/                   # logic, pulls in iztro — SERVER-ONLY
  astro-engine/           # iztro + lunar-javascript + temporal — SERVER-ONLY
vendor/xuanshu-runtime/   # SERVER-ONLY runtime (LiuYao/DaLiuRen/QiMen bridge)
docs/
  product/                # product contract (overview, invariants, api-contract)
  stories/epics/          # story packets US-001..US-007 (1 packet / phase)
  decisions/              # durable decisions (0006 naming, 0007 boundary, ...)
SPEC.md                   # single source of truth — full 8-phase spec
.ref/ wiki/ raw/          # research (read-only, .ref gitignored)
scripts/bin/harness-cli.exe  # durable-layer CLI (intake/story/trace/matrix)
```

<important if="you are starting a code task in this repo">

Read the foundation in this order BEFORE editing code:

1. `SPEC.md` — single source of truth. Part A (context + 2 invariants + migrate map + API surface + React→Svelte mapping), Part B (web architecture, Sections 1–22), Part C (8 phases).
2. `docs/product/invariants.md` — 2 mandatory invariants (language + security). Violation = blocker.
3. `docs/HARNESS.md`, `docs/FEATURE_INTAKE.md`, `docs/ARCHITECTURE.md`, `docs/CONTEXT_RULES.md` — workflow + settled architectural decisions.
4. Story packet for the current phase: `docs/stories/epics/`. Run `scripts/bin/harness-cli.exe query matrix` to see proof status.
5. `docs/decisions/` if the task touches architecture / naming / boundary.

SPEC is the truth about *intent*. Code + tests are the truth about *behavior*. When they diverge, read `docs/decisions/0006-spec-vs-code-naming.md` then confirm the real names in `packages/contracts/src/`.

This repo runs a mandatory harness workflow (normal/high-risk lanes), in order: intake → story breakdown → (fix doc drift if any) → implement → validate + update matrix → trace; architecture change → decision. Each step's detail appears in context below. (The upstream CLAUDE.md references `docs/TOOL_REGISTRY.md` but that file is currently missing — logged to backlog.)
</important>

<important if="you need to run build / test / lint / typecheck / dev commands">

Run from the repo root. pnpm@10.17.1, Node >=22, Turbo.

| Command | What it does |
|---|---|
| `pnpm install` | Install deps across the whole workspace |
| `turbo build` | Build all packages in dependency order |
| `turbo test` | Test the whole workspace |
| `turbo typecheck` | Typecheck the whole workspace |
| `pnpm lint` | ESLint across the workspace (`--max-warnings=0`) |
| `pnpm -F @ziweiai/api dev` | Run the NestJS backend |
| `pnpm -F @ziweiai/api test` | Test the backend (Vitest) |
| `pnpm -F @ziweiai/web dev` | Run the SvelteKit web (Phase 2+) |
| `pnpm -F @ziweiai/web build` | Build the static SPA to `build/` |
| `pnpm -F @ziweiai/web check` | svelte-check + tsc |
| `pnpm why zod` | Confirm a single zod v4 version |
</important>

<important if="you just received a new spec/feature or are about to start a story (normal/high-risk lane)">

Assess & decompose, do NOT jump straight into code: take the spec (User Story + Acceptance Criteria), run `intake` to classify complexity/risk (lane tiny/normal/high-risk per `docs/FEATURE_INTAKE.md`), then break it down into concrete Epic/Story (product doc + story packet) before writing the first line of code. Each phase maps to one story `US-001..US-007`; stay within the chosen lane + story scope.
</important>

<important if="you find code that diverges from the docs/SPEC (e.g. schema name, behavior)">

Fix doc drift BEFORE coding: update the docs/SPEC/decision to match the code's truth FIRST, then implement the story. Keep docs alive. Known divergence pattern: `docs/decisions/0006-spec-vs-code-naming.md`.
</important>

<important if="you just finished implementing a story or milestone">

Mandatory verification loop: run real validation — unit / API integration / E2E / browser smoke, depending on the story. Update proof in the test matrix via `story update --unit 1 --integration 1 ...` (numeric booleans) using results from commands that **actually ran green** — never claim a pass you did not run.
</important>

<important if="you are wrapping up a task or hit a blocker (normal/high-risk lane)">

Record trace & friction backlog: write a `trace` at the end of each task (record both success and failure, with `--friction` when relevant). On a blocker (missing tool, incomplete environment) → `backlog add` instead of guessing; let the project evolve from collected defects. Record at the task/milestone level, not per individual edit.
</important>

<important if="you need to run harness-cli (intake / story / trace / matrix / decision / backlog)">

The CLI lives at `scripts/bin/harness-cli.exe` (NOT `scripts/harness-cli.exe`). In Git Bash on Windows, call it by relative path from the repo root: `scripts/bin/harness-cli.exe <command>`. `harness.db` is the durable layer (already initialized, gitignored).

Syntax traps confirmed on this repo:
- `--outcome` only accepts `completed | blocked | partial | failed` (CHECK constraint; other values → sqlite error).
- Story proof is a **numeric** boolean `1`/`0` — the CLI rejects `yes`/`no`.
- Trace flags are `--read` and `--changed` (NOT `--files-read`/`--files-changed`).
- `trace` requires at minimum `--summary --outcome --agent --actions`; add `--friction` (or `--errors`) to reach the `standard` tier the normal lane requires.
- Backlog lane uses `--risk tiny|normal|high-risk` (`low` is invalid).

| Command (prefix `scripts/bin/harness-cli.exe`) | When |
|---|---|
| `query matrix` | view proof status of all stories (read before starting) |
| `query matrix --numeric` | get proof as `1/0` to copy back into `story update` |
| `query backlog` / `query stats` | view friction / stats |
| `intake --type <type> --summary <text> --lane <lane>` | record IMMEDIATELY on task intake (type: spec-slice/change-request/maintenance/...; lane: tiny/normal/high-risk) |
| `story add --id US-NNN --title <text> --lane <lane> --verify "<cmd>"` | create a new story packet |
| `story update --id US-NNN --unit 1 --integration 1 --e2e 0 --platform 0` | update proof after validating |
| `story verify US-NNN` | run the story's configured verify command |
| `decision add --id NNNN-slug --title <text> --doc docs/decisions/<file>.md --notes <text>` | record a durable decision (with markdown file) |
| `trace --intake <n> --story US-NNN --summary <text> --outcome completed --agent <name> --actions <text> --read <files> --changed <files> --friction <text>` | record a trace at task end |
| `backlog add --title <text> --pain <text> --risk tiny` | record friction when found |
</important>

<important if="you are adding an import / dependency to apps/web">

`apps/web` may only import `@ziweiai/contracts` from the internal workspace. NEVER import `@ziweiai/core`, `@ziweiai/astro-engine`, `iztro`, `lunar-javascript` — they pull the chart-calculation engine + ephemeris + Han characters into the client bundle. ESLint `no-restricted-imports` blocks this at lint time. If you need a small constant/regex from core (e.g. `CJK_TEXT_PATTERN`) → copy the value into `apps/web/src/lib/text/cjk.ts`, do NOT import core. Details: `docs/decisions/0007-web-server-boundary.md`.
</important>

<important if="you are writing code that displays labels, palace/star names, or handles a chart snapshot on the web">

Language invariant: the frontend NEVER contains Han characters — all labels are Vietnamese. `translateZiweiKey` is fail-fast (missing key → throw; silent fallback to Han is forbidden). Legacy v1 snapshots have a Han `displayName` → guard with `CJK_TEXT_PATTERN` + fallback `"Thuật ngữ cũ"`. Every UI output must pass the `\p{Script=Han}` scan test. Details: `docs/product/invariants.md`.
</important>

<important if="you are handling env / secrets / config variables">

Only `PUBLIC_*` is exposed to the client bundle: `PUBLIC_API_BASE_URL`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`. Server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `DEEPSEEK_API_KEY`, `GEMINI_API_KEY`, `OPENAI_COMPAT_API_KEY`, geocoding key) live only in `apps/api`. The web reads env via `$env/static/public`, never `process.env`. Never commit a real `.env`.
</important>

<important if="you are calling the backend API or parsing a response on the web">

5 endpoints: `GET /health` (public), `POST /charts`, `GET /charts/:id`, `POST /explanations`, `GET /history?limit=N` (all Bearer). Every response the UI uses must be `parse()`d with a schema from `@ziweiai/contracts` (camelCase names: `historyListResponseSchema`, `chartDetailResponseSchema`, ...) — do NOT define your own DTOs on the web. api-client uses flat functions (`fetchHealth`/`createChart`/`fetchChartDetail`/`createExplanation`/`fetchHistory`). Token = `session.access_token` sent via `Authorization: Bearer`, read from the auth store right before each request (do not snapshot at mount). Details: `docs/product/api-contract.md`.
</important>

<important if="you are writing or editing .svelte / .svelte.ts files (rewrite from React/Expo)">

Svelte 5 runes: `useState`→`$state`, `useMemo`→`$derived`, `useQuery`→`createQuery`, `useMutation`→`createMutation`, Context→`setContext`/`getContext`, `useRouter`→`goto`. Do NOT mechanically port `useEffect` to `$effect` — many React effects should become `$derived` or event handlers. `createQuery` must wrap options in a function: `createQuery(() => ({ ... }))` to preserve reactivity. Styling: scoped CSS + `var(--*)`, NO Tailwind. The React source for reference lives in the original repo `F:/CodeBase/ziweiai/apps/app/` (not present in this repo). Full mapping: SPEC.md Part A8.
</important>

<important if="you are asked to change architecture, a boundary, a naming contract, or an invariant">

Stop and confirm with the user first. Record a durable decision IMMEDIATELY: create `docs/decisions/NNNN-*.md` from `docs/templates/decision.md` + `harness-cli.exe decision add` (the durable layer remembers *why* the project went this way). Do not loosen the `translateZiweiKey` fail-fast, do not disable the Han scan test, do not loosen the web's import boundary on your own.
</important>
