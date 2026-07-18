# packages/core - `@ziweiai/core`

Shared domain helpers used across the monorepo. Framework-agnostic utilities
for ziwei domain logic, confidence scoring, and text handling. Depends on
`iztro` (pinned 2.5.8).

## Layout

- `src/index.ts` - public export barrel.
- `src/ziwei` - ziwei domain helpers.
- `src/confidence` - confidence scoring utilities.
- `src/text` - text helpers.
- `src/types` - shared domain types.

## Conventions

- Keep helpers pure and side-effect-free; no framework or app imports.
- Put shapes that cross the api/web boundary in `@ziweiai/contracts`, not here.
  `core` is for reusable logic and internal domain types.
- Avoid duplicating logic that already exists in `astro-engine` or `contracts`.
- Pin `iztro` to the exact version shared with `astro-engine` to keep
  computation consistent.

## Validation

Run from this package (or `pnpm --filter @ziweiai/core <script>`):

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint . --max-warnings=0
pnpm test        # vitest run --passWithNoTests
pnpm build       # tsc -p tsconfig.json
```
