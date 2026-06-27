# Exec Plan

This ExecPlan is a living document. Keep the `Progress`, `Surprises &
Discoveries`, `Decision Log`, and `Outcomes & Retrospective` sections current as
work proceeds; a fresh agent with only this file and the working tree should be
able to resume. Maintain it per `docs/agents/execplans.md`.

## Goal

What outcome are we trying to produce?

## Scope

In scope:

- Item.

Out of scope:

- Item.

## Risk Classification

Risk flags:

- Flag.

Hard gates:

- Gate.

## Work Phases

1. Discovery.
2. Design.
3. Validation planning.
4. Implementation.
5. Verification.
6. Harness update.

## Progress

Checkbox list of granular steps with UTC timestamps. Record every stopping
point; split a half-done item into "done" vs "remaining". Must reflect the real
current state.

- [ ] (YYYY-MM-DDTHH:MMZ) Example step.
- [ ] Example partial step (completed: X; remaining: Y).

## Surprises & Discoveries

Unexpected behavior, bugs, perf tradeoffs, insights — with short evidence.

- Observation: …
  Evidence: …

## Decision Log

In-plan construction journal. Durable architectural decisions also go to
`docs/decisions/NNNN-*.md` + `harness-cli.exe decision add`; link the id here.

- Decision: …
  Rationale: …
  Date/Author: …

## Outcomes & Retrospective

At each major milestone or completion: what was achieved, what remains, lessons
learned, measured against Goal.

## Stop Conditions

Pause for human confirmation if:

- Product behavior is ambiguous.
- Data migration or deletion risk appears.
- Validation requirements need to be weakened.
- Architecture direction changes.
