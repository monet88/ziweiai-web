import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LenormandDraw } from '@ziweiai/contracts';
import { viCopy } from '$lib/i18n/vi';

const mockDrawLenormand = vi.fn();

vi.mock('$lib/api-client/divinations', () => ({
  drawLenormand: (...args: any[]) => mockDrawLenormand(...args),
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

import { createLenormandModel } from './lenormand-model.svelte';

describe('createLenormandModel', () => {
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

    const copy = { ...viCopy.lenormand };
    const model = createLenormandModel({ auth: auth as any, copy });

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
    expect(model.spread).toBe('three');
    expect(model.validationMessage).toBeNull();
    expect(model.isSubmitting).toBe(false);
    expect(model.isError).toBe(false);
    expect(model.errorMessage).toBeNull();
    expect(model.result).toBeNull();
  });

  it('updates question and spread via setters', () => {
    const { model } = setupModel();

    model.setQuestion('Chuyến đi sắp tới có thuận lợi không?');
    model.setSpread('nine');

    expect(model.question).toBe('Chuyến đi sắp tới có thuận lợi không?');
    expect(model.spread).toBe('nine');
  });

  it('short-circuits on empty question without calling network and sets validation message', () => {
    const { model, copy } = setupModel();

    model.submit();

    expect(model.validationMessage).toBe(copy.questionRequired);
    expect(mockDrawLenormand).not.toHaveBeenCalled();
    expect(model.isSubmitting).toBe(false);
  });

  it('submits valid input, reads token freshly at request time, and calls drawLenormand', async () => {
    const mockResult: LenormandDraw = {
      question: 'Kế hoạch chuyến đi ra sao?',
      spread: 'three',
      spreadName: 'Trải 3 lá',
      cards: [
        {
          id: 1,
          name: 'Kỵ Sĩ',
          keywords: ['Tin tức'],
          meaning: 'Tin tức tốt',
          reversed: false,
          position: 0,
          positionLabel: 'Quá khứ',
        },
      ],
      narrative: 'Tin tức tốt lành sắp đến.',
    };
    mockDrawLenormand.mockResolvedValue(mockResult);

    const { model, setToken } = setupModel('old-token');
    model.setQuestion('  Kế hoạch chuyến đi ra sao?  ');
    model.setSpread('three');

    setToken('new-token-789');

    model.submit();
    expect(model.validationMessage).toBeNull();

    await new Promise((r) => setTimeout(r, 0));

    expect(mockDrawLenormand).toHaveBeenCalledWith('new-token-789', {
      question: 'Kế hoạch chuyến đi ra sao?',
      spread: 'three',
    });
    expect(model.result).toEqual(mockResult);
    expect(model.isError).toBe(false);
  });

  it('handles submission error and exposes errorMessage', async () => {
    mockDrawLenormand.mockRejectedValue(new Error('Server error'));

    const { model } = setupModel();
    model.setQuestion('Xem quẻ Lenormand');
    model.submit();

    await new Promise((r) => setTimeout(r, 0));

    expect(model.isError).toBe(true);
    expect(model.errorMessage).toBe('Server error');
    expect(model.result).toBeNull();
  });

  it('resets question, spread, validation message, and mutation state', () => {
    const { model } = setupModel();

    model.setQuestion('Câu hỏi cũ');
    model.setSpread('nine');
    model.submit();

    model.reset();

    expect(model.question).toBe('');
    expect(model.spread).toBe('three');
    expect(model.validationMessage).toBeNull();
    expect(model.result).toBeNull();
    expect(model.isError).toBe(false);
  });
});
