```markdown
# ziweiai-web Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `ziweiai-web` repository. The codebase is written in TypeScript and does not use a specific framework. It follows clear naming conventions, import/export styles, and commit message patterns. This guide will help you contribute code that matches the project's standards, write and run tests, and understand the typical workflows.

## Coding Conventions

### File Naming
- **Pattern:** PascalCase  
  Example:  
  ```
  MyComponent.ts
  UserProfile.test.ts
  ```

### Import Style
- **Pattern:** Relative imports  
  Example:  
  ```typescript
  import { MyComponent } from './MyComponent';
  ```

### Export Style
- **Pattern:** Named exports  
  Example:  
  ```typescript
  export const MyComponent = () => { /* ... */ };
  ```

### Commit Messages
- **Pattern:** Conventional commits with `feat` prefix  
  Example:  
  ```
  feat: add user authentication flow
  ```

## Workflows

### Feature Development
**Trigger:** When adding a new feature  
**Command:** `/feature-development`

1. Create a new TypeScript file using PascalCase naming.
2. Use relative imports for any dependencies.
3. Export your component or function using named exports.
4. Write or update corresponding test files (`*.test.ts`).
5. Commit your changes using the conventional commit format with the `feat` prefix.
   ```
   feat: short description of the feature
   ```

### Writing Tests
**Trigger:** When adding or updating functionality  
**Command:** `/write-tests`

1. Create a test file named `ComponentName.test.ts` in the same or relevant directory.
2. Write tests using the project's chosen (unknown) testing framework.
3. Ensure all new code is covered by tests.
4. Run the test suite to verify correctness.

### Code Review Preparation
**Trigger:** Before submitting a pull request  
**Command:** `/prepare-review`

1. Ensure all files follow PascalCase naming.
2. Check that all imports are relative and exports are named.
3. Confirm all new features or changes have corresponding tests.
4. Verify commit messages follow the `feat:` conventional format.
5. Run the full test suite and ensure all tests pass.

## Testing Patterns

- **Test File Naming:** Use `*.test.ts` or `*.test.tsx` for test files.
- **Location:** Place test files alongside the code they test or in a dedicated test directory.
- **Framework:** Testing framework is not specified; follow the project's existing test patterns.
- **Example:**
  ```typescript
  // UserProfile.test.ts
  import { UserProfile } from './UserProfile';

  describe('UserProfile', () => {
    it('should render user name', () => {
      // test implementation
    });
  });
  ```

## Commands
| Command               | Purpose                                     |
|-----------------------|---------------------------------------------|
| /feature-development  | Start a new feature using project patterns  |
| /write-tests          | Add or update tests for your code           |
| /prepare-review       | Prepare code for review and submission      |
```
