import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StickDraw } from '@ziweiai/contracts';
import { viCopy } from '$lib/i18n/vi';

const mockDrawStick = vi.fn();

vi.mock('$lib/api-client/divinations', () => ({
  drawStick: (...args: any[]) => mockDrawStick(...args),
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

import { createStickModel } from './stick-model.svelte';

describe('createStickModel', () => {
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

    const copy = { ...viCopy.stick };
    const model = createStickModel({ auth: auth as any, copy });

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
    expect(model.validationMessage).toBeNull();
    expect(model.isSubmitting).toBe(false);
    expect(model.isError).toBe(false);
    expect(model.errorMessage).toBeNull();
    expect(model.result).toBeNull();
  });

  it('updates question via setQuestion', () => {
    const { model } = setupModel();

    model.setQuestion('Cầu tài lộc đầu năm');
    expect(model.question).toBe('Cầu tài lộc đầu năm');
  });

  it('short-circuits on empty question without calling network and sets validation message', () => {
    const { model, copy } = setupModel();

    model.submit();

    expect(model.validationMessage).toBe(copy.questionRequired);
    expect(mockDrawStick).not.toHaveBeenCalled();
    expect(model.isSubmitting).toBe(false);
  });

  it('submits valid input, reads token freshly at request time, and calls drawStick', async () => {
    const mockResult: StickDraw = {
      question: 'Cầu tài lộc đầu năm',
      stick: {
        id: 28,
        level: 'Thượng thượng',
        title: 'Thượng Thượng Quẻ',
        poem: 'Hoa khai kết quả tự nhiên thành',
        interpretation: 'Mọi việc hanh thông, cầu tài đắc tài.',
        advice: 'Quẻ rất tốt cho mọi mưu sự.',
        categories: {
          wealth: 'Đắc tài',
        },
      },
      narrative: 'Quẻ rất tốt cho mọi mưu sự.',
    };
    mockDrawStick.mockResolvedValue(mockResult);

    const { model, setToken } = setupModel('old-token');
    model.setQuestion('  Cầu tài lộc đầu năm  ');

    setToken('fresh-token-abc');

    model.submit();
    expect(model.validationMessage).toBeNull();

    await new Promise((r) => setTimeout(r, 0));

    expect(mockDrawStick).toHaveBeenCalledWith('fresh-token-abc', {
      question: 'Cầu tài lộc đầu năm',
    });
    expect(model.result).toEqual(mockResult);
    expect(model.isError).toBe(false);
  });

  it('handles submission error and exposes errorMessage', async () => {
    mockDrawStick.mockRejectedValue(new Error('Xin xam that bai'));

    const { model } = setupModel();
    model.setQuestion('Cầu duyên');
    model.submit();

    await new Promise((r) => setTimeout(r, 0));

    expect(model.isError).toBe(true);
    expect(model.errorMessage).toBe('Xin xam that bai');
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
