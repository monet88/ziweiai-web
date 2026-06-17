/**
 * Model luận giải AI theo cung (factory Svelte 5 runes) — US-006.
 *
 * Tái dựng reader bỏ sót `use-palace-explanation-model.ts` (xác nhận KHÔNG tồn tại trong
 * repo — đã ghi backlog). Dùng helper US-003 `chart-explanation-intent`:
 *   - palaceScope null → overview (luận giải cả lá số, luồng cũ).
 *   - palaceScope là PalaceScope hợp lệ → luận giải riêng cung/vận hạn.
 *
 * Nguyên tắc reactive (invariants §3):
 * - createMutation createExplanation: token đọc TƯƠI trong mutationFn (không snapshot).
 * - markdown dẫn xuất từ mutation.data; KHÔNG $effect ghi ngược state.
 * - selectedPalaceKey là nameKey cung (có thể là legacy key) → map sang PalaceScope an
 *   toàn bằng palaceScopeSchema.safeParse: key không thuộc enum scope → overview (null),
 *   không bao giờ ép một key lạ vào request.
 */
import { createMutation, type QueryClient } from '@tanstack/svelte-query';
import {
  palaceScopeSchema,
  type CreateExplanationResponse,
  type PalaceScope,
} from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { ApiError, createExplanation } from '$lib/api-client';
import { buildPalaceExplanationRequest } from '$lib/features/chart/chart-explanation-intent';
import { viCopy } from '$lib/i18n/vi';

/**
 * Map nameKey cung đang chọn sang PalaceScope hợp lệ cho request.
 * - null (không chọn cung) → null (overview).
 * - nameKey thuộc enum palaceScope (vd soulPalace) → palaceScope đó.
 * - nameKey legacy / không thuộc enum → null (overview), không gửi key lạ lên API.
 */
export function resolvePalaceScope(selectedPalaceKey: string | null): PalaceScope | null {
  if (selectedPalaceKey === null) {
    return null;
  }
  const parsed = palaceScopeSchema.safeParse(selectedPalaceKey);
  return parsed.success ? parsed.data : null;
}

export interface ExplanationModelOptions {
  auth: AuthStore;
  /**
   * QueryClient để invalidate cache lịch sử sau khi tạo luận giải. Tạo luận giải mới bật
   * hasExplanation trong history response; không invalidate thì sidebar/history hiển thị
   * "Chỉ lá số" sai cho tới khi staleTime hết.
   */
  queryClient: QueryClient;
  /** Id bản ghi lá số (chartRecord.id, trùng route param chartId) — khóa luận giải theo lá số. */
  getChartSnapshotId: () => string | null;
  /** nameKey cung đang chọn ở model chi tiết (null = chưa chọn → overview). */
  getSelectedPalaceKey: () => string | null;
}

export function createExplanationModel(options: ExplanationModelOptions) {
  const auth = options.auth;
  const queryClient = options.queryClient;

  // Giữ markdown thành công gần nhất để tránh giật màn hình khi bấm "Tạo lại": TanStack
  // reset mutation.data về undefined lúc pending, nên nếu render trực tiếp từ mutation.data
  // thì nội dung cũ biến mất trong lúc chờ. Cập nhật qua onSuccess (callback, KHÔNG $effect
  // ghi ngược) — UI tiếp tục hiển thị luận giải cũ tới khi kết quả mới về.
  let lastRenderedMarkdown = $state<string | null>(null);

  const mutation = createMutation(() => ({
    mutationFn: async (): Promise<CreateExplanationResponse> => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new ApiError('unauthorized', viCopy.errors.createChartRequiresSignIn);
      }
      const chartSnapshotId = options.getChartSnapshotId();
      if (!chartSnapshotId) {
        throw new ApiError('not-found', viCopy.chart.chartNotAvailableFallback);
      }
      const scope = resolvePalaceScope(options.getSelectedPalaceKey());
      return createExplanation(token, buildPalaceExplanationRequest(chartSnapshotId, scope));
    },
    onSuccess: async (data: CreateExplanationResponse): Promise<void> => {
      lastRenderedMarkdown = data.result.renderedMarkdown;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['history'] }),
        queryClient.invalidateQueries({ queryKey: ['chart-detail'] }),
      ]);
    },
  }));

  // renderedMarkdown = kết quả thành công gần nhất (giữ qua lần "Tạo lại" để không giật màn).

  function generate(): void {
    if (mutation.isPending) {
      return;
    }
    mutation.mutate();
  }

  return {
    get isPending(): boolean {
      return mutation.isPending;
    },
    get isError(): boolean {
      return mutation.isError;
    },
    get hasResult(): boolean {
      return lastRenderedMarkdown !== null;
    },
    get renderedMarkdown(): string | null {
      return lastRenderedMarkdown;
    },
    get isPaymentRequired(): boolean {
      return mutation.isError && mutation.error instanceof ApiError && mutation.error.kind === 'payment-required';
    },
    get errorMessage(): string | null {
      if (!mutation.isError) {
        return null;
      }
      // Chỉ ApiError đảm bảo message tiếng Việt (fetch-json map mọi lỗi HTTP/mạng/parse).
      // Lỗi khác (thư viện, JS thô) có thể tiếng Anh → fallback chung giữ bất biến ngôn ngữ.
      const error = mutation.error;
      if (error instanceof ApiError) {
        return error.message;
      }
      return viCopy.explanation.statusFailed;
    },
    generate,
  };
}

export type ExplanationModel = ReturnType<typeof createExplanationModel>;
