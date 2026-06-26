// Sửa lỗi "luận giải không được lưu": mở lá số cũ từ history phải hiển thị lại kết quả ĐÃ LƯU
// (chart-detail query trả explanationResults) thay vì luôn rơi về EmptyState + nút "Tạo".
// Test ở mức model: getExplanationResults seed renderedMarkdown/hasResult theo scope đang xem.
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
    constructor(
      public code: string,
      message: string,
    ) {
      super(message);
    }
  },
}));

vi.mock('$lib/features/chart/chart-explanation-intent', async () => {
  // Giữ CHART_DETAIL_EXPLANATION_KIND thật (hydration lọc theo kind này), chỉ stub builder request.
  const actual = await vi.importActual<typeof import('$lib/features/chart/chart-explanation-intent')>(
    '$lib/features/chart/chart-explanation-intent',
  );
  return {
    ...actual,
    buildPalaceExplanationRequest: vi.fn().mockReturnValue({ chartSnapshotId: 'snap-1', palaceScope: null }),
  };
});

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
  return { invalidateQueries: vi.fn().mockResolvedValue(undefined) };
}

// Bản ghi luận giải tối giản — hydration chỉ đọc renderedMarkdown + providerMetadata.
function explanationResult(renderedMarkdown: string, providerMetadata: Record<string, string>) {
  return { renderedMarkdown, providerMetadata } as never;
}

describe('explanation-model hydration từ kết quả đã lưu', () => {
  it('hydrate overview khi chưa chọn cung (lá số mở lại từ history có sẵn luận giải tổng quan)', () => {
    const model = createExplanationModel({
      auth: mockAuth() as never,
      queryClient: mockQueryClient() as never,
      getChartSnapshotId: () => 'chart-1',
      getSelectedPalaceKey: () => null,
      getExplanationResults: () => [
        explanationResult('# Luận giải tổng quan đã lưu', { explanationKind: 'overview' }),
      ],
    });

    expect(model.hasResult).toBe(true);
    expect(model.renderedMarkdown).toBe('# Luận giải tổng quan đã lưu');
  });

  it('hydrate đúng cung đang chọn (không trộn markdown giữa các scope)', () => {
    // Hai instance riêng (mỗi cái đọc một lần): $derived đọc ngoài reactive scope với dependency
    // plain (getSelectedPalaceKey) sẽ cache sau lần đọc đầu, nên KHÔNG mutate-rồi-đọc-lại ở đây.
    const results = [
      explanationResult('# Tổng quan', { explanationKind: 'overview' }),
      explanationResult('# Cung Quan Lộc', { explanationKind: 'overview', palaceScope: 'careerPalace' }),
    ];

    const careerModel = createExplanationModel({
      auth: mockAuth() as never,
      queryClient: mockQueryClient() as never,
      getChartSnapshotId: () => 'chart-1',
      getSelectedPalaceKey: () => 'careerPalace',
      getExplanationResults: () => results,
    });
    expect(careerModel.renderedMarkdown).toBe('# Cung Quan Lộc');

    const overviewModel = createExplanationModel({
      auth: mockAuth() as never,
      queryClient: mockQueryClient() as never,
      getChartSnapshotId: () => 'chart-1',
      getSelectedPalaceKey: () => null,
      getExplanationResults: () => results,
    });
    expect(overviewModel.renderedMarkdown).toBe('# Tổng quan');
  });

  it('không có kết quả đã lưu cho scope → hasResult false (hiện EmptyState + nút Tạo)', () => {
    const model = createExplanationModel({
      auth: mockAuth() as never,
      queryClient: mockQueryClient() as never,
      getChartSnapshotId: () => 'chart-1',
      getSelectedPalaceKey: () => null,
      getExplanationResults: () => [],
    });

    expect(model.hasResult).toBe(false);
    expect(model.renderedMarkdown).toBeNull();
  });

  it('kết quả tạo trong phiên (onSuccess) ưu tiên hơn kết quả đã lưu cùng scope', async () => {
    const model = createExplanationModel({
      auth: mockAuth() as never,
      queryClient: mockQueryClient() as never,
      getChartSnapshotId: () => 'chart-1',
      getSelectedPalaceKey: () => null,
      getExplanationResults: () => [explanationResult('# Bản đã lưu cũ', { explanationKind: 'overview' })],
    });

    expect(model.renderedMarkdown).toBe('# Bản đã lưu cũ');

    const onSuccess = capturedMutationOptions.onSuccess as (data: unknown) => Promise<void>;
    await onSuccess({ result: { renderedMarkdown: '# Bản vừa tạo lại', providerMetadata: {} } });

    expect(model.renderedMarkdown).toBe('# Bản vừa tạo lại');
  });
});
