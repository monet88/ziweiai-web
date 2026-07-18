# packages/contracts - `@ziweiai/contracts`

Canonical shape layer for the monorepo. Zod schemas and shared TypeScript types
that define every contract crossing the api/web boundary. Consumed by both
`apps/api` and `apps/web` as `workspace:*`. Dual ESM/CJS build. Depends only on
`zod`; no framework or app imports.

## Layout

- `src/index.ts` - barrel export; the public surface.
- `src/api` - request/response contracts for HTTP endpoints.
- `src/chart` - chart payload shapes.
- `src/explanations` - AI explanation request/result shapes.
- `src/horoscope` - horoscope/astro result shapes.
- `src/persistence` - persisted record shapes.
- `src/quizzes` - quiz (MBTI) shapes.
- `src/health.ts` (+ test) - health contract.

## Conventions

- Define a shape once here and import it everywhere; never redefine or duplicate
  these shapes inside an app.
- Export from the relevant subfolder and re-export through `src/index.ts`. Keep
  the public surface intentional.
- Schemas are the source of truth: derive types via `z.infer`, do not maintain
  parallel hand-written interfaces.
- Changing or removing an exported schema/type is a breaking change. Update both
  apps in the same change and rebuild before typechecking them.
- Stay framework-agnostic and side-effect-free.

## Validation

Run from this package (or `pnpm --filter @ziweiai/contracts <script>`):

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint . --max-warnings=0
pnpm test        # vitest run
pnpm build       # tsc (cjs) + tsc esm + write-esm-pkg.cjs
```

Build emits both `dist/` (CJS) and `dist/esm/`. Rebuild after schema changes so
downstream apps resolve updated `dist` types.
