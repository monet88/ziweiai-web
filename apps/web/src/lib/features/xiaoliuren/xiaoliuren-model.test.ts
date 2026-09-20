import { beforeEach, describe, expect, it, vi } from 'vitest';
import { XIAO_LIU_REN_PALACES, type XiaoLiuRenDraw } from '@ziweiai/contracts';
import { viCopy } from '$lib/i18n/vi';

const mockDrawXiaoLiuRen = vi.fn();

vi.mock('$lib/api-client/divinations', () => ({
  drawXiaoLiuRen: (...args: any[]) => mockDrawXiaoLiuRen(...args),
}));

let currentOptionsFn: (() => any) | null = null;
let currentMutationState = {
  isPending: false,
  isError: false,
  error: null as any,
  data: null as any,
};

vi.mock('@tanstack/svelte-query', () => ({
  createMutation: (optionsFn: () => any) => {
    currentOptionsFn = optionsFn;
    return {
      get isPending() {
        return currentMutationState.isPending;
      },
      get isError() {
        return currentMutationState.isError;
      },
      get error() {
        return currentMutationState.error;
      },
      get data() {
        return currentMutationState.data;
      },
      mutate: vi.fn(async () => {
        const opts = currentOptionsFn ? currentOptionsFn() : {};
        currentMutationState.isPending = true;
        currentMutationState.isError = false;
        currentMutationState.error = null;
        try {
          const res = await opts.mutationFn();
          currentMutationState.data = res;
          opts.onSuccess?.(res);
          return res;
        } catch (err) {
          currentMutationState.isError = true;
          currentMutationState.error = err;
          opts.onError?.(err);
        } finally {
          currentMutationState.isPending = false;
        }
      }),
      reset: vi.fn(() => {
        currentMutationState.isPending = false;
        currentMutationState.isError = false;
        currentMutationState.error = null;
        currentMutationState.data = null;
      }),
    };
  },
}));

import { createXiaoLiuRenModel } from './xiaoliuren-model.svelte';

