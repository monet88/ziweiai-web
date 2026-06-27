/**
 * Model giải mộng (US-038 / backlog #42) — Svelte 5 runes.
 *
 * Giữ mô tả giấc mơ (text tự do); submit gọi POST /dreams/interpret. Giống Tarot/Lenormand: cho
 * phép tài khoản khách (theo backend) nên KHÔNG chặn anon ở UI. Token đọc tươi trong mutationFn
 * (invariants §3), không snapshot lúc mount. Khớp biểu tượng + luận giải đều ở server.
 */
import { createMutation } from '@tanstack/svelte-query';
import type { DreamInterpretation } from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { ApiError, interpretDream } from '$lib/api-client';
import { viCopy } from '$lib/i18n/vi';

export type DreamCopy = { readonly [K in keyof typeof viCopy.dream]: string };

export interface DreamModelOptions {
  auth: AuthStore;
  copy: DreamCopy;
}

export function createDreamModel(options: DreamModelOptions) {
  const { auth, copy } = options;

  let dream = $state('');
  let validationMessage = $state<string | null>(null);

  const mutation = createMutation<DreamInterpretation, ApiError, void>(() => ({
    mutationFn: async () => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new ApiError('unauthorized', viCopy.errors.sessionRequired);
      }
      const trimmed = dream.trim();
      if (!trimmed) {
        throw new ApiError('validation', copy.dreamRequired);
      }
      return interpretDream(token, { dream: trimmed });
    },
  }));

  return {
    get dream() {
      return dream;
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
    get result(): DreamInterpretation | null {
      return mutation.data ?? null;
    },

    setDream(next: string): void {
      dream = next;
    },

    submit(): void {
      if (!dream.trim()) {
        validationMessage = copy.dreamRequired;
        return;
      }
      validationMessage = null;
      mutation.mutate();
    },

    reset(): void {
      dream = '';
      validationMessage = null;
      mutation.reset();
    },
  };
}

export type DreamModel = ReturnType<typeof createDreamModel>;
