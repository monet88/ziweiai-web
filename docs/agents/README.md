# docs/agents — Routed Agent Rules

These files hold detailed, task-specific agent rules. The root `AGENTS.md` is
the current repo-wide router for Codex work; load the matching document here
only when the task touches that area.

| Doc | Read this when |
|---|---|
| `harness.md` | Starting any code task, running harness-cli, classifying a lane, or wrapping up a story/blocker (canonical flow, lifecycle, enum cheat-sheet, command reference) |
| `commands.md` | Running build / test / lint / typecheck / dev commands |
| `web-boundaries.md` | Writing/editing `apps/web`, adding web imports, displaying labels/star names, handling chart snapshots, calling the API, parsing responses, env/secrets, or rewriting React/Expo into `.svelte` |
| `architecture-changes.md` | Changing architecture, a boundary, a naming contract, or an invariant; or when code diverges from docs/spec |
| `execplans.md` | Authoring or maintaining an `execplan.md` (living design doc) for a complex feature or significant refactor — Progress / Surprises / Decision Log / Outcomes that survive context loss |
| `deploy.md` | Deploying, redeploying, shipping to production, or SSHing into the prod host |

Keep this folder in sync with the root entrypoint when rules change.
