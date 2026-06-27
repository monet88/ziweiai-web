/**
 * Model Hoàng lịch (US-040 / backlog #48) — Svelte 5 runes.
 *
 * Giữ chủ đề + khoảng ngày; submit gọi POST /almanac/select. Giống Tarot/Lenormand/Giải mộng/Xin
 * xăm: cho phép tài khoản khách (theo backend) nên KHÔNG chặn anon ở UI. Token đọc tươi trong
 * mutationFn (invariants §3), không snapshot lúc mount. Chọn ngày + chấm điểm tất định server-side;
 * bài luận do LLM sinh.
 */
import { createMutation } from '@tanstack/svelte-query';
import type { AlmanacSelection, AlmanacTopic } from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { ApiError, selectAlmanac } from '$lib/api-client';
import { viCopy } from '$lib/i18n/vi';

export type AlmanacCopy = { readonly [K in keyof typeof viCopy.almanac]: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface AlmanacModelOptions {
  auth: AuthStore;
  copy: AlmanacCopy;
}

export function createAlmanacModel(options: AlmanacModelOptions) {
  const { auth, copy } = options;

  let topic = $state<AlmanacTopic>('marriage');
  let startDate = $state('');
  let endDate = $state('');
  let validationMessage = $state<string | null>(null);

  const mutation = createMutation<AlmanacSelection, ApiError, void>(() => ({
    mutationFn: async () => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new ApiError('unauthorized', viCopy.errors.sessionRequired);
      }
      return selectAlmanac(token, { topic, startDate: startDate.trim(), endDate: endDate.trim() });
    },
  }));

  // Kiểm đầu vào tại UI trước khi gọi API: định dạng ngày + khoảng hợp lệ. Backend vẫn kiểm lại
  // (engine ném AlmanacEngineError → 400) nhưng chặn sớm cho phản hồi nhanh.
  function validate(): string | null {
    const start = startDate.trim();
    const end = endDate.trim();
    if (!DATE_PATTERN.test(start) || !DATE_PATTERN.test(end)) {
      return copy.dateRangeRequired;
    }
    // Ngày đúng định dạng nhưng không tồn tại (vd 2026-02-31) → Date.parse trả NaN. Không bắt sớm
    // thì diffDays là NaN, phép so > 30 thành false và lọt qua check khoảng (backend vẫn chặn).
    const startMs = Date.parse(start);
    const endMs = Date.parse(end);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      return copy.dateRangeInvalid;
    }
    if (end < start) {
      return copy.dateRangeInvalid;
    }
    // Khoảng > 31 ngày: chặn sớm tại UI (engine cũng ném 400). 86_400_000 ms/ngày.
    const diffDays = Math.round((endMs - startMs) / 86_400_000);
    if (diffDays > 30) {
      return copy.dateRangeTooWide;
    }
    return null;
  }

  return {
    get topic() {
      return topic;
    },
    get startDate() {
      return startDate;
    },
    get endDate() {
      return endDate;
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
    get result(): AlmanacSelection | null {
      return mutation.data ?? null;
    },

    setTopic(next: AlmanacTopic): void {
      topic = next;
    },
    setStartDate(next: string): void {
      startDate = next;
    },
    setEndDate(next: string): void {
      endDate = next;
    },

    submit(): void {
      const message = validate();
      if (message) {
        validationMessage = message;
        return;
      }
      validationMessage = null;
      mutation.mutate();
    },

    reset(): void {
      validationMessage = null;
      mutation.reset();
    },
  };
}

export type AlmanacModel = ReturnType<typeof createAlmanacModel>;
