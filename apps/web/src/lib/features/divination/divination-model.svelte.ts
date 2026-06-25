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

// Mirror the API contract (createDivinationRequestSchema): question 1..500,
// purposeCustom 1..120, manual numbers integer 1..99999. Keeping client validation
// in lockstep avoids submitting inputs the server will reject with a 400.
const QUESTION_MAX_LENGTH = 500;
const PURPOSE_CUSTOM_MAX_LENGTH = 120;
const MANUAL_NUMBER_MIN = 1;
const MANUAL_NUMBER_MAX = 99_999;

function parseManualNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  return Number.parseInt(trimmed, 10);
}

function isValidManualNumber(value: string): boolean {
  const parsed = parseManualNumber(value);
  return parsed !== null && parsed >= MANUAL_NUMBER_MIN && parsed <= MANUAL_NUMBER_MAX;
}

function supportsManualCast(chartSystem: DivinationChartSystem): boolean {
  return chartSystem === 'mei-hua-yi-shu' || chartSystem === 'liu-yao';
}

function validateDraft(draft: DivinationDraft, chartSystem: DivinationChartSystem): DivinationFieldErrors {
  const errors: DivinationFieldErrors = {};
  const question = draft.question.trim();
  if (question.length === 0) {
    errors.question = viCopy.divination.questionRequired;
  } else if (question.length > QUESTION_MAX_LENGTH) {
    errors.question = viCopy.divination.questionTooLong;
  }
  if (draft.purposeKey === 'custom') {
    const purposeCustom = draft.purposeCustom.trim();
    if (purposeCustom.length === 0) {
      errors.purposeCustom = viCopy.divination.purposeCustomRequired;
    } else if (purposeCustom.length > PURPOSE_CUSTOM_MAX_LENGTH) {
      errors.purposeCustom = viCopy.divination.purposeCustomTooLong;
    }
  }
  if (draft.castMethod === 'manual' && chartSystem === 'mei-hua-yi-shu') {
    if (!isValidManualNumber(draft.meihuaUpper)) {
      errors.meihuaUpper = parseManualNumber(draft.meihuaUpper) === null
        ? viCopy.divination.manualNumberRequired
        : viCopy.divination.manualNumberOutOfRange;
    }
    if (!isValidManualNumber(draft.meihuaLower)) {
      errors.meihuaLower = parseManualNumber(draft.meihuaLower) === null
        ? viCopy.divination.manualNumberRequired
        : viCopy.divination.manualNumberOutOfRange;
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
