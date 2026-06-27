# Architecture / Boundary / Naming / Invariant Changes

> Read this when: you are asked to change architecture, a boundary, a naming
> contract, or an invariant; or when code diverges from docs/SPEC.

## Confirm + record durable decision

Stop and confirm with user. Record durable decision: `docs/decisions/NNNN-*.md`
plus `harness-cli.exe decision add`. Do not loosen `translateZiweiKey`
fail-fast, the Han scan test, or the web import boundary on your own.

## Doc drift comes first

If you find code that diverges from docs/SPEC (e.g. schema name, behavior), fix
doc drift BEFORE coding: update docs/SPEC/decision to match code's truth FIRST.
Known pattern: `docs/decisions/0006-spec-vs-code-naming.md`.
