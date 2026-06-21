```markdown
# ziweiai-web Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development conventions and workflows used in the `ziweiai-web` TypeScript codebase. It covers file organization, code style, commit patterns, and testing practices. By following these patterns, contributors can maintain consistency and quality across the project.

## Coding Conventions

### File Naming
- Use **kebab-case** for all file names.
  - Example: `user-profile.ts`, `api-client.ts`

### Import Style
- Use **relative imports** for modules within the project.
  - Example:
    ```typescript
    import { fetchData } from './utils/fetch-data';
    ```

### Export Style
- Use **named exports** for all modules.
  - Example:
    ```typescript
    // In user-profile.ts
    export function getUserProfile(id: string) { ... }
    ```

### Commit Patterns
- Follow the **Conventional Commits** specification.
- Use the `feat` prefix for new features.
  - Example:
    ```
    feat: add user authentication to login page
    ```

## Workflows

### Add a New Feature
**Trigger:** When developing a new feature or module  
**Command:** `/add-feature`

1. Create a new file in kebab-case (e.g., `new-feature.ts`).
2. Use relative imports for any dependencies.
3. Export functions or components using named exports.
4. Write or update Playwright tests in a corresponding `*.test.ts` file.
5. Commit changes using the `feat` prefix and a concise description.
    - Example: `feat: implement new feature for dashboard`

### Write and Run Tests
**Trigger:** When adding or updating functionality  
**Command:** `/run-tests`

1. Create or update a test file named with the `.test.ts` suffix (e.g., `user-profile.test.ts`).
2. Use Playwright for writing tests.
3. Run tests using the Playwright CLI:
    ```bash
    npx playwright test
    ```
4. Ensure all tests pass before committing.

## Testing Patterns

- All tests are written using the **Playwright** framework.
- Test files follow the `*.test.ts` naming convention.
- Example test file:
    ```typescript
    import { test, expect } from '@playwright/test';

    test('should fetch user profile', async ({ page }) => {
      // Test logic here
      expect(true).toBe(true);
    });
    ```

## Commands
| Command        | Purpose                                      |
|----------------|----------------------------------------------|
| /add-feature   | Start the workflow for adding a new feature  |
| /run-tests     | Run all Playwright tests                     |
```
