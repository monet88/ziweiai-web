import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TarotDraw } from '@ziweiai/contracts';
import { viCopy } from '$lib/i18n/vi';

const mockDrawTarot = vi.fn();

vi.mock('$lib/api-client/divinations', () => ({
  drawTarot: (...args: any[]) => mockDrawTarot(...args),
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

import { createTarotModel } from './tarot-model.svelte';

describe('createTarotModel', () => {
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

    const copy = { ...viCopy.tarot };
    const model = createTarotModel({ auth: auth as any, copy });

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
    expect(model.spread).toBe('three-card');
    expect(model.validationMessage).toBeNull();
    expect(model.isSubmitting).toBe(false);
    expect(model.isError).toBe(false);
    expect(model.errorMessage).toBeNull();
    expect(model.result).toBeNull();
  });

  it('updates question and spread via setters', () => {
    const { model } = setupModel();

    model.setQuestion('Công việc tháng tới thế nào?');
    model.setSpread('single');

    expect(model.question).toBe('Công việc tháng tới thế nào?');
    expect(model.spread).toBe('single');
  });

  it('short-circuits on empty question without calling network and sets validation message', () => {
    const { model, copy } = setupModel();

    model.submit();

    expect(model.validationMessage).toBe(copy.questionRequired);
    expect(mockDrawTarot).not.toHaveBeenCalled();
    expect(model.isSubmitting).toBe(false);
  });

  it('submits valid input, reads token freshly at request time, and calls drawTarot', async () => {
    const mockResult: TarotDraw = {
      question: 'Tương lai ra sao?',
      spread: 'three-card',
      cards: [
        {
          id: 'major_00',
          name: 'The Fool',
          reversed: false,
          position: 0,
        },
      ],
      narrative: 'Một khởi đầu đầy hứa hẹn.',
    };
    mockDrawTarot.mockResolvedValue(mockResult);

    const { model, setToken } = setupModel('stale-token');
    model.setQuestion('  Tương lai ra sao?  ');
    model.setSpread('three-card');

    // Simulate token refresh before submit
    setToken('fresh-token-456');

    model.submit();
    expect(model.validationMessage).toBeNull();

    await new Promise((r) => setTimeout(r, 0));

    expect(mockDrawTarot).toHaveBeenCalledWith('fresh-token-456', {
      question: 'Tương lai ra sao?',
      spread: 'three-card',
    });
    expect(model.result).toEqual(mockResult);
    expect(model.isError).toBe(false);
  });

  it('handles submission error and exposes errorMessage', async () => {
    mockDrawTarot.mockRejectedValue(new Error('Network failure'));

    const { model } = setupModel();
    model.setQuestion('Hỏi quẻ');
    model.submit();

    await new Promise((r) => setTimeout(r, 0));

    expect(model.isError).toBe(true);
    expect(model.errorMessage).toBe('Network failure');
    expect(model.result).toBeNull();
  });

  it('resets question, spread, validation message, and mutation state', () => {
    const { model } = setupModel();

    model.setQuestion('Câu hỏi cũ');
    model.setSpread('single');
    model.submit();

    model.reset();

    expect(model.question).toBe('');
    expect(model.spread).toBe('three-card');
    expect(model.validationMessage).toBeNull();
    expect(model.result).toBeNull();
    expect(model.isError).toBe(false);
  });
});
