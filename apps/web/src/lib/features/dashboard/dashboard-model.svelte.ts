/**
 * Model dashboard (factory Svelte 5 runes) — tách khỏi DashboardScreen của Expo.
 *
 * Nguyên tắc reactive (Design Notes US-005 + SPEC Phase 6):
 * - draft là $state THUẦN; người dùng gõ ghi trực tiếp vào draft.
 * - validity/errors là $derived TỪ draft — KHÔNG $effect ghi ngược state (tránh vòng lặp).
 * - createChart qua createMutation; on success điều hướng /charts/<id> bằng id thật.
 *
 * Token đọc tươi từ auth store ngay trong mutationFn (không snapshot lúc tạo model),
 * theo bất biến token tươi (invariants.md §3).
 */
import { createMutation } from '@tanstack/svelte-query';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { ChartSystem, CreateChartResponse } from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { createChart } from '$lib/api-client';
import {
  buildCreateChartRequest,
  createBirthFormDraft,
  validateBirthFormDraft,
  type BirthFormDraft,
  type BirthFormFieldErrors,
} from '$lib/features/birth-profile/birth-profile-draft';
import { viCopy } from '$lib/i18n/vi';

export interface DashboardModelOptions {
  auth: AuthStore;
  initialChartSystem?: ChartSystem;
}

export function createDashboardModel(options: DashboardModelOptions) {
  const auth = options.auth;

  // draft: state thuần. Khởi tạo từ factory (US-007 truyền initialChartSystem qua wrapper).
  let draft = $state<BirthFormDraft>(createBirthFormDraft(options.initialChartSystem));

  // Validity dẫn xuất hoàn toàn từ draft — không ghi ngược.
  const fieldErrors = $derived<BirthFormFieldErrors>(validateBirthFormDraft(draft));
  const isValid = $derived(Object.keys(fieldErrors).length === 0);

  // submitAttempted: chỉ để quyết định CÓ hiển thị lỗi field hay chưa (UX: không nhuộm đỏ
  // form khi người dùng chưa từng submit). Không phải state dẫn xuất nên giữ riêng.
  let submitAttempted = $state(false);

  const mutation = createMutation(() => ({
    mutationFn: async (): Promise<CreateChartResponse> => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new Error(viCopy.errors.createChartRequiresSignIn);
      }
      return createChart(token, buildCreateChartRequest(draft));
    },
    onSuccess: async (response: CreateChartResponse) => {
      // id thật từ bản ghi lá số; mọi hệ vào chung route chi tiết /charts/[chartId].
      await goto(resolve(`/charts/${response.chartRecord.id}`));
    },
  }));

  function setField<K extends keyof BirthFormDraft>(key: K, value: BirthFormDraft[K]): void {
    draft = { ...draft, [key]: value };
  }

  function submit(): void {
    submitAttempted = true;
    if (!isValid || mutation.isPending) {
      return;
    }
    mutation.mutate();
  }

  return {
    get draft() {
      return draft;
    },
    get fieldErrors() {
      return fieldErrors;
    },
    get isValid() {
      return isValid;
    },
    get submitAttempted() {
      return submitAttempted;
    },
    get isSubmitting() {
      return mutation.isPending;
    },
    get isError() {
      return mutation.isError;
    },
    get errorMessage(): string | null {
      return mutation.isError
        ? mutation.error instanceof Error
          ? mutation.error.message
          : viCopy.errors.createChartRequiresSignIn
        : null;
    },
    setField,
    submit,
  };
}

export type DashboardModel = ReturnType<typeof createDashboardModel>;
