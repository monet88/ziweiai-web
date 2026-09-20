/**
 * Model rút Tarot (US-017h) — Svelte 5 runes.
 *
 * Giữ câu hỏi + kiểu trải bài (mặc định ba lá) + seed tuỳ chọn; submit gọi POST /draws/tarot.
 * Khác Xem Tướng/Xem Tay: Tarot CHO PHÉP tài khoản khách (theo backend) nên KHÔNG chặn anon ở UI.
 * Token đọc tươi trong mutationFn (invariants §3), không snapshot lúc mount. Rút lá là deterministic
 * server-side; diễn giải do LLM sinh. Validate tối thiểu phía client (câu hỏi không rỗng) để báo
 * lỗi sớm, KHÔNG thay cho gate server.
 * Dùng createCastingRitualLifecycle (Issue #68) cho lifecycle submit/reset/token/validation lặp lại.
 */
import type { TarotDraw, TarotSpread } from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { drawTarot } from '$lib/api-client/divinations';
import { createCastingRitualLifecycle } from '$lib/features/divination/casting-ritual-lifecycle.svelte';
import { viCopy } from '$lib/i18n/vi';

export type TarotCopy = { readonly [K in keyof typeof viCopy.tarot]: string };

export interface TarotModelOptions {
  auth: AuthStore;
  copy: TarotCopy;
}

export function createTarotModel(options: TarotModelOptions) {
  const { auth, copy } = options;

  let question = $state('');
  let spread = $state<TarotSpread>('three-card');

  const lifecycle = createCastingRitualLifecycle<TarotDraw>({
    auth,
    validate: () => {
      const trimmed = question.trim();
      if (!trimmed) {
        return copy.questionRequired;
      }
      return null;
    },
    execute: (token) => drawTarot(token, { question: question.trim(), spread }),
    onReset: () => {
      question = '';
      spread = 'three-card';
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
    get result(): TarotDraw | null {
      return lifecycle.result;
    },

    setQuestion(next: string): void {
      question = next;
    },

    setSpread(next: TarotSpread): void {
      spread = next;
    },

    submit: lifecycle.submit,
    reset: lifecycle.reset,
  };
}

export type TarotModel = ReturnType<typeof createTarotModel>;
