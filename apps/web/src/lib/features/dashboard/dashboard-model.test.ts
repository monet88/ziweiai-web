import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDashboardModel } from './dashboard-model.svelte';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import type { QueryClient } from '@tanstack/svelte-query';

vi.mock('$app/environment', () => ({
  browser: true,
}));

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

vi.mock('$app/paths', () => ({
  resolve: vi.fn((path) => path),
}));

vi.mock('$lib/api-client', () => ({
  createChart: vi.fn().mockResolvedValue({ chartRecord: { id: 'mock-id' } }),
  ApiError: class ApiError extends Error {},
}));

vi.mock('$lib/stores/sheet.svelte', () => ({
  sheetStore: { close: vi.fn() },
}));

vi.mock('@tanstack/svelte-query', () => ({
  createMutation: vi.fn(() => ({ isPending: false, isError: false, error: null, mutate: vi.fn() })),
}));

describe('dashboard-model persistence', () => {
  let mockAuth: AuthStore;
  let mockQueryClient: QueryClient;

  beforeEach(() => {
    mockAuth = { getAccessToken: vi.fn().mockReturnValue('token') } as unknown as AuthStore;
    mockQueryClient = { invalidateQueries: vi.fn() } as unknown as QueryClient;
    vi.clearAllMocks();
    
    // Setup minimal localStorage mock
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        for (const key in store) delete store[key];
      }),
    });
  });

  it('loads draft from localStorage if available', () => {
    localStorage.setItem(
      'ziwei_birth_form_draft',
      JSON.stringify({ chartSystem: 'bazi', birthDay: 15, birthMonth: 8 })
    );

    const model = createDashboardModel({
      auth: mockAuth,
      queryClient: mockQueryClient,
      initialChartSystem: 'zi-wei-dou-shu', // Should be overridden by localStorage
    });

    expect(model.draft.chartSystem).toBe('bazi');
    expect(model.draft.birthDay).toBe(15);
    expect(model.draft.birthMonth).toBe(8);
  });

  it('falls back to initial system if localStorage is empty', () => {
    const model = createDashboardModel({
      auth: mockAuth,
      queryClient: mockQueryClient,
      initialChartSystem: 'zi-wei-dou-shu',
    });

    expect(model.draft.chartSystem).toBe('zi-wei-dou-shu');
    expect(model.draft.birthDay).toBe(''); // default
  });
});
