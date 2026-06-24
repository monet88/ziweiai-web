# apps/web - `@ziweiai/web`

SvelteKit 5 SPA (static adapter). Notion paper-calm theme (see root `DESIGN.md`
and `docs/decisions/0018`), Vietnamese-only UI. Talks
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
- `src/lib/components` - shared UI; `src/lib/theme` - Notion paper-calm tokens.
- `src/lib/i18n`, `src/lib/text` - Vietnamese copy and text helpers.
- `src/lib/env.ts` - typed env access; `src/test` - test setup.

## Conventions

- UI text is Vietnamese only. Route copy through `src/lib/i18n` / `src/lib/text`;
  do not hardcode user-facing strings inline.
- Theme is Notion paper-calm (canvas `#F6F5F4`, white surfaces, one structural
  accent `--color-accent-primary` Notion blue `#0075DE`; sticker palette is
  decorative-only). Use tokens from `src/lib/theme`; do not introduce new color
  systems. Self-host Inter via `@fontsource-variable/inter`; apply the DESIGN.md
  negative tracking on headings. Details: root `DESIGN.md`, `docs/decisions/0018`.
- All backend calls go through `src/lib/api-client` and are typed by
  `@ziweiai/contracts`. Do not fetch the API ad hoc from components.
- Wrap server state in `@tanstack/svelte-query`; keep components thin and push
  data logic into `src/lib/features/<domain>`.
- Use `PrimaryButton`'s `loading` prop bound to mutation/query pending states to handle form submissions and organically prevent double-submits.
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
