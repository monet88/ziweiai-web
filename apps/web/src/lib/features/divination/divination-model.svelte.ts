/**
 * Model gieo quẻ (factory Svelte 5 runes) cho 4 hệ thuật số theo thời điểm
 * (Mai Hoa, Lục Hào, Đại Lục Nhâm, Kỳ Môn) — US-025, decision 0021.
 *
 * Khác BirthForm: KHÔNG nhập ngày sinh/giới tính. Mặc định quẻ gieo theo thời điểm
 * hiện tại (server tự lấy "now"). US-026: Mai Hoa + Lục Hào còn cho gieo thủ công
 * theo số (Mai Hoa: 2 số) hoặc theo 6 hào (Lục Hào). Người dùng nhập câu hỏi
 * (bắt buộc) + lĩnh vực quan tâm. On success điều hướng /charts/<id>.
 *
 * Token đọc tươi từ auth store ngay trong mutationFn (invariants.md §3).
 */
import { createMutation, type QueryClient } from '@tanstack/svelte-query';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type {
  CreateDivinationRequest,
  CreateDivinationResponse,
  DivinationCastMethod,
  DivinationChartSystem,
  DivinationPurposeKey,
  LiuyaoLineStateKey,
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
  castMethod: DivinationCastMethod;
  meihuaUpper: string;
  meihuaLower: string;
  liuyaoLines: LiuyaoLineStateKey[];
}

export interface DivinationFieldErrors {
  question?: string;
  purposeCustom?: string;
  meihuaUpper?: string;
  meihuaLower?: string;
}

const DEFAULT_LIUYAO_LINES: LiuyaoLineStateKey[] = [
  'youngYang',
  'youngYang',
  'youngYang',
  'youngYang',
  'youngYang',
  'youngYang',
];

function isPositiveInt(value: string): boolean {
  return /^\d+$/.test(value.trim()) && Number.parseInt(value.trim(), 10) >= 1;
}

function supportsManualCast(chartSystem: DivinationChartSystem): boolean {
  return chartSystem === 'mei-hua-yi-shu' || chartSystem === 'liu-yao';
}

function validateDraft(draft: DivinationDraft, chartSystem: DivinationChartSystem): DivinationFieldErrors {
  const errors: DivinationFieldErrors = {};
  if (draft.question.trim().length === 0) {
    errors.question = viCopy.divination.questionRequired;
  }
  if (draft.purposeKey === 'custom' && draft.purposeCustom.trim().length === 0) {
    errors.purposeCustom = viCopy.divination.purposeCustomRequired;
  }
  if (draft.castMethod === 'manual' && chartSystem === 'mei-hua-yi-shu') {
    if (!isPositiveInt(draft.meihuaUpper)) {
      errors.meihuaUpper = viCopy.divination.manualNumberRequired;
    }
    if (!isPositiveInt(draft.meihuaLower)) {
      errors.meihuaLower = viCopy.divination.manualNumberRequired;
    }
  }
  return errors;
}

export function createDivinationModel(options: DivinationModelOptions) {
  const auth = options.auth;
  const queryClient = options.queryClient;
  const chartSystem = options.chartSystem;
  const canManualCast = supportsManualCast(chartSystem);

  let draft = $state<DivinationDraft>({
    question: '',
    purposeKey: 'career',
    purposeCustom: '',
    castMethod: 'time',
    meihuaUpper: '',
    meihuaLower: '',
    liuyaoLines: [...DEFAULT_LIUYAO_LINES],
  });

  const fieldErrors = $derived<DivinationFieldErrors>(validateDraft(draft, chartSystem));
  const isValid = $derived(Object.keys(fieldErrors).length === 0);
  let submitAttempted = $state(false);

  const mutation = createMutation(() => ({
    mutationFn: async (): Promise<CreateDivinationResponse> => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new ApiError('unauthorized', viCopy.errors.createChartRequiresSignIn);
      }
      const manual = canManualCast && draft.castMethod === 'manual';
      const request: CreateDivinationRequest = {
        chartSystem,
        question: draft.question.trim(),
        purposeKey: draft.purposeKey,
        castMethod: manual ? 'manual' : 'time',
        ...(draft.purposeKey === 'custom' ? { purposeCustom: draft.purposeCustom.trim() } : {}),
        ...(manual && chartSystem === 'mei-hua-yi-shu'
          ? {
              meihuaManual: {
                upperNumber: Number.parseInt(draft.meihuaUpper.trim(), 10),
                lowerNumber: Number.parseInt(draft.meihuaLower.trim(), 10),
              },
            }
          : {}),
        ...(manual && chartSystem === 'liu-yao'
          ? { liuyaoManual: { lineStates: draft.liuyaoLines } }
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

  function setLiuyaoLine(index: number, value: LiuyaoLineStateKey): void {
    const next = [...draft.liuyaoLines];
    next[index] = value;
    draft = { ...draft, liuyaoLines: next };
  }

  function submit(): void {
    submitAttempted = true;
    if (!isValid || mutation.isPending) {
      return;
    }
    mutation.mutate();
  }

  return {
    canManualCast,
    chartSystem,
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
    setLiuyaoLine,
    submit,
  };
}

export type DivinationModel = ReturnType<typeof createDivinationModel>;
