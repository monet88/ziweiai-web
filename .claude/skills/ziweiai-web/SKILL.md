```markdown
# ziweiai-web Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches you the core development patterns, coding conventions, and workflows used in the `ziweiai-web` TypeScript codebase. The repository focuses on modular, testable code for quota management (rate limiting), with a strong emphasis on maintainability, clear commit messages, and robust testing using Vitest. You'll learn how to add or update quota store drivers, fix bugs, and follow the project's conventions for code structure and collaboration.

## Coding Conventions

**File Naming**
- Use `camelCase` for file names.
  - Example: `quotaCounterStore.ts`, `upstashDriver.ts`

**Import Style**
- Use relative imports.
  - Example:
    ```typescript
    import { QuotaCounterStore } from './quotaCounterStore'
    ```

**Export Style**
- Use named exports.
  - Example:
    ```typescript
    export function createMemoryStore() { ... }
    export const QUOTA_LIMIT = 1000
    ```

**Commit Messages**
- Follow [Conventional Commits](https://www.conventionalcommits.org/).
- Prefixes: `feat`, `fix`
- Example:
  ```
  feat: add upstash quota store driver with config and tests
  fix: handle upstash timeout edge case in driver
  ```

## Workflows

### Add or Update Quota Store Driver
**Trigger:** When you need to add a new quota storage backend (e.g., memory, upstash) or update an existing one for rate limiting.
**Command:** `/add-quota-store-driver`

1. **Implement or update the driver:**
   - Create or modify a driver in `apps/api/src/modules/quotas/counter-stores/`, e.g., `upstash.ts`, `memory.ts`.
   - Example:
     ```typescript
     export function createUpstashStore(config: UpstashConfig) { ... }
     ```
2. **Write or update tests:**
   - Add or update tests in `apps/api/src/modules/quotas/counter-stores/`, e.g., `upstash.test.ts`.
   - Example:
     ```typescript
     import { describe, it, expect } from 'vitest'
     describe('UpstashStore', () => {
       it('should increment quota', async () => { ... })
     })
     ```
3. **Update the quota store interface/abstraction:**
   - Modify `quota-counter-store.ts` if the interface changes.
4. **Register/select the driver:**
   - Update factory or DI setup in `index.ts` or `quotas.module.ts`.
5. **Update service logic:**
   - Ensure `quotas.service.ts` uses the new/updated driver.
6. **Document environment variables:**
   - Update `.env.example` and `apps/api/src/config/env.ts` for new configs.
7. **Update documentation and planning:**
   - Add or update docs in `docs/stories/epics/` and planning files in `plans/`.

### Driver Bugfix and Test Update
**Trigger:** When you need to fix a bug, timeout, or address a review finding in a quota store driver.
**Command:** `/fix-driver-bug`

1. **Fix the bug:**
   - Update the relevant driver in `apps/api/src/modules/quotas/counter-stores/`, e.g., `upstash.ts`.
   - Example:
     ```typescript
     try {
       // driver logic
     } catch (err) {
       // handle error
     }
     ```
2. **Update/add tests:**
   - Ensure the bug is covered in `*.test.ts` files.
3. **Log or handle errors:**
   - Add appropriate error handling or logging.
4. **Reference review feedback:**
   - Mention PR or review findings in the commit message.

## Testing Patterns

- **Framework:** [Vitest](https://vitest.dev/)
- **Test Files:** Use the `*.test.ts` pattern, located alongside driver files.
- **Test Example:**
  ```typescript
  import { describe, it, expect } from 'vitest'
  import { createMemoryStore } from './memory'

  describe('MemoryStore', () => {
    it('should reset quota', async () => {
      const store = createMemoryStore()
      await store.reset('user-1')
      expect(await store.get('user-1')).toBe(0)
    })
  })
  ```

## Commands

| Command                | Purpose                                                        |
|------------------------|----------------------------------------------------------------|
| /add-quota-store-driver| Add or update a quota store driver, including tests and docs   |
| /fix-driver-bug        | Fix a bug in a quota store driver and update/add tests         |
```