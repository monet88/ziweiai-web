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
  type ExplanationResultRecord,
  type PalaceScope,
} from '@ziweiai/contracts';
import type { AuthStore } from '$lib/auth/auth-store.svelte';
import { ApiError, createExplanation } from '$lib/api-client';
import { buildPalaceExplanationRequest, CHART_DETAIL_EXPLANATION_KIND } from '$lib/features/chart/chart-explanation-intent';
import { buildHydrationResultByScope, OVERVIEW_SCOPE_KEY } from '$lib/features/explanation/explanation-sections';
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
  /**
   * Kết quả luận giải ĐÃ LƯU của lá số (từ chart-detail query). Dùng để hydrate lại nội dung
   * khi mở lá số cũ từ history: trước đây model chỉ giữ markdown của lần tạo trong phiên nên
   * lá số đã có luận giải vẫn hiện nút "Tạo" + EmptyState — kết quả tưởng như "không được lưu".
   */
  getExplanationResults: () => readonly ExplanationResultRecord[];
}

export function createExplanationModel(options: ExplanationModelOptions) {
  const auth = options.auth;
  const queryClient = options.queryClient;

  // Markdown đã tạo trong phiên, theo scope (overview/cung). Giữ riêng từng scope để chọn cung
  // khác không xoá kết quả vừa tạo của cung trước; đồng thời là lớp anti-flicker khi bấm "Tạo
  // lại" (TanStack reset mutation.data về undefined lúc pending) — UI vẫn hiện kết quả cũ của
  // scope đó tới khi kết quả mới về. Cập nhật qua onSuccess (callback, KHÔNG $effect ghi ngược).
  let sessionMarkdownByScope = $state<Record<string, string>>({});

  // Hydrate kết quả ĐÃ LƯU theo scope từ chart-detail query (lọc đúng kind overview của trang
  // chi tiết). Đây là mảnh sửa lỗi "luận giải không được lưu": mở lá số cũ sẽ hiện lại nội dung
  // đã lưu thay vì luôn rơi về EmptyState + nút "Tạo".
  const hydrationByScope = $derived(
    buildHydrationResultByScope(options.getExplanationResults(), CHART_DETAIL_EXPLANATION_KIND),
  );

  // Scope đang xem: cung đang chọn (map an toàn về PalaceScope) hoặc overview.
  const currentScopeKey = $derived(resolvePalaceScope(options.getSelectedPalaceKey()) ?? OVERVIEW_SCOPE_KEY);

  // Ưu tiên kết quả tạo trong phiên (user vừa bấm), fallback kết quả đã lưu của đúng scope.
  const renderedMarkdown = $derived<string | null>(
    sessionMarkdownByScope[currentScopeKey] ?? hydrationByScope.get(currentScopeKey)?.renderedMarkdown ?? null,
  );

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
      // Key theo scope của chính kết quả (providerMetadata.palaceScope; overview khi vắng) để
      // không gán nhầm markdown cung này cho scope đang chọn nếu user đã đổi cung lúc chờ.
      const resultScopeKey = data.result.providerMetadata?.palaceScope ?? OVERVIEW_SCOPE_KEY;
      sessionMarkdownByScope = { ...sessionMarkdownByScope, [resultScopeKey]: data.result.renderedMarkdown };
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['history'] }),
        queryClient.invalidateQueries({ queryKey: ['chart-detail'] }),
      ]);
    },
  }));

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
      return renderedMarkdown !== null;
    },
    get renderedMarkdown(): string | null {
      return renderedMarkdown;
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
