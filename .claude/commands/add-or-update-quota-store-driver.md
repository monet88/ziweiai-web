---
name: add-or-update-quota-store-driver
description: Workflow command scaffold for add-or-update-quota-store-driver in ziweiai-web.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-or-update-quota-store-driver

Use this workflow when working on **add-or-update-quota-store-driver** in `ziweiai-web`.

## Goal

Implements or updates a quota store driver (e.g., memory, upstash), including abstraction, configuration, tests, and documentation.

## Common Files

- `apps/api/src/modules/quotas/counter-stores/*.ts`
- `apps/api/src/modules/quotas/counter-stores/*.test.ts`
- `apps/api/src/modules/quotas/counter-stores/quota-counter-store.ts`
- `apps/api/src/modules/quotas/quotas.module.ts`
- `apps/api/src/modules/quotas/quotas.service.ts`
- `.env.example`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Define or update the quota store driver implementation (e.g., upstash.ts, memory.ts).
- Write or update corresponding tests for the driver (e.g., upstash.test.ts, memory.test.ts).
- Update the quota store interface/abstraction if needed (quota-counter-store.ts).
- Modify the factory or DI setup to register/select the driver (index.ts, quotas.module.ts).
- Update service logic to use the new/updated driver (quotas.service.ts).

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.