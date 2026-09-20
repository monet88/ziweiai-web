/**
 * Model rút Lenormand (US-037 / backlog #45) — Svelte 5 runes. Khuôn theo tarot-model:
 * giữ câu hỏi + kiểu trải bài (mặc định ba lá) + seed tuỳ chọn; submit gọi POST /draws/lenormand.
 * Token đọc tươi trong mutationFn (invariants §3), không snapshot lúc mount. Rút lá deterministic
 * server-side; bài đọc do LLM sinh. Validate tối thiểu phía client (câu hỏi không rỗng).
 * Dùng createCastingRitualLifecycle (Issue #68) cho lifecycle submit/reset/token/validation lặp lại.
 */
import type { LenormandDraw, LenormandSpread } from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { drawLenormand } from '$lib/api-client/divinations';
import { createCastingRitualLifecycle } from '$lib/features/divination/casting-ritual-lifecycle.svelte';
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

  const lifecycle = createCastingRitualLifecycle<LenormandDraw>({
    auth,
    validate: () => {
      const trimmed = question.trim();
      if (!trimmed) {
        return copy.questionRequired;
      }
      return null;
    },
    execute: (token) => drawLenormand(token, { question: question.trim(), spread }),
    onReset: () => {
      question = '';
      spread = 'three';
    },
  });

  return {
    get question() {
      return question;
    },
    get spread() {
      return spread;
    },
    get validationMessage() {
      return lifecycle.validationMessage;
    },
    get isSubmitting() {
      return lifecycle.isSubmitting;
    },
    get isError() {
      return lifecycle.isError;
    },
    get errorMessage() {
      return lifecycle.errorMessage;
    },
    get result(): LenormandDraw | null {
      return lifecycle.result;
    },

    setQuestion(next: string): void {
      question = next;
    },

    setSpread(next: LenormandSpread): void {
      spread = next;
    },

    submit: lifecycle.submit,
    reset: lifecycle.reset,
  };
}

export type LenormandModel = ReturnType<typeof createLenormandModel>;
