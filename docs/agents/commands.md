# Build / Test / Lint / Dev Commands

> Read this when: running build, test, lint, typecheck, or dev commands.

Run from repo root. pnpm@10.17.1, Node >=22, Turbo.

| Command | What it does |
|---|---|
| `pnpm install` | Install deps across workspace |
| `turbo build` | Build all packages in dependency order |
| `turbo test` | Test the whole workspace |
| `turbo typecheck` | Typecheck the whole workspace |
| `pnpm lint` | ESLint (`--max-warnings=0`) |
| `pnpm -F @ziweiai/api dev` | Run NestJS backend |
| `pnpm -F @ziweiai/api test` | Test backend (Vitest) |
| `pnpm -F @ziweiai/web dev` | Run SvelteKit web |
| `pnpm -F @ziweiai/web build` | Build static SPA to `build/` |
| `pnpm -F @ziweiai/web check` | svelte-check + tsc |
| `pnpm -F @ziweiai/web e2e` | Playwright E2E (stubbed); auto-starts api + web preview |
| `pnpm -F @ziweiai/web e2e:live` | Playwright E2E hitting real LLM providers (`@live` specs) |
| `pnpm why zod` | Confirm single zod v4 version |

## Playwright IS runnable here — do not skip it

The Playwright config (`apps/web/playwright.config.ts`) self-starts BOTH servers
via `webServer`: the NestJS api on `:3000` and the static web preview on `:4173`
(it builds the SPA first), then tears them down. You do NOT need to start any
server by hand. Because it builds the SPA, a cold run takes ~25-30s even for a
single spec; that latency is expected, not a failure.

When you change a web flow, actually run the affected spec and report the real
result. Do not claim "could not run Playwright" or "verified by logic only" —
the cost is just time, which never runs out here.

```bash
# one spec, single worker (fastest feedback; ~26s incl. SPA build)
pnpm -F @ziweiai/web exec playwright test smoke.spec.ts --workers=1
```

Notes:
- Run E2E from `apps/web` (or via `pnpm -F @ziweiai/web ...`), not repo root.
- `reuseExistingServer` is on outside CI, so a dev server already on `:3000`/`:4173`
  is reused instead of conflicting.
- `pnpm e2e` excludes `@live`; `pnpm e2e:live` runs the real-provider specs and
  flips the live-only server flags (annual report, conversation) on for that run.
- Tune workers with `E2E_WORKERS` (default 4; must be a positive integer).
