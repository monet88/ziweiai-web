# Web Boundaries, Contracts, Env & Svelte

> Read this when: writing/editing `apps/web` code, adding web imports, displaying
> labels/star names, handling chart snapshots, calling the backend API, parsing
> responses, handling env/secrets, or rewriting React/Expo into `.svelte` files.

## Web import boundary

`apps/web` may only import `@ziweiai/contracts`. NEVER import `@ziweiai/core`,
`@ziweiai/astro-engine`, `iztro`, `lunar-javascript` — they pull server-only
code into the client bundle. ESLint `no-restricted-imports` enforces this. Need
a constant from core → copy value into `apps/web/src/lib/text/cjk.ts`. Details:
`docs/decisions/0007-web-server-boundary.md`.

## Labels, star names, chart snapshots (no Han on frontend)

Frontend NEVER contains Han characters — all labels Vietnamese.
`translateZiweiKey` is fail-fast (missing key → throw). Legacy v1 snapshots:
guard Han `displayName` with `CJK_TEXT_PATTERN` + fallback `"Thuật ngữ cũ"`. UI
must pass `\p{Script=Han}` scan. Details: `docs/product/invariants.md`.

## Env / secrets / config

Client: `PUBLIC_API_BASE_URL`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`
(via `$env/static/public`). Server secrets (`SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_JWT_SECRET`, `DEEPSEEK_API_KEY`, `GEMINI_API_KEY`,
`OPENAI_COMPAT_API_KEY`, geocoding key) → `apps/api` only. Never `process.env`
on web. Never commit `.env`.

## Backend API + response parsing

5 endpoints: `GET /health` (public), `POST /charts`, `GET /charts/:id`,
`POST /explanations`, `GET /history?limit=N` (Bearer). Parse every response with
`@ziweiai/contracts` schemas (camelCase: `historyListResponseSchema`,
`chartDetailResponseSchema`, ...) — no custom DTOs. Api-client: flat functions
(`fetchHealth`/`createChart`/`fetchChartDetail`/`createExplanation`/`fetchHistory`).
Token = `session.access_token` via `Authorization: Bearer`, read from auth store
before each request. Details: `docs/product/api-contract.md`.

## Svelte 5 rewrite (React/Expo → runes)

**All code must use Svelte 5.**

Runes mapping: `useState`→`$state`, `useMemo`→`$derived`, `useQuery`→`createQuery`,
`useMutation`→`createMutation`, Context→`setContext`/`getContext`, `useRouter`→`goto`.
Don't port `useEffect` to `$effect` mechanically — prefer `$derived` or event
handlers. `createQuery` wraps options in a function: `createQuery(() => ({ ... }))`.
Styling: scoped CSS + `var(--*)`, NO Tailwind. React source:
`F:/CodeBase/ziweiai/apps/app/`. Full mapping: SPEC.md Part A8.

### Svelte MCP Server

ALWAYS use Svelte MCP server tools when working with Svelte code:
1. `list-sections` → understand available docs
2. `get-documentation` → fetch Svelte 5 docs for your task
3. `svelte-autofixer` → validate and fix components before sending code

If MCP server unavailable, tell the user to enable it.
