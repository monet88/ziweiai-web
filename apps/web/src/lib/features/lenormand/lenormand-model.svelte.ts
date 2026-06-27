/**
 * Model rút Lenormand (US-037 / backlog #45) — Svelte 5 runes. Khuôn theo tarot-model:
 * giữ câu hỏi + kiểu trải bài (mặc định ba lá) + seed tuỳ chọn; submit gọi POST /draws/lenormand.
 * Token đọc tươi trong mutationFn (invariants §3), không snapshot lúc mount. Rút lá deterministic
 * server-side; bài đọc do LLM sinh. Validate tối thiểu phía client (câu hỏi không rỗng).
 */
import { createMutation } from '@tanstack/svelte-query';
import type { LenormandDraw, LenormandSpread } from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { ApiError, drawLenormand } from '$lib/api-client';
import { viCopy } from '$lib/i18n/vi';

export type LenormandCopy = { readonly [K in keyof typeof viCopy.lenormand]: string };

export interface LenormandModelOptions {
  auth: AuthStore;
  copy: LenormandCopy;
}

export function createLenormandModel(options: LenormandModelOptions) {
  const { auth, copy } = options;

  let question = $state('');
  let spread = $state<LenormandSpread>('three');
  let validationMessage = $state<string | null>(null);

  const mutation = createMutation<LenormandDraw, ApiError, void>(() => ({
    mutationFn: async () => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new ApiError('unauthorized', viCopy.errors.sessionRequired);
      }
      const trimmed = question.trim();
      if (!trimmed) {
        throw new ApiError('validation', copy.questionRequired);
      }
      return drawLenormand(token, { question: trimmed, spread });
    },
  }));

  return {
    get question() {
      return question;
    },
    get spread() {
      return spread;
    },
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
    get result(): LenormandDraw | null {
      return mutation.data ?? null;
    },

    setQuestion(next: string): void {
      question = next;
    },

    setSpread(next: LenormandSpread): void {
      spread = next;
    },

    submit(): void {
      if (!question.trim()) {
        validationMessage = copy.questionRequired;
        return;
      }
      validationMessage = null;
      mutation.mutate();
    },

    reset(): void {
      question = '';
      spread = 'three';
      validationMessage = null;
      mutation.reset();
    },
  };
}

export type LenormandModel = ReturnType<typeof createLenormandModel>;
