// Vitest setup: dang ky matchers cua @testing-library/jest-dom (toBeInTheDocument, ...)
// cho component test (.test.ts import .svelte). Chay mot lan truoc moi suite qua
// vitest `setupFiles`.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterEach } from 'vitest';

// Vitest globals are off in this project, so @testing-library/svelte cannot auto-register
// its afterEach cleanup. Register it explicitly so each component test starts from a clean
// DOM (otherwise repeated render() calls leak nodes and getByRole finds multiple matches).
afterEach(() => {
  cleanup();
});
