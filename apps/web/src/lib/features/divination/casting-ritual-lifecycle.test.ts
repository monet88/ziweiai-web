import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '$lib/api-client/core';
import { viCopy } from '$lib/i18n/vi';

let currentOptionsFn: (() => any) | null = null;
let currentMutationState = {
  isPending: false,
  isError: false,
  error: null as any,
  data: null as any,
};

vi.mock('@tanstack/svelte-query', () => ({
  createMutation: (optionsFn: () => any) => {
    currentOptionsFn = optionsFn;
    return {
      get isPending() {
        return currentMutationState.isPending;
      },
      get isError() {
        return currentMutationState.isError;
      },
      get error() {
        return currentMutationState.error;
      },
      get data() {
        return currentMutationState.data;
      },
      mutate: vi.fn(async () => {
        const opts = currentOptionsFn ? currentOptionsFn() : {};
        currentMutationState.isPending = true;
        currentMutationState.isError = false;
        currentMutationState.error = null;
        try {
          const res = await opts.mutationFn();
          currentMutationState.data = res;
          opts.onSuccess?.(res);
          return res;
        } catch (err) {
          currentMutationState.isError = true;
          currentMutationState.error = err;
          opts.onError?.(err);
        } finally {
          currentMutationState.isPending = false;
        }
      }),
      reset: vi.fn(() => {
        currentMutationState.isPending = false;
        currentMutationState.isError = false;
        currentMutationState.error = null;
        currentMutationState.data = null;
      }),
    };
  },
}));

import { createCastingRitualLifecycle } from './casting-ritual-lifecycle.svelte';

describe('createCastingRitualLifecycle', () => {
  function setup(initialToken: string | null = 'init-token') {
    let currentToken = initialToken;
    const auth = {
      isAuthenticated: Boolean(currentToken),
      getAccessToken: vi.fn(() => currentToken),
      user: null,
      session: null,
      signOut: vi.fn(),
    };

    let validationResult: string | null = null;
    const mockExecute = vi.fn().mockResolvedValue({ id: 'draw-123' });
    const mockOnReset = vi.fn();

    const lifecycle = createCastingRitualLifecycle({
      auth: auth as any,
      validate: () => validationResult,
      execute: mockExecute,
      onReset: mockOnReset,
    });

    return {
      lifecycle,
      auth,
      setToken: (tok: string | null) => {
        currentToken = tok;
      },
      setValidation: (res: string | null) => {
        validationResult = res;
      },
      mockExecute,
      mockOnReset,
    };
  }

  it('prevents submission and sets validationMessage when validation fails', () => {
    const { lifecycle, setValidation, mockExecute } = setup();

    setValidation('Câu hỏi không được để trống.');
    lifecycle.submit();

    expect(lifecycle.validationMessage).toBe('Câu hỏi không được để trống.');
    expect(mockExecute).not.toHaveBeenCalled();
    expect(lifecycle.isSubmitting).toBe(false);
  });

  it('clears validationMessage and executes mutation when valid', async () => {
    const { lifecycle, setValidation, mockExecute } = setup('jwt-token-123');

    // First trigger invalid
    setValidation('Lỗi');
    lifecycle.submit();
    expect(lifecycle.validationMessage).toBe('Lỗi');

    // Now valid
    setValidation(null);
    lifecycle.submit();
    expect(lifecycle.validationMessage).toBeNull();

    // Allow async mutate to complete
    await new Promise((r) => setTimeout(r, 0));

    expect(mockExecute).toHaveBeenCalledWith('jwt-token-123');
    expect(lifecycle.result).toEqual({ id: 'draw-123' });
    expect(lifecycle.isError).toBe(false);
  });

  it('reads token fresh at mutation time (not snapshotted on lifecycle creation)', async () => {
    const { lifecycle, setToken, mockExecute } = setup('token-at-mount');

    // Token refreshes before submit
    setToken('fresh-refreshed-token');
    lifecycle.submit();
    await new Promise((r) => setTimeout(r, 0));

    expect(mockExecute).toHaveBeenCalledWith('fresh-refreshed-token');
  });

  it('throws unauthorized ApiError in mutationFn if token is missing', async () => {
    const { lifecycle, setToken } = setup(null);

    lifecycle.submit();
    await new Promise((r) => setTimeout(r, 0));

    expect(lifecycle.isError).toBe(true);
    expect(lifecycle.errorMessage).toBe(viCopy.errors.sessionRequired);
  });

  it('resets validationMessage, mutation state, and calls onReset', async () => {
    const { lifecycle, setValidation, mockOnReset } = setup();

    setValidation('Có lỗi');
    lifecycle.submit();
    expect(lifecycle.validationMessage).toBe('Có lỗi');

    lifecycle.reset();
    expect(lifecycle.validationMessage).toBeNull();
    expect(lifecycle.isError).toBe(false);
    expect(lifecycle.result).toBeNull();
    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });
});
