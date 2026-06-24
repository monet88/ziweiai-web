# packages/astro-engine - `@ziweiai/astro-engine`

Astrology and chart computation engine. Wraps `iztro` and `lunar-javascript`
to produce ziwei horoscopes, mangpai readings, and hepan compatibility.
Server-only: meant to run in the API, not the browser. Depends on
`@ziweiai/contracts` (`workspace:*`).

## Layout

- `src/index.ts` - public export barrel.
- `src/server-only.ts` - server-only entry (default export target); engine code
  that must not ship to the client lives behind this.
- `src/ziwei-horoscope.ts` (+ test) - ziwei horoscope computation.
- `src/mangpai-reading.ts` (+ test) - mangpai reading.
- `src/hepan-compatibility.ts` (+ test) - hepan (compatibility) logic.
- `src/adapters` - adapters over `iztro` / `lunar-javascript`.
- `src/normalization` - input/output normalization.
- `src/fixtures` - shared test fixtures.

## Conventions

- Keep this server-side. Do not add browser/DOM or framework dependencies; the
  `server-only` entry is the boundary.
- Express inputs and outputs with `@ziweiai/contracts` shapes; do not invent
  parallel result types here.
- Isolate third-party quirks (`iztro`, `lunar-javascript`) inside `adapters`
  and `normalization` so domain logic stays clean and testable.
- Pin astro libs to exact versions (`iztro` 2.5.8, `lunar-javascript` 1.7.7);
  computation output is sensitive to library version. Do not bump casually.
- Use `fixtures` for deterministic tests; cover new computation paths.

## Validation

Run from this package (or `pnpm --filter @ziweiai/astro-engine <script>`):

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint . --max-warnings=0
pnpm test        # vitest run --passWithNoTests
pnpm build       # tsc -p tsconfig.json
```
