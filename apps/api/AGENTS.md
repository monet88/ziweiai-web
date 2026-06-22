# apps/api - `@ziweiai/api`

NestJS 11 backend. Exposes the HTTP API consumed by `apps/web`, runs the astro
computation engine, brokers AI explanation providers, and persists state to
Supabase/Postgres. Depends on `@ziweiai/astro-engine`, `@ziweiai/contracts`,
and `@ziweiai/core` (all `workspace:*`).

## Layout

- `src/main.ts` - bootstrap; `src/app.module.ts` - root module wiring.
- `src/modules/*` - feature modules (one folder per domain): `auth`,
  `charts`, `draws-tarot`, `explanations`, `fortune`, `history`, `pairings`,
  `quizzes-mbti`, `quotas`, `vision-face`, `vision-palm`, `vision-shared`.
- `src/providers/ai` - AI explanation providers and prompt builders
  (`*-explanation-provider.ts`, `build-*-prompt.ts`, router + system prompt).
- `src/database` - Supabase persistence gateway, idempotency, ownership,
  persistence lifecycle/migration, postgres timestamp helpers.
- `src/common` - cross-cutting: `entitlement`, `http`, `request-id.middleware.ts`.
- `src/config`, `src/health` - config loading and health checks.
- `scripts/dev-server.cjs` - local dev runner; `scripts/write-local-supabase-env.cjs`.

## Conventions

- Keep one module per domain. Add controllers/services/DTOs inside the relevant
  `modules/<domain>` folder; do not cross domain boundaries directly - go
  through providers/gateways.
- Validate request/response shapes against `@ziweiai/contracts` (Zod). Do not
  redefine shapes locally that already exist in contracts.
- AI providers go behind the router in `src/providers/ai`. A new provider means
  implementing the provider interface and registering it in
  `ai-providers.module.ts`; prompts live in dedicated `build-*-prompt.ts` files
  with matching tests.
- All persistence flows through `src/database` gateways. Respect ownership and
  idempotency helpers; do not query Supabase ad hoc from feature modules.
- Never log secrets, tokens, or Supabase keys. Use existing config patterns for
  credentials.

## Validation

Run from `apps/api`:

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint . --max-warnings=0
pnpm test        # vitest run
pnpm build       # nest build
```

Tests are colocated `*.test.ts` (vitest). Add or update tests when behavior
changes, especially for prompt builders, persistence, and entitlement logic.
