# Harness & Canonical Flow

> Read this when: starting any code task, running the harness CLI, or wrapping up a story/blocker on a normal/high-risk lane.

## Canonical Flow

**Non-negotiable**: `intent -> product contract -> feature intake -> story packet -> validation -> implementation -> decision captured`. Do NOT jump straight to code.

## Harness entrypoints

CLI: `scripts/bin/harness-cli.exe` (Windows; NOT `scripts/harness-cli.exe`). DB: `harness.db` (gitignored). Before work, read `docs/HARNESS.md` + `docs/FEATURE_INTAKE.md`. Run `.\scripts\bin\harness-cli.exe query matrix` to see current proof status.

## Task lifecycle

1. **START**: `intake` immediately to classify lane + link trace.
2. **PLAN**: `story add` (or update `US-NNN`) BEFORE writing code on normal/high-risk lanes.
3. **ARCH/BOUNDARY/NAMING change**: STOP, confirm with user -> `decision add` + `docs/decisions/NNNN-*.md`.
4. **IMPLEMENT -> VALIDATE**: real build/test/lint that go green -> `story update` with numeric proof flags.
5. **USER REDIRECT**: `intervention add` (type override/correction, source human).
6. **END**: `trace` (with `--friction`/`--errors` for standard tier). Blocker -> `backlog add`.

Done = code validated green + matrix updated + trace recorded.

## Story / feature intake details

When you receive a new spec/feature or start a story (normal/high-risk lane): assess & decompose, don't jump to code. Run `intake` to classify lane (tiny/normal/high-risk per `docs/FEATURE_INTAKE.md`), break into Epic/Story before coding. Each phase maps to `US-001..US-007`; stay within scope.

When you just finished a story or milestone: run real validation (unit/integration/E2E/browser smoke). Update proof: `story update --unit 1 --integration 1 ...` (numeric `1`/`0`) — never claim a pass you did not run.

When wrapping up or blocked (normal/high-risk lane): write `trace` at task end (success and failure, with `--friction`). Blocker -> `backlog add` instead of guessing.

## Enum cheat-sheet (SQLite CHECK — exact values only, verified 2026-06-25)

- `intake --type`: space-separated — `new spec` | `spec slice` | `change request` | `new initiative` | `maintenance request` | `harness improvement`. Do NOT pass underscore form.
- `--lane` / `--risk`: `tiny` | `normal` | `high-risk`. (`low` and `high_risk` invalid)
- `trace --outcome`: `completed` | `blocked` | `partial` | `failed`.
- `story --status`: `planned` | `in_progress` | `implemented` | `changed` | `retired`.
- `decision --status`: `proposed` | `accepted` | `superseded` | `rejected`.
- `backlog` status (via `close`): `proposed` | `accepted` | `implemented` | `rejected`.
- `intervention --type`: `correction` | `override` | `escalation` | `approval` (NOT `redirect`). `--source`: `human` | `reviewer` | `ci` | `agent` (NOT `user`).

## Syntax traps

- Story proof: numeric `1`/`0` (rejects `yes`/`no`).
- Trace flags: `--read` / `--changed` (NOT `--files-read`/`--files-changed`).
- `trace` requires: `--summary --outcome --agent --actions`; add `--friction`/`--errors` for standard tier. No linked intake -> `Lane: unknown`.
- `intervention` requires: `--type --description --source` (optional `--trace --story --impact`).

## Command reference

| Command (prefix `scripts/bin/harness-cli.exe`) | When |
|---|---|
| `query matrix` / `query matrix --numeric` | view proof status |
| `query backlog` / `query stats` | view friction / stats |
| `intake --type <type> --summary <text> --lane <lane>` | classify on task start |
| `story add --id US-NNN --title <text> --lane <lane> --verify "<cmd>"` | create story |
| `story update --id US-NNN --unit 1 --integration 1 --e2e 0 --platform 0` | update proof |
| `story verify US-NNN` | run story's verify command |
| `decision add --id NNNN-slug --title <text> --doc docs/decisions/<file>.md --notes <text>` | record decision |
| `trace --intake <n> --story US-NNN --summary <text> --outcome completed --agent <name> --actions <text> --read <files> --changed <files> --friction <text>` | record trace |
| `intervention add --type override --source human --description <text> --trace <n> --story US-NNN --impact <text>` | record user redirect |
| `backlog add --title <text> --pain <text> --risk tiny` | record friction |
