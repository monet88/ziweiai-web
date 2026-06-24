# packages - shared workspace libraries

Shared `workspace:*` packages consumed by `apps/api` and `apps/web`. These are
the contract and engine layer of the monorepo: keep them framework-agnostic
(no NestJS, no SvelteKit imports) and treat their public exports as stable
surfaces. A breaking change here ripples into both apps.

## Packages

- `contracts` (`@ziweiai/contracts`) - Zod schemas and shared types: the
  source of truth for API request/response, chart, explanation, horoscope,
  persistence, and quiz shapes. Dual ESM/CJS build (`src/api`, `src/chart`,
  `src/explanations`, `src/horoscope`, `src/persistence`, `src/quizzes`).
  Anything crossing the api/web boundary is defined here, not in an app.
- `astro-engine` (`@ziweiai/astro-engine`) - astrology/chart computation
  (ziwei horoscope, mangpai, hepan compatibility) on top of `iztro` and
  `lunar-javascript`. Server-only entry (`src/server-only.ts`); has `adapters`,
  `normalization`, and `fixtures`. Depends on `contracts`.
- `core` (`@ziweiai/core`) - domain helpers shared across apps: `ziwei`,
  `confidence`, `text`, and shared `types`.
- `config` (`@ziweiai/config`) - shared tooling config exported as
  `./tsconfig/base` and `./eslint/base`. No runtime code.

## Conventions

- `contracts` is the canonical shape layer. Define a shape once here and import
  it; never duplicate or redefine it inside an app.
- Keep dependencies one-directional: apps depend on packages, and within
  packages `astro-engine` and `core` may depend on `contracts`. Do not import
  app code or create cycles between packages.
- Keep these packages framework-agnostic and side-effect-free. Engine code that
  must stay server-side belongs behind the `server-only` entry of
  `astro-engine`.
- Changing an exported type or schema is a breaking change - check both apps
  (and update them in the same change) before landing.

## Validation

Per package (`pnpm --filter @ziweiai/<name> <script>`), or from a package dir:

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint . --max-warnings=0
pnpm test        # vitest run (astro-engine/core: --passWithNoTests)
pnpm build       # tsc build; contracts also emits ESM + writes esm pkg
```

`config` has no scripts. After changing `contracts`, build it before
typechecking the apps so they resolve the updated `dist` types.
