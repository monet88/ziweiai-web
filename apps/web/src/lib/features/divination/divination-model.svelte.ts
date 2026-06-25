/**
 * Model gieo quẻ (factory Svelte 5 runes) cho 4 hệ thuật số theo thời điểm
 * (Mai Hoa, Lục Hào, Đại Lục Nhâm, Kỳ Môn) — US-025, decision 0021.
 *
 * Khác BirthForm: KHÔNG nhập ngày sinh/giới tính. Quẻ gieo theo thời điểm hiện
 * tại (server tự lấy "now"); người dùng chỉ nhập câu hỏi (bắt buộc) + lĩnh vực
 * quan tâm (preset hoặc tự nhập). On success điều hướng /charts/<id> như mọi hệ.
 *
 * Token đọc tươi từ auth store ngay trong mutationFn (invariants.md §3).
 */
import { createMutation, type QueryClient } from '@tanstack/svelte-query';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type {
  CreateDivinationRequest,
  CreateDivinationResponse,
  DivinationChartSystem,
  DivinationPurposeKey,
} from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { ApiError, createDivination } from '$lib/api-client';
import { viCopy } from '$lib/i18n/vi';

export interface DivinationModelOptions {
  auth: AuthStore;
  queryClient: QueryClient;
  chartSystem: DivinationChartSystem;
}

export interface DivinationDraft {
  question: string;
  purposeKey: DivinationPurposeKey;
  purposeCustom: string;
}

export interface DivinationFieldErrors {
  question?: string;
  purposeCustom?: string;
}

function validateDraft(draft: DivinationDraft): DivinationFieldErrors {
  const errors: DivinationFieldErrors = {};
  if (draft.question.trim().length === 0) {
    errors.question = viCopy.divination.questionRequired;
  }
  if (draft.purposeKey === 'custom' && draft.purposeCustom.trim().length === 0) {
    errors.purposeCustom = viCopy.divination.purposeCustomRequired;
  }
  return errors;
}

export function createDivinationModel(options: DivinationModelOptions) {
  const auth = options.auth;
  const queryClient = options.queryClient;
  const chartSystem = options.chartSystem;

  let draft = $state<DivinationDraft>({
    question: '',
    purposeKey: 'career',
    purposeCustom: '',
  });

  const fieldErrors = $derived<DivinationFieldErrors>(validateDraft(draft));
  const isValid = $derived(Object.keys(fieldErrors).length === 0);
  let submitAttempted = $state(false);

  const mutation = createMutation(() => ({
    mutationFn: async (): Promise<CreateDivinationResponse> => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new ApiError('unauthorized', viCopy.errors.createChartRequiresSignIn);
      }
      const request: CreateDivinationRequest = {
        chartSystem,
        question: draft.question.trim(),
        purposeKey: draft.purposeKey,
        ...(draft.purposeKey === 'custom'
          ? { purposeCustom: draft.purposeCustom.trim() }
          : {}),
      };
      return createDivination(token, request);
    },
    onSuccess: async (response: CreateDivinationResponse) => {
      await queryClient.invalidateQueries({ queryKey: ['history'] });
      await goto(resolve(`/charts/${response.chartRecord.id}`));
    },
  }));

  function setField<K extends keyof DivinationDraft>(key: K, value: DivinationDraft[K]): void {
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
      if (!mutation.isError) {
        return null;
      }
      const error = mutation.error;
      if (error instanceof ApiError) {
        return error.message;
      }
      return viCopy.errors.createChartFailed;
    },
    setField,
    submit,
  };
}

export type DivinationModel = ReturnType<typeof createDivinationModel>;
