```markdown
# ziweiai-web Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill documents the core development conventions and workflows for the `ziweiai-web` repository, a TypeScript codebase with no detected framework. It covers file organization, code style, commit patterns, and testing approaches to ensure consistency and maintainability.

## Coding Conventions

### File Naming
- Use **camelCase** for filenames.
  - Example: `userProfile.ts`, `dataFetcher.ts`

### Import Style
- Use **relative imports** for referencing modules within the project.
  - Example:
    ```typescript
    import { fetchData } from './apiClient';
    ```

### Export Style
- Use **named exports** for all modules.
  - Example:
    ```typescript
    // In userProfile.ts
    export function getUserProfile(id: string) { ... }
    ```
    ```typescript
    // In another file
    import { getUserProfile } from './userProfile';
    ```

### Commit Messages
- Follow **Conventional Commits** with the prefix `docs` for documentation changes.
  - Example: `docs: update README with installation steps`

## Workflows

### Documentation Updates
**Trigger:** When updating or adding documentation files.
**Command:** `/update-docs`

1. Make changes to documentation files (e.g., `README.md`, `CONTRIBUTING.md`).
2. Stage and commit changes with a message starting with `docs:`.
   - Example: `docs: add API usage section`
3. Push changes to the repository.

## Testing Patterns

- Test files follow the `*.test.*` naming convention.
  - Example: `userProfile.test.ts`
- The testing framework is **unknown**; check existing test files for patterns.
- Place test files alongside the modules they test or in a dedicated `tests` directory.

  Example test file:
  ```typescript
  // userProfile.test.ts
  import { getUserProfile } from './userProfile';

  test('should fetch user profile by id', () => {
    // test implementation
  });
  ```

## Commands
| Command       | Purpose                                 |
|---------------|-----------------------------------------|
| /update-docs  | Standardize documentation updates       |
```
