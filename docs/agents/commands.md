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
| `pnpm why zod` | Confirm single zod v4 version |
