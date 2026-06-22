# apps/web - `@ziweiai/web`

SvelteKit 5 SPA (static adapter). Dark + gold theme, Vietnamese-only UI. Talks
to `@ziweiai/api` over HTTP, authenticates via Supabase, and shares request and
response shapes through `@ziweiai/contracts` (`workspace:*`). Server state is
managed with `@tanstack/svelte-query`.

## Layout

- `src/routes/(app)/*` - authenticated product surfaces, one folder per system:
  `bazi`, `charts`, `daliuren`, `face`, `hepan`, `history`, `liuyao`,
  `mangpai`, `mbti`, `meihua`, `palm`, `pricing`, `qimen`.
- `src/routes/sign-in` - auth entry; `src/routes/ui-sandbox` - component sandbox.
- `src/lib/features/*` - feature logic per domain: `birth-profile`, `chart`,
  `dashboard`, `explanation`, `fortune`, `hepan`, `history`, `mbti`,
  `system-registry`, `vision`.
- `src/lib/api-client` - typed API client; `src/lib/query-client.ts` - query setup.
- `src/lib/auth`, `src/lib/supabase` - auth/session and Supabase client.
- `src/lib/components` - shared UI; `src/lib/theme` - dark+gold tokens.
- `src/lib/i18n`, `src/lib/text` - Vietnamese copy and text helpers.
- `src/lib/env.ts` - typed env access; `src/test` - test setup.

## Conventions

- UI text is Vietnamese only. Route copy through `src/lib/i18n` / `src/lib/text`;
  do not hardcode user-facing strings inline.
- Theme is dark + gold (bg `#0B0B0D`, accent `#C8B780`). Use tokens from
  `src/lib/theme`; do not introduce new color systems.
- All backend calls go through `src/lib/api-client` and are typed by
  `@ziweiai/contracts`. Do not fetch the API ad hoc from components.
- Wrap server state in `@tanstack/svelte-query`; keep components thin and push
  data logic into `src/lib/features/<domain>`.
- Add a new product system as a `routes/(app)/<system>` folder plus a matching
  `lib/features/<system>` module, and register it via `system-registry`.
- Svelte 5 runes only (`$state`, `$derived`, `$props`, `$effect`). Follow the
  repo Svelte skills for component patterns.

## Validation

Run from `apps/web`:

```bash
pnpm check       # svelte-kit sync && svelte-check
pnpm typecheck   # svelte-kit sync && tsc --noEmit
pnpm lint        # eslint . --max-warnings=0
pnpm test        # vitest run
pnpm e2e         # playwright test
pnpm build       # vite build
```

E2E uses request interception with stable value slugs (Playwright). Add or
update specs when a product flow changes; keep tabs centered via the shared
container layout.
