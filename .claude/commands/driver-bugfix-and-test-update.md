---
name: driver-bugfix-and-test-update
description: Workflow command scaffold for driver-bugfix-and-test-update in ziweiai-web.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /driver-bugfix-and-test-update

Use this workflow when working on **driver-bugfix-and-test-update** in `ziweiai-web`.

## Goal

Fixes a bug or edge case in a quota store driver and updates/adds corresponding tests.

## Common Files

- `apps/api/src/modules/quotas/counter-stores/*.ts`
- `apps/api/src/modules/quotas/counter-stores/*.test.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Update the quota store driver implementation to fix the bug (e.g., upstash.ts).
- Add or update tests to cover the new behavior or bugfix (e.g., upstash.test.ts).
- Log or handle errors as needed in the driver.
- Reference review feedback or PR findings in the commit message.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.