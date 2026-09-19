/**
 * Model Tiểu Lục Nhâm (Issue #65) — Svelte 5 runes.
 *
 * Hỗ trợ 2 phương thức:
 * 1. 'time': Bấm độn theo giờ âm lịch hiện tại (tự động quy đổi)
 * 2. 'numbers': Bấm độn theo 3 số ngẫu nhiên do người dùng chọn/nhập
 */
import { createMutation } from '@tanstack/svelte-query';
import type { XiaoLiuRenDraw, XiaoLiuRenDrawRequest } from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { ApiError } from '$lib/api-client/core';
import { drawXiaoLiuRen } from '$lib/api-client/divinations';
import { viCopy } from '$lib/i18n/vi';

export type XiaoLiuRenCopy = { readonly [K in keyof typeof viCopy.xiaoliuren]: string };

export interface XiaoLiuRenModelOptions {
  auth: AuthStore;
  copy: XiaoLiuRenCopy;
}

export function createXiaoLiuRenModel(options: XiaoLiuRenModelOptions) {
  const { auth, copy } = options;

  let question = $state('');
  let method = $state<'time' | 'numbers'>('time');
  let number1 = $state<number>(1);
  let number2 = $state<number>(1);
  let number3 = $state<number>(1);
  let validationMessage = $state<string | null>(null);

  const mutation = createMutation<XiaoLiuRenDraw, ApiError, void>(() => ({
    mutationFn: async () => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new ApiError('unauthorized', viCopy.errors.sessionRequired);
      }
      const trimmed = question.trim();
      if (!trimmed) {
        throw new ApiError('validation', copy.questionRequired);
      }

      let payload: XiaoLiuRenDrawRequest;
      if (method === 'numbers') {
        const n1 = Math.floor(Number(number1));
        const n2 = Math.floor(Number(number2));
        const n3 = Math.floor(Number(number3));
        if (isNaN(n1) || isNaN(n2) || isNaN(n3) || n1 <= 0 || n2 <= 0 || n3 <= 0) {
          throw new ApiError('validation', copy.numbersRequired);
        }
        payload = {
          question: trimmed,
          method: 'numbers',
          numbers: [n1, n2, n3],
        };
      } else {
        payload = {
          question: trimmed,
          method: 'time',
        };
      }

      return drawXiaoLiuRen(token, payload);
    },
  }));

  return {
    get question() {
      return question;
    },
    get method() {
      return method;
    },
    get number1() {
      return number1;
    },
    get number2() {
      return number2;
    },
    get number3() {
      return number3;
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
    get result(): XiaoLiuRenDraw | null {
      return mutation.data ?? null;
    },

    setQuestion(next: string): void {
      question = next;
    },
    setMethod(next: 'time' | 'numbers'): void {
      method = next;
    },
    setNumber1(val: number): void {
      number1 = val;
    },
    setNumber2(val: number): void {
      number2 = val;
    },
    setNumber3(val: number): void {
      number3 = val;
    },
    generateRandomNumbers(): void {
      number1 = Math.floor(Math.random() * 64) + 1;
      number2 = Math.floor(Math.random() * 64) + 1;
      number3 = Math.floor(Math.random() * 64) + 1;
    },
    submit(): void {
      validationMessage = null;
      const trimmed = question.trim();
      if (!trimmed) {
        validationMessage = copy.questionRequired;
        return;
      }
      if (method === 'numbers') {
        const n1 = Math.floor(Number(number1));
        const n2 = Math.floor(Number(number2));
        const n3 = Math.floor(Number(number3));
        if (isNaN(n1) || isNaN(n2) || isNaN(n3) || n1 <= 0 || n2 <= 0 || n3 <= 0) {
          validationMessage = copy.numbersRequired;
          return;
        }
      }
      mutation.mutate();
    },
    reset(): void {
      mutation.reset();
      question = '';
      validationMessage = null;
    },
  };
}
