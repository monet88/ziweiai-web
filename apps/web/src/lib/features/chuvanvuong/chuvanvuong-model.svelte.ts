/**
 * Model Chu Văn Vương quẻ dịch — Svelte 5 runes.
 * Tái sử dụng createCastingRitualLifecycle (ADR-0008 / ADR-0011).
 */
import type {
  ChuVanVuongDraw,
  ChuVanVuongDrawRequest,
  ChuVanVuongMethod,
} from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { drawChuVanVuong } from '$lib/api-client/divinations';
import { createCastingRitualLifecycle } from '$lib/features/divination/casting-ritual-lifecycle.svelte';
import { viCopy } from '$lib/i18n/vi';

export type ChuVanVuongCopy = { readonly [K in keyof typeof viCopy.chuvanvuong]: string };

export interface ChuVanVuongModelOptions {
  auth: AuthStore;
  copy: ChuVanVuongCopy;
}

export function createChuVanVuongModel(options: ChuVanVuongModelOptions) {
  const { auth, copy } = options;

  let question = $state('');
  let method = $state<ChuVanVuongMethod>('coins');
  let number1 = $state<number>(1);
  let number2 = $state<number>(1);
  let hexagramId = $state<number>(1);
  let coins = $state<number[]>([]);

  function tossCoin(): void {
    if (coins.length < 6) {
      // Tung 3 đồng xu: mỗi đồng ngẫu nhiên 0 hoặc 1 (ngửa = 1) -> tổng 0-3
      const c1 = Math.random() < 0.5 ? 0 : 1;
      const c2 = Math.random() < 0.5 ? 0 : 1;
      const c3 = Math.random() < 0.5 ? 0 : 1;
      coins = [...coins, c1 + c2 + c3];
    }
  }

  function tossAllCoins(): void {
    const next: number[] = [];
    for (let i = 0; i < 6; i++) {
      const c1 = Math.random() < 0.5 ? 0 : 1;
      const c2 = Math.random() < 0.5 ? 0 : 1;
      const c3 = Math.random() < 0.5 ? 0 : 1;
      next.push(c1 + c2 + c3);
    }
    coins = next;
  }

  const lifecycle = createCastingRitualLifecycle<ChuVanVuongDraw>({
    auth,
    validate: () => {
      const trimmed = question.trim();
      if (!trimmed) {
        return copy.questionRequired;
      }
      if (method === 'coins' && coins.length < 6) {
        return copy.coinsRequired;
      }
      if (method === 'numbers' && (number1 <= 0 || number2 <= 0)) {
        return copy.numbersRequired;
      }
      return null;
    },
    execute: (token) => {
      const trimmed = question.trim();
      const payload: ChuVanVuongDrawRequest = {
        question: trimmed,
        method,
        ...(method === 'coins' ? { coins } : {}),
        ...(method === 'numbers' ? { numbers: [number1, number2] } : {}),
        ...(method === 'manual' ? { hexagramId } : {}),
      };
      return drawChuVanVuong(token, payload);
    },
    onReset: () => {
      question = '';
      coins = [];
    },
  });

  return {
    get question() {
      return question;
    },
    set question(val: string) {
      question = val;
    },
    get method() {
      return method;
    },
    set method(val: ChuVanVuongMethod) {
      method = val;
    },
    get number1() {
      return number1;
    },
    set number1(val: number) {
      number1 = val;
    },
    get number2() {
      return number2;
    },
    set number2(val: number) {
      number2 = val;
    },
    get hexagramId() {
      return hexagramId;
    },
    set hexagramId(val: number) {
      hexagramId = val;
    },
    get coins() {
      return coins;
    },
    tossCoin,
    tossAllCoins,
    // Delegated from casting ritual lifecycle
    get isSubmitting() {
      return lifecycle.isSubmitting;
    },
    get validationMessage() {
      return lifecycle.validationMessage;
    },
    get errorMessage() {
      return lifecycle.errorMessage;
    },
    get result() {
      return lifecycle.result;
    },
    submit: lifecycle.submit,
    reset: lifecycle.reset,
  };
}
