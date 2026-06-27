# ExecPlans (living design docs)

> Read this when: you are about to author or execute a normal/high-risk story
> packet's `execplan.md`, or any time a feature is complex enough that a single
> stateless agent (no memory of prior turns) must be able to resume it from the
> plan file alone.

An ExecPlan is the `execplan.md` inside a story packet
(`docs/stories/epics/EXX-.../execplan.md`). It is a self-contained, living
design document: a complete novice with only the current working tree and this
one file must be able to deliver a demonstrably working change. This doc adapts
the OpenAI Codex "ExecPlan" guidance to our harness; it does NOT introduce a
root `PLANS.md` and does NOT replace the Canonical Flow.

## How this fits the Canonical Flow

The ExecPlan is the design+progress layer that lives *inside* an existing story
packet. It does not bypass `intent -> product contract -> feature intake ->
story packet -> validation -> implementation -> decision captured`. You still
run `intake` to classify the lane, still `story add/update` with numeric proof,
still `trace` at the end. The ExecPlan is where the design reasoning and the
running progress live so the work can survive context loss between sessions.

Use a full ExecPlan for normal/high-risk lanes with real unknowns or multi-phase
work. Tiny-lane changes do not need one.

## Authority and conflicts (our rules win)

The upstream guidance says "do not prompt the user for next steps, just proceed,
resolve ambiguities autonomously, commit frequently." We override that where it
collides with this repo:

- Architecture / boundary / naming / invariant changes still STOP and require
  user confirmation plus a durable decision (see `architecture-changes.md`).
  Autonomy applies only inside scope the user already approved.
- `translateZiweiKey` fail-fast, the Han `\p{Script=Han}` scan, and the
  `apps/web` import boundary are never loosened inside an ExecPlan.
- Destructive/irreversible actions still follow the Always-On Rules in the root
  `AGENTS.md`.
- Commit only when the user asks; "commit frequently" does not grant standing
  permission to commit or push.

## ExecPlan vs harness durable layer (no double-bookkeeping)

The ExecPlan's `Decision Log` is an in-plan construction journal: lightweight
notes on why a choice was made while building. It is NOT the durable decision
store. Architectural decisions that bind the codebase still go to
`docs/decisions/NNNN-*.md` plus `harness-cli.exe decision add`, and the ExecPlan
references them by id. Likewise the ExecPlan's `Progress` section is narrative;
the authoritative proof matrix is still `story update --unit 1 ...` and
`query matrix`. When the two could drift, the harness durable layer is the
source of truth and the ExecPlan points at it.

## Required living sections

Beyond the existing `Goal` / `Scope` / `Risk Classification` / `Work Phases` /
`Stop Conditions`, every ExecPlan must carry and keep current:

- `Progress` — checkbox list with UTC timestamps. Every stopping point is
  recorded here, splitting a half-done item into "done" vs "remaining" rather
  than leaving it vague. This must reflect the real current state.
- `Surprises & Discoveries` — unexpected behavior, bugs, perf tradeoffs, with a
  short evidence snippet (test output is ideal).
- `Decision Log` — every in-plan decision as Decision / Rationale / Date+Author;
  durable ones also link a `docs/decisions/NNNN-*.md` id.
- `Outcomes & Retrospective` — at each major milestone or completion, what was
  achieved, what remains, lessons learned, measured against the original Goal.

## Self-containment bar

- Assume the reader knows nothing about this repo. Name files by full
  repo-relative path, name functions/modules precisely, and say where new files
  go. Do not write "as defined previously" or point at external blogs; embed the
  needed knowledge in the plan, even at the cost of repetition.
- Define any term of art in plain language the first time you use it.
- Anchor on observable outcomes. State what the user can do after the change,
  the exact commands to run (with working directory), and the output they should
  see. Phrase acceptance as verifiable behavior, not "added struct X".
- Be idempotent and safe: steps should be re-runnable; risky steps carry a retry
  or rollback path.
- Validation is not optional: give the exact test/build/lint commands for this
  toolchain (see `commands.md`) and expected results, including a test that
  fails before and passes after when practical.

## Authoring vs executing vs revising

- Authoring: start from `docs/templates/high-risk-story/execplan.md`, then flesh
  it out as you research. Read source deeply before specifying.
- Executing: proceed milestone to milestone within approved scope; keep
  `Progress` and the living sections updated at every stopping point so a fresh
  agent could resume from the file alone.
- Revising: when you change course, update `Decision Log` and reflect the
  implications in `Progress`. Keep every revision self-contained.

## Prototyping milestones

When a milestone carries real unknowns, an explicit prototyping milestone is
encouraged: keep it additive and testable, label its scope as "prototyping",
describe how to run and observe it, and state the criteria to promote or discard
it.
