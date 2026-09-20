/**
 * Shared thin Casting Ritual lifecycle for question-based divination models (Issue #68) — Svelte 5 runes.
 *
 * Encapsulates the 4 repeated mechanics across Tarot, Lenormand, Xin Xam, and Tieu Luc Nham:
 * 1. Fresh access token lookup at mutation time (never snapshotted).
 * 2. Validation message lifecycle (set on invalid submit, cleared on valid submit or reset).
 * 3. Mutation status (isSubmitting, isError, errorMessage, result).
 * 4. Submit and reset orchestration.
 *
 * Domain state, defaults, payload builders, validation specifics, API endpoints,
 * and rendering remain strictly owned by each respective model.
 */
import { createMutation } from '@tanstack/svelte-query';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { ApiError } from '$lib/api-client/core';
import { viCopy } from '$lib/i18n/vi';

export interface CastingRitualLifecycleOptions<TResult> {
  auth: AuthStore;
  validate: () => string | null;
  execute: (token: string) => Promise<TResult>;
  onReset?: () => void;
}

export function createCastingRitualLifecycle<TResult>(
  options: CastingRitualLifecycleOptions<TResult>,
) {
  const { auth, validate, execute, onReset } = options;

  let validationMessage = $state<string | null>(null);

  const mutation = createMutation<TResult, ApiError, void>(() => ({
    mutationFn: async () => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new ApiError('unauthorized', viCopy.errors.sessionRequired);
      }
      const clientValidationError = validate();
      if (clientValidationError) {
        throw new ApiError('validation', clientValidationError);
      }
      return execute(token);
    },
  }));

  function submit(): void {
    if (mutation.isPending) {
      return;
    }
    const error = validate();
    if (error) {
      validationMessage = error;
      return;
    }
    validationMessage = null;
    mutation.mutate();
  }

  function reset(): void {
    validationMessage = null;
    mutation.reset();
    onReset?.();
  }

  function clearValidation(): void {
    validationMessage = null;
  }

  return {
    get validationMessage() {
      return validationMessage;
    },
    get isSubmitting() {
      return mutation.isPending;
    },
    get isError() {
      return mutation.isError;
    },
    get errorMessage() {
      return mutation.error?.message ?? null;
    },
    get result(): TResult | null {
      return mutation.data ?? null;
    },
    clearValidation,
    submit,
    reset,
  };
}

export type CastingRitualLifecycle<TResult> = ReturnType<typeof createCastingRitualLifecycle<TResult>>;