describe('createXiaoLiuRenModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentMutationState = {
      isPending: false,
      isError: false,
      error: null,
      data: null,
    };
  });

  function setupModel(initialToken: string | null = 'test-token') {
    let currentToken = initialToken;
    const auth = {
      isAuthenticated: Boolean(currentToken),
      getAccessToken: vi.fn(() => currentToken),
      user: null,
      session: null,
      signOut: vi.fn(),
    };

    const copy = { ...viCopy.xiaoliuren };
    const model = createXiaoLiuRenModel({ auth: auth as any, copy });

    return {
      model,
      auth,
      copy,
      setToken: (tok: string | null) => {
        currentToken = tok;
      },
    };
  }

  it('initializes with default values', () => {
    const { model } = setupModel();

    expect(model.question).toBe('');
    expect(model.method).toBe('time');
    expect(model.number1).toBe(1);
    expect(model.number2).toBe(1);
    expect(model.number3).toBe(1);
    expect(model.validationMessage).toBeNull();
    expect(model.isSubmitting).toBe(false);
    expect(model.isError).toBe(false);
    expect(model.errorMessage).toBeNull();
    expect(model.result).toBeNull();
  });

  it('updates state via setters and random generator', () => {
    const { model } = setupModel();

    model.setQuestion('Việc kinh doanh sắp tới thế nào?');
    model.setMethod('numbers');
    model.setNumber1(7);
    model.setNumber2(8);
    model.setNumber3(9);

    expect(model.question).toBe('Việc kinh doanh sắp tới thế nào?');
    expect(model.method).toBe('numbers');
    expect(model.number1).toBe(7);
    expect(model.number2).toBe(8);
    expect(model.number3).toBe(9);

    model.generateRandomNumbers();
    expect(model.number1).toBeGreaterThanOrEqual(1);
    expect(model.number2).toBeGreaterThanOrEqual(1);
    expect(model.number3).toBeGreaterThanOrEqual(1);
  });

  it('short-circuits on empty question without calling network and sets validation message', () => {
    const { model, copy } = setupModel();

    model.submit();

    expect(model.validationMessage).toBe(copy.questionRequired);
    expect(mockDrawXiaoLiuRen).not.toHaveBeenCalled();
    expect(model.isSubmitting).toBe(false);
  });

  it('submits valid time-mode draw with fresh token', async () => {
    const mockPalace = XIAO_LIU_REN_PALACES[0];
    const mockResult: XiaoLiuRenDraw = {
      question: 'Khởi hành chuyến đi',
      method: 'time',
      numbers: [1, 1, 1],
      firstPalace: mockPalace,
      secondPalace: mockPalace,
      targetPalace: mockPalace,
      flowDescription: 'Đại An chuyển Đại An',
      narrative: 'Quẻ Đại An chủ về vạn sự bình yên.',
    };
    mockDrawXiaoLiuRen.mockResolvedValue(mockResult);

    const { model, setToken } = setupModel('old-tok');
    model.setQuestion('Khởi hành chuyến đi');
    model.setMethod('time');

    setToken('fresh-tok-xlr');

    model.submit();
    expect(model.validationMessage).toBeNull();

    await new Promise((r) => setTimeout(r, 0));

    expect(mockDrawXiaoLiuRen).toHaveBeenCalledWith('fresh-tok-xlr', {
      question: 'Khởi hành chuyến đi',
      method: 'time',
    });
    expect(model.result).toEqual(mockResult);
    expect(model.isError).toBe(false);
  });

  it('validates numbers in numbers mode and blocks invalid numbers', () => {
    const { model, copy } = setupModel();

    model.setQuestion('Hỏi việc làm');
    model.setMethod('numbers');
    model.setNumber1(0); // Invalid <= 0

    model.submit();

    expect(model.validationMessage).toBe(copy.numbersRequired);
    expect(mockDrawXiaoLiuRen).not.toHaveBeenCalled();
  });

  it('submits valid numbers-mode draw with numbers payload', async () => {
    const mockPalace = XIAO_LIU_REN_PALACES[2];
    const mockResult: XiaoLiuRenDraw = {
      question: 'Thi cử đỗ đạt',
      method: 'numbers',
      numbers: [3, 5, 8],
      firstPalace: mockPalace,
      secondPalace: mockPalace,
      targetPalace: mockPalace,
      flowDescription: 'Tốc Hỷ',
      narrative: 'Tin vui đến mau lẹ.',
    };
    mockDrawXiaoLiuRen.mockResolvedValue(mockResult);

    const { model } = setupModel('token-numbers');
    model.setQuestion('Thi cử đỗ đạt');
    model.setMethod('numbers');
    model.setNumber1(3);
    model.setNumber2(5);
    model.setNumber3(8);

    model.submit();
    expect(model.validationMessage).toBeNull();

    await new Promise((r) => setTimeout(r, 0));

    expect(mockDrawXiaoLiuRen).toHaveBeenCalledWith('token-numbers', {
      question: 'Thi cử đỗ đạt',
      method: 'numbers',
      numbers: [3, 5, 8],
    });
    expect(model.result).toEqual(mockResult);
  });

  it('handles submission error and exposes errorMessage', async () => {
    mockDrawXiaoLiuRen.mockRejectedValue(new Error('Lỗi tính toán'));

    const { model } = setupModel();
    model.setQuestion('Hỏi độn');
    model.submit();

    await new Promise((r) => setTimeout(r, 0));

    expect(model.isError).toBe(true);
    expect(model.errorMessage).toBe('Lỗi tính toán');
    expect(model.result).toBeNull();
  });

  it('resets question, validation message, and mutation state', () => {
    const { model } = setupModel();

    model.setQuestion('Câu hỏi cũ');
    model.submit();

    model.reset();

    expect(model.question).toBe('');
    expect(model.validationMessage).toBeNull();
    expect(model.result).toBeNull();
    expect(model.isError).toBe(false);
  });
});
