/**
 * Model Tiểu Lục Nhâm (Issue #65) — Svelte 5 runes.
 *
 * Hỗ trợ 2 phương thức:
 * 1. 'time': Bấm độn theo giờ âm lịch hiện tại (tự động quy đổi)
 * 2. 'numbers': Bấm độn theo 3 số ngẫu nhiên do người dùng chọn/nhập
 * Dùng createCastingRitualLifecycle (Issue #68) cho lifecycle submit/reset/token/validation lặp lại.
 */
import type { XiaoLiuRenDraw, XiaoLiuRenDrawRequest } from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { drawXiaoLiuRen } from '$lib/api-client/divinations';
import { createCastingRitualLifecycle } from '$lib/features/divination/casting-ritual-lifecycle.svelte';
import { viCopy } from '$lib/i18n/vi';

export type XiaoLiuRenCopy = { readonly [K in keyof typeof viCopy.xiaoliuren]: string };

export interface XiaoLiuRenModelOptions {
  auth: AuthStore;
  copy: XiaoLiuRenCopy;
}

function parseNumbers(a: unknown, b: unknown, c: unknown): [number, number, number] | null {
  const n1 = Math.floor(Number(a));
  const n2 = Math.floor(Number(b));
  const n3 = Math.floor(Number(c));
  if (isNaN(n1) || isNaN(n2) || isNaN(n3) || n1 <= 0 || n2 <= 0 || n3 <= 0) {
    return null;
  }
  return [n1, n2, n3];
}

export function createXiaoLiuRenModel(options: XiaoLiuRenModelOptions) {
  const { auth, copy } = options;

  let question = $state('');
  let method = $state<'time' | 'numbers'>('time');
  let number1 = $state<number>(1);
  let number2 = $state<number>(1);
  let number3 = $state<number>(1);

  const lifecycle = createCastingRitualLifecycle<XiaoLiuRenDraw>({
    auth,
    validate: () => {
      const trimmed = question.trim();
      if (!trimmed) {
        return copy.questionRequired;
      }
      if (method === 'numbers') {
        const nums = parseNumbers(number1, number2, number3);
        if (!nums) {
          return copy.numbersRequired;
        }
      }
      return null;
    },
    execute: (token) => {
      const trimmed = question.trim();
      const payload: XiaoLiuRenDrawRequest =
        method === 'numbers'
          ? {
              question: trimmed,
              method: 'numbers',
              numbers: parseNumbers(number1, number2, number3)!,
            }
          : {
              question: trimmed,
              method: 'time',
            };
      return drawXiaoLiuRen(token, payload);
    },
    onReset: () => {
      question = '';
    },
  });

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
    get result(): XiaoLiuRenDraw | null {
      return lifecycle.result;
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
    submit: lifecycle.submit,
    reset: lifecycle.reset,
  };
}

export type XiaoLiuRenModel = ReturnType<typeof createXiaoLiuRenModel>;
