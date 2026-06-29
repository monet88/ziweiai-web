# apps/web - `@ziweiai/web`

SvelteKit 5 SPA (static adapter). Vietnamese-only UI. The legacy visual base is
Notion paper-calm (see root `DESIGN.md` and `docs/decisions/0018`), but the
active website redesign direction is the restrained monochrome astrology product
language captured in `docs/decisions/0031-luvsa-inspired-web-redesign-direction.md`.
Talks
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
- Theme direction is currently transitional. Existing routes may still use
  Notion paper-calm tokens (canvas `#F6F5F4`, white surfaces, one structural
  accent `--color-accent-primary` Notion blue `#0075DE`; sticker palette
  decorative-only), while redesigned routes should follow decision `0031`:
  restrained monochrome astrology product UI, product workflow first, no
  marketing-only landing page. Use `src/lib/theme` tokens where possible; add
  local route styling for redesign slices before replacing global tokens. Self-host
  Inter via `@fontsource-variable/inter`; keep heading tracking intentional.
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


Important: `pnpm e2e` (Playwright) IS runnable locally and in this environment.
The Playwright config (`apps/web/playwright.config.ts`) auto-starts BOTH the api
(`:3000`) and the web preview (`:4173`) via its `webServer` block and tears them
down afterwards, so you do NOT need to start servers yourself. A full run builds the
static SPA first, so allow ~30s+ even for a single spec. Do not skip e2e or claim it
`cannot run` here: run the real test (for a quick check, `pnpm exec playwright test
smoke.spec.ts --workers=1`) and report the actual result. The `@live` group
(`pnpm e2e:live`) additionally calls real LLM providers; the default `pnpm e2e`
stubs them and needs no API keys.
