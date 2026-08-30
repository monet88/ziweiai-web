/**
 * Model Thần Số Học (Numerology) — Svelte 5 runes.
 *
 * Tính toán 4 chỉ số cốt lõi (Client-side) theo Pythagoras và hỗ trợ gọi AI Luận giải chuyên sâu (POST /numerology/explain - 10 XU).
 */
import { createMutation } from '@tanstack/svelte-query';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { ApiError } from '$lib/api-client/core';
import { explainNumerology } from '$lib/api-client/divinations';
import { viCopy } from '$lib/i18n/vi';
import { calculateNumerology, type NumerologyResult } from './numerology-calculator';

export type NumerologyCopy = { readonly [K in keyof typeof viCopy.numerology]: string };

export interface NumerologyModelOptions {
  auth: AuthStore;
  copy: NumerologyCopy;
}

export function createNumerologyModel(options: NumerologyModelOptions) {
  const { auth, copy } = options;

  let fullName = $state('');
  let birthDateString = $state('');
  let validationMessage = $state<string | null>(null);
  let calculatedResult = $state<NumerologyResult | null>(null);

  const explainMutation = createMutation<{ narrative: string }, ApiError, void>(() => ({
    mutationFn: async () => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new ApiError('unauthorized', copy.identityRequired);
      }
      if (!calculatedResult) {
        throw new ApiError('validation', copy.birthDateRequired);
      }
      const trimmedName = fullName.trim();
      if (!trimmedName) {
        throw new ApiError('validation', copy.fullNameRequired);
      }

      return explainNumerology(token, {
        lifePath: calculatedResult.lifePath,
        destiny: calculatedResult.destiny,
        soulUrge: calculatedResult.soulUrge,
        personality: calculatedResult.personality,
        fullName: trimmedName,
      });
    },
  }));

  return {
    get fullName() {
      return fullName;
    },
    get birthDateString() {
      return birthDateString;
    },
    get validationMessage() {
      return validationMessage;
    },
    get calculatedResult() {
      return calculatedResult;
    },
    get isExplaining() {
      return explainMutation.isPending;
    },
    get isExplainError() {
      return explainMutation.isError;
    },
    get explainErrorMessage() {
      return explainMutation.error?.message ?? null;
    },
    get aiNarrative(): string | null {
      return explainMutation.data?.narrative ?? null;
    },

    setFullName(next: string): void {
      fullName = next;
    },

    setBirthDateString(next: string): void {
      birthDateString = next;
    },

    calculate(): void {
      const trimmed = fullName.trim();
      if (!trimmed) {
        validationMessage = copy.fullNameRequired;
        return;
      }
      if (!birthDateString) {
        validationMessage = copy.birthDateRequired;
        return;
      }

      const parsedDate = new Date(birthDateString);
      if (isNaN(parsedDate.getTime())) {
        validationMessage = copy.birthDateRequired;
        return;
      }

      validationMessage = null;
      calculatedResult = calculateNumerology(trimmed, parsedDate);
    },

    requestExplain(): void {
      if (!calculatedResult) {
        this.calculate();
      }
      if (!calculatedResult) return;
      explainMutation.mutate();
    },

    reset(): void {
      fullName = '';
      birthDateString = '';
      validationMessage = null;
      calculatedResult = null;
      explainMutation.reset();
    },
  };
}

export type NumerologyModel = ReturnType<typeof createNumerologyModel>;
