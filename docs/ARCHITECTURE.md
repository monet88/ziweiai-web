# Architecture

This document orients a newcomer to the ZIWEI AI codebase: where each thing lives, and
what is deliberately true about it. It describes the code as it exists today. For the
reasoning behind a given boundary, follow the `docs/decisions/NNNN-*.md` ADR named in each
section.

## Bird's Eye View

On the highest level, ZIWEI AI accepts a person's **birth data** (or a divination cast
request, an uploaded face/palm image, or a chat message) and produces a **Vietnamese-language
reading**: a normalized chart snapshot plus an AI-generated narrative, persisted so it can be
reopened from history.

The ground state the client submits is small: birth date/time/gender, a cast question, an
image, or a chat turn. From that, the server computes the derived state. A **chart snapshot**
is calculated by the astrology engine (iztro + lunar calendar + the xuanshu runtime), then
normalized into an ASCII-slug schema that carries no Han characters. An **AI explanation** is
generated lazily and on demand: a chart is computed up front, but its narrative is produced
only when the user asks for a palace/overview reading, and conversation replies stream token
by token. Snapshots and explanations are persisted to Supabase (Postgres + storage); the web
client holds only what the current view needs and re-fetches by id.

The system is a pnpm + Turbo monorepo: a NestJS API, a SvelteKit single-page app, and four
internal packages they share. The spine is a one-way dependency flow from shared schemas, to
the server-only compute packages, to the API that orchestrates them, out to a browser client
that is deliberately kept ignorant of how charts are computed.

## Code Map

Entries are ordered by data flow: shared contracts, then server-only compute, then the API
that orchestrates, then the browser client, then the supporting runtime and tooling. Pay
attention to the **Architecture Invariant** notes; several name things that are absent on
purpose. Two modules are marked as **API Boundaries**.

### `packages/config`

Base `tsconfig` and `eslint` fragments every other package extends. Pure configuration.

**Architecture Invariant:** this package has no runtime dependencies and ships no runtime
code. Nothing imports a value from it.

### `packages/contracts`

Zod v4 schemas for every shape that crosses a boundary: HTTP request/response bodies, the
normalized chart snapshot, persistence rows, explanation context, quiz and horoscope shapes.
Depends only on `zod`.

`@ziweiai/contracts` is an **API Boundary.** It is the one package both `apps/api` and
`apps/web` import, and it exists so the two can never drift apart: the server validates with
the same schema the client parses against. It is published dual ESM+CJS (decision 0008) so
both a Vite browser build and a NestJS CommonJS runtime can consume it.

**Architecture Invariant:** snapshot schemas use ASCII slug keys and carry no Han characters.
Normalization happens before data reaches a contract, so anything that parses clean here is
already safe to show in the Vietnamese-only UI.

### `packages/core`

Domain logic that is not the ephemeris itself: confidence scoring, the CJK text guard, ziwei
lunar-date helpers, and the Han-to-Vietnamese token map. Depends on `iztro` only.

**Architecture Invariant:** server-only. Because it pulls in `iztro` and hundreds of Han
string literals, it must never enter a client bundle. It does **not** depend on
`@ziweiai/contracts` — it is a leaf utility layer, not a step in the contract chain.

### `packages/astro-engine`

The astrology engine: turns birth/cast input into a chart snapshot via `iztro`,
`lunar-javascript`, and the Temporal polyfill, with adapters that bridge to the vendored
xuanshu runtime for Luc Hao / Dai Luc Nham / Qi Men. Normalization (`src/normalization`) maps
raw engine output into the contract's ASCII-slug snapshot; `src/fixtures` pins known charts
for snapshot tests. Depends on `@ziweiai/contracts` + `iztro` + `lunar-javascript` + Temporal.

**Architecture Invariant:** server-only, and it says so in code. `src/server-only.ts` throws
on import (`Astrology engine is server-only and must not be bundled into client apps.`), so a
packaging mistake fails loudly rather than silently shipping ephemeris data to the browser.

### `apps/api`

The NestJS server and the only place that knows the HTTP protocol, Supabase, and the AI
providers. One feature module per capability under `src/modules` (charts, conversations,
divinations, draws-tarot, explanations, fortune, history, pairings, quizzes-mbti, vision-face,
vision-palm, quotas, auth), wired in `app.module.ts`. `src/providers/ai` holds the LLM
integration: a provider router that tries OpenAI-compatible / Gemini / DeepSeek backends, the
per-system prompt builders, and the streaming conversation path. `src/database` is the
Supabase persistence gateway (idempotency, ownership checks, timestamp handling).

**Architecture Invariant:** untrusted data is parsed with a `@ziweiai/contracts` schema before
it reaches inner code — HTTP bodies, Supabase JWT claims, environment variables, and rows read
back from Supabase. Inner services receive already-valid types and do not re-validate.

