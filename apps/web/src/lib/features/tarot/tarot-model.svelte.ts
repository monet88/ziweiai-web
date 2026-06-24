/**
 * Model rút Tarot (US-017h) — Svelte 5 runes.
 *
 * Giữ câu hỏi + kiểu trải bài (mặc định ba lá) + seed tuỳ chọn; submit gọi POST /draws/tarot.
 * Khác Xem Tướng/Xem Tay: Tarot CHO PHÉP tài khoản khách (theo backend) nên KHÔNG chặn anon ở UI.
 * Token đọc tươi trong mutationFn (invariants §3), không snapshot lúc mount. Rút lá là deterministic
 * server-side; diễn giải do LLM sinh. Validate tối thiểu phía client (câu hỏi không rỗng) để báo
 * lỗi sớm, KHÔNG thay cho gate server.
 */
import { createMutation } from '@tanstack/svelte-query';
import type { TarotDraw, TarotSpread } from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { ApiError, drawTarot } from '$lib/api-client';
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
  let validationMessage = $state<string | null>(null);

  const mutation = createMutation<TarotDraw, ApiError, void>(() => ({
    mutationFn: async () => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new ApiError('unauthorized', viCopy.errors.sessionRequired);
      }
      const trimmed = question.trim();
      if (!trimmed) {
        throw new ApiError('validation', copy.questionRequired);
      }
      return drawTarot(token, { question: trimmed, spread });
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
    get result(): TarotDraw | null {
      return mutation.data ?? null;
    },

    setQuestion(next: string): void {
      question = next;
    },

    setSpread(next: TarotSpread): void {
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
      spread = 'three-card';
      validationMessage = null;
      mutation.reset();
    },
  };
}

export type TarotModel = ReturnType<typeof createTarotModel>;
