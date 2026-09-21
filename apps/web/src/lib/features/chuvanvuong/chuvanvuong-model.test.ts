import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHU_VAN_VUONG_HEXAGRAMS, type ChuVanVuongDraw } from '@ziweiai/contracts';
import { viCopy } from '$lib/i18n/vi';

const mockDrawChuVanVuong = vi.fn();

vi.mock('$lib/api-client/divinations', () => ({
  drawChuVanVuong: (...args: unknown[]) => mockDrawChuVanVuong(...args),
}));

let currentOptionsFn: (() => { mutationFn: () => Promise<unknown>; onSuccess?: (d: unknown) => void; onError?: (e: unknown) => void }) | null = null;
let currentMutationState = {
  isPending: false,
  isError: false,
  error: null as unknown,
  data: null as unknown,
};

vi.mock('@tanstack/svelte-query', () => ({
  createMutation: (optionsFn: () => { mutationFn: () => Promise<unknown>; onSuccess?: (d: unknown) => void; onError?: (e: unknown) => void }) => {
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
        const opts = currentOptionsFn ? currentOptionsFn() : { mutationFn: async () => null };
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

import { createChuVanVuongModel } from './chuvanvuong-model.svelte';

describe('createChuVanVuongModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentMutationState = {
      isPending: false,
      isError: false,
      error: null,
      data: null,
    };
  });
  function setup() {
    const auth = {
      user: { id: 'test-user-id', email: 'test@example.com' },
      session: { access_token: 'valid-jwt-token' },
      getAccessToken: vi.fn(() => 'valid-jwt-token'),
      requireToken: vi.fn().mockResolvedValue('valid-jwt-token'),
      isAuthenticated: true,
    };

    const copy = { ...viCopy.chuvanvuong };
    const model = createChuVanVuongModel({ auth: auth as any, copy });

    return { model, auth, copy };
  }

  it('khởi tạo với trạng thái mặc định', () => {
    const { model } = setup();
    expect(model.question).toBe('');
    expect(model.method).toBe('coins');
    expect(model.coins).toEqual([]);
    expect(model.validationMessage).toBeNull();
    expect(model.result).toBeNull();
  });
  it('chặn submit khi câu hỏi rỗng', () => {
    const { model, copy } = setup();
    model.submit();
    expect(model.validationMessage).toBe(copy.questionRequired);
    expect(mockDrawChuVanVuong).not.toHaveBeenCalled();
  });

  it('chặn submit khi method coins chưa tung đủ 6 lần', () => {
    const { model, copy } = setup();
    model.question = 'Cầu tài tháng này';
    model.tossCoin(); // 1 lần
    model.submit();
    expect(model.validationMessage).toBe(copy.coinsRequired);
    expect(mockDrawChuVanVuong).not.toHaveBeenCalled();
  });
  it('gieo thành công khi đủ 6 lần tung xu', async () => {
    const { model } = setup();
    model.question = 'Cầu danh sự nghiệp';
    model.tossAllCoins();

    const mockResult: ChuVanVuongDraw = {
      question: 'Cầu danh sự nghiệp',
      method: 'coins',
      hexagram: CHU_VAN_VUONG_HEXAGRAMS[0],
      coins: model.coins,
      narrative: 'Quẻ Thuần Càn đại cát.',
    };
    mockDrawChuVanVuong.mockResolvedValueOnce(mockResult);
    model.submit();
    await Promise.resolve();
    expect(mockDrawChuVanVuong).toHaveBeenCalledWith('valid-jwt-token', {
      question: 'Cầu danh sự nghiệp',
      method: 'coins',
      coins: model.coins,
    });
  });

  it('reset trả form về trạng thái ban đầu', () => {
    const { model } = setup();
    model.question = 'Có nên chuyển nhà?';
    model.tossCoin();
    expect(model.coins.length).toBe(1);

    model.reset();
    expect(model.question).toBe('');
    expect(model.coins).toEqual([]);
    expect(model.validationMessage).toBeNull();
  });
});
