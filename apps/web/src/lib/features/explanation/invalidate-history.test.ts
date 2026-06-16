import { describe, expect, it, vi } from 'vitest';

let capturedMutationOptions: Record<string, unknown> = {};

vi.mock('@tanstack/svelte-query', () => ({
  createMutation: (optionsFn: () => Record<string, unknown>) => {
    capturedMutationOptions = optionsFn();
    return { isPending: false, isError: false, error: null, mutate: vi.fn() };
  },
}));

vi.mock('$lib/api-client', () => ({
  createExplanation: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(public code: string, message: string) {
      super(message);
    }
  },
}));

vi.mock('$lib/features/chart/chart-explanation-intent', () => ({
  buildPalaceExplanationRequest: vi.fn().mockReturnValue({ chartSnapshotId: 'snap-1', palaceScope: null }),
}));

import { createExplanationModel } from './explanation-model.svelte';

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

describe('explanation-model invalidate history', () => {
  it('onSuccess invalidates history query key after createExplanation', async () => {
    const qc = mockQueryClient();
    createExplanationModel({
      auth: mockAuth() as never,
      queryClient: qc as never,
      getChartSnapshotId: () => 'chart-123',
      getSelectedPalaceKey: () => null,
    });

    const onSuccess = capturedMutationOptions.onSuccess as (data: unknown) => Promise<void>;
    expect(onSuccess).toBeDefined();

    await onSuccess({ result: { renderedMarkdown: '# Hello' } });

    expect(qc.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['history'] });
  });
});
