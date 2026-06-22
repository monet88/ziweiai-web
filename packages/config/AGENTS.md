# packages/config - `@ziweiai/config`

Shared tooling configuration for the monorepo. No runtime code: it only exports
base configs that other packages and apps extend. Consumed as `workspace:*`.

## Exports

- `@ziweiai/config/tsconfig/base` -> `./tsconfig/base.json`
- `@ziweiai/config/eslint/base` -> `./eslint/base.js`

## Conventions

- This package defines shared defaults. Apps/packages extend these in their own
  `tsconfig.json` / eslint config rather than copying rules around.
- Change here only when a rule should apply repo-wide. A change ripples into
  every package and app, so confirm the broader impact first.
- No build/test/lint scripts; there is nothing to compile.

## Validation

No package scripts. After editing a base config, validate by running
`typecheck` / `lint` in the packages or apps that consume it to confirm the
change resolves and does not break existing code.
