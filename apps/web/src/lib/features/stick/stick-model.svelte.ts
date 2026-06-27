/**
 * Model xin xăm (US-039 / backlog #47) — Svelte 5 runes.
 *
 * Giữ câu hỏi (text tự do); submit gọi POST /draws/stick. Giống Tarot/Lenormand/Giải mộng: cho
 * phép tài khoản khách (theo backend) nên KHÔNG chặn anon ở UI. Token đọc tươi trong mutationFn
 * (invariants §3), không snapshot lúc mount. Rút quẻ deterministic server-side; bài luận do LLM sinh.
 */
import { createMutation } from '@tanstack/svelte-query';
import type { StickDraw } from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { ApiError, drawStick } from '$lib/api-client';
import { viCopy } from '$lib/i18n/vi';

export type StickCopy = { readonly [K in keyof typeof viCopy.stick]: string };

export interface StickModelOptions {
  auth: AuthStore;
  copy: StickCopy;
}

export function createStickModel(options: StickModelOptions) {
  const { auth, copy } = options;

  let question = $state('');
  let validationMessage = $state<string | null>(null);

  const mutation = createMutation<StickDraw, ApiError, void>(() => ({
    mutationFn: async () => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new ApiError('unauthorized', viCopy.errors.sessionRequired);
      }
      const trimmed = question.trim();
      if (!trimmed) {
        throw new ApiError('validation', copy.questionRequired);
      }
      return drawStick(token, { question: trimmed });
    },
  }));

  return {
    get question() {
      return question;
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
    get result(): StickDraw | null {
      return mutation.data ?? null;
    },

    setQuestion(next: string): void {
      question = next;
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
      validationMessage = null;
      mutation.reset();
    },
  };
}

export type StickModel = ReturnType<typeof createStickModel>;
