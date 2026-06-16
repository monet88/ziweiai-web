import { describe, expect, it, vi, type Mock } from 'vitest';

let capturedMutationOptions: Record<string, unknown> = {};

vi.mock('@tanstack/svelte-query', () => ({
  createMutation: (optionsFn: () => Record<string, unknown>) => {
    capturedMutationOptions = optionsFn();
    return { isPending: false, isError: false, error: null, mutate: vi.fn() };
  },
}));

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

vi.mock('$app/paths', () => ({
  resolve: (path: string) => path,
}));

vi.mock('$lib/api-client', () => ({
  createChart: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(public code: string, message: string) {
      super(message);
    }
  },
}));

import { createDashboardModel } from './dashboard-model.svelte';

function mockAuth() {
  return {
    isAuthenticated: true,
    getAccessToken: () => 'test-token',
    user: null,
    session: null,
    signOut: vi.fn(),
  };
}

function mockQueryClient() {
  return {
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  };
}

describe('dashboard-model invalidate history', () => {
  it('onSuccess invalidates history query key after createChart', async () => {
    const qc = mockQueryClient();
    createDashboardModel({
      auth: mockAuth() as never,
      queryClient: qc as never,
    });

    const onSuccess = capturedMutationOptions.onSuccess as (response: unknown) => Promise<void>;
    expect(onSuccess).toBeDefined();

    await onSuccess({ chartRecord: { id: 'chart-123' } });

    expect(qc.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['history'] });
  });
});
