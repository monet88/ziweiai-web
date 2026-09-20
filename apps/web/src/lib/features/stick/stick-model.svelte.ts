/**
 * Model xin xăm (US-039 / backlog #47) — Svelte 5 runes.
 *
 * Giữ câu hỏi (text tự do); submit gọi POST /draws/stick. Giống Tarot/Lenormand/Giải mộng: cho
 * phép tài khoản khách (theo backend) nên KHÔNG chặn anon ở UI. Token đọc tươi trong mutationFn
 * (invariants §3), không snapshot lúc mount. Rút quẻ deterministic server-side; bài luận do LLM sinh.
 * Dùng createCastingRitualLifecycle (Issue #68) cho lifecycle submit/reset/token/validation lặp lại.
 */
import type { StickDraw } from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { drawStick } from '$lib/api-client/divinations';
import { createCastingRitualLifecycle } from '$lib/features/divination/casting-ritual-lifecycle.svelte';
import { viCopy } from '$lib/i18n/vi';

export type StickCopy = { readonly [K in keyof typeof viCopy.stick]: string };

export interface StickModelOptions {
  auth: AuthStore;
  copy: StickCopy;
}

export function createStickModel(options: StickModelOptions) {
  const { auth, copy } = options;

  let question = $state('');

  const lifecycle = createCastingRitualLifecycle<StickDraw>({
    auth,
    validate: () => {
      const trimmed = question.trim();
      if (!trimmed) {
        return copy.questionRequired;
      }
      return null;
    },
    execute: (token) => drawStick(token, { question: question.trim() }),
    onReset: () => {
      question = '';
    },
  });

  return {
    get question() {
      return question;
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
    get result(): StickDraw | null {
      return lifecycle.result;
    },

    setQuestion(next: string): void {
      question = next;
    },

    submit: lifecycle.submit,
    reset: lifecycle.reset,
  };
}

export type StickModel = ReturnType<typeof createStickModel>;