**Architecture Invariant:** an assistant reply is persisted only after the provider stream
finishes; a failed or aborted generation never leaves a partial assistant message in the
conversation (decisions 0019, 0026). A client disconnect cancels the upstream fetch but still
keeps whatever text already arrived (decision 0026).

### `apps/web`

The SvelteKit SPA — the browser client and the only thing that knows the in-app navigation,
TanStack Query caching, and Supabase auth session. `src/routes/(app)` is one route per system
(`/bazi`, `/meihua`, `/liuyao`, `/tarot`, `/face`, `/palm`, `/mbti`, `/hepan`, ...) plus the
chart-detail route `charts/[chartId]`. `src/lib/features` holds the feature UIs;
`src/lib/api-client` is the typed fetch layer that parses every response through contracts.
Built with `adapter-static` (fallback `index.html`): no SSR, a pure static SPA.

**Architecture Invariant:** `apps/web` talks to the engine only over HTTP. It must not import
`@ziweiai/core`, `@ziweiai/astro-engine`, `iztro`, or `lunar-javascript`; the boundary is
enforced at lint time (see Dependency Rule below), not by convention. When the client needs a
constant that lives in core (e.g. `CJK_TEXT_PATTERN`), the value is **copied** into
`src/lib/text/cjk.ts`, never imported (decision 0007).

**Architecture Invariant:** the UI is Vietnamese-only Latin text. No Han/CJK characters reach
the screen; `containsCjkText` guards free-text from the model and legacy snapshot labels fall
back to a safe Vietnamese string.

### `vendor/xuanshu-runtime`

A vendored, server-only runtime bridged from `packages/astro-engine/src/adapters/xuanshu-*`
to compute Luc Hao, Dai Luc Nham, and Qi Men. It is excluded from lint and is reached only
through the engine adapters, never directly by application code.

### `docs/decisions`

The architecture decision records (ADR 0001-0026). When a boundary, naming rule, or invariant
in this map needs its "why", the ADR named in the section is the source of truth.

## Dependency Rule (enforced at lint time)

`apps/web` may not import `@ziweiai/core`, `@ziweiai/astro-engine`, `iztro`, or
`lunar-javascript`. The `no-restricted-imports` rule in the root `eslint.config.mjs` (scoped to
`apps/web/**`) blocks all four, by package name and by path pattern, and the workspace lints
with `--max-warnings=0`. The reason is twofold: those packages drag the ephemeris and hundreds
of Han literals into the client bundle, violating both the client/server boundary and the
Vietnamese-only language invariant (decision 0007).

## Parse-First Boundary Rule

Foreign data is parsed with a `@ziweiai/contracts` schema before it enters inner code: HTTP
request/response, identity claims (Supabase JWT), environment, and rows returned by the
Supabase client. The web app defines no DTOs of its own — every response the UI consumes is
`parse()`d through contracts (see `docs/product/api-contract.md`). The engine runs server-side
only; the web receives an already-normalized `chartSnapshotSchema` (ASCII slug keys, no Han).

## Cross-Cutting Concerns

### Testing

Unit and integration tests run on Vitest (`turbo run test`); both packages and the API keep
colocated `*.test.ts` files. The web app adds Playwright end-to-end tests under
`apps/web/tests/e2e`, split into two suites by tag: `pnpm e2e` runs the default suite against a
deterministic stub, and `pnpm e2e:live` runs the `@live` suite that calls the real LLM
provider. Parallelism is set by `E2E_WORKERS` (default 4); each worker provisions its own test
user so concurrent runs do not collide on per-user quota or rate limits.

**Architecture Invariant:** the default `pnpm e2e` suite is deterministic and burns no LLM
tokens — provider calls are stubbed. Only the explicitly tagged `@live` suite spends tokens,
so the everyday test loop is reproducible and free.

### Error Handling

The API maps failures to a stable envelope `{ code, message, requestId }` (`apiErrorSchema`),
applied globally by `ApiErrorFilter`. Non-typed errors are logged server-side and returned as a
generic Vietnamese message so internal detail (stack, DSN, credentials) never reaches the
client. The CORS callback refuses unknown origins by silently omitting the allow header rather
than throwing, so a stray origin cannot turn every request (including public `/health`) into a
500.

### Observability

`request-id.middleware.ts` tags every request with a request id that flows into the error
envelope, so a client-visible failure can be traced to a server log line. The error-code map
lives in `docs/product/api-contract.md`.

---

> Note: this document is written in English/ASCII to match the repo's agent-facing doc
> convention (`AGENTS.md`). User-facing web copy remains Vietnamese.
