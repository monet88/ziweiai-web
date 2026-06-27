# docs/agents — Routed Agent Rules

These files hold the detailed, task-specific agent rules that used to live in
the root `AGENTS.md`. The root `AGENTS.md` (and identical `CLAUDE.md`) is now a
compact router; load only the doc that matches the task at hand.

| Doc | Read this when |
|---|---|
| `harness.md` | Starting any code task, running harness-cli, classifying a lane, or wrapping up a story/blocker (canonical flow, lifecycle, enum cheat-sheet, command reference) |
| `commands.md` | Running build / test / lint / typecheck / dev commands |
| `web-boundaries.md` | Writing/editing `apps/web`, adding web imports, displaying labels/star names, handling chart snapshots, calling the API, parsing responses, env/secrets, or rewriting React/Expo into `.svelte` |
| `architecture-changes.md` | Changing architecture, a boundary, a naming contract, or an invariant; or when code diverges from docs/SPEC |
| `execplans.md` | Authoring or maintaining an `execplan.md` (living design doc) for a complex feature or significant refactor — Progress / Surprises / Decision Log / Outcomes that survive context loss |
| `deploy.md` | Deploying, redeploying, shipping to production, or SSHing into the prod host |

Keep this folder in sync with the root entrypoint when rules change.
