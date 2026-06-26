<script lang="ts">
  // HistoryList: danh sách lịch sử lá số đầy đủ (US-007, limit HISTORY_SCREEN_LIMIT=20).
  // Khác DashboardSidebar (limit 8): đây là trang lịch sử riêng. Tái dùng dedupe thuần
  // (dedupeHistoryChartEntries) để gộp nhiều view cùng lá số về một mục → key theo
  // chartRecord.id không trùng. Mỗi mục link tới /charts/[id] (route chi tiết đúng hệ
  // tự chọn card theo chartSystem của snapshot). Token đọc tươi trong queryFn (§3).
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import { SvelteSet } from 'svelte/reactivity';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { deleteVisionResult, fetchHistory, HISTORY_SCREEN_LIMIT } from '$lib/api-client';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { NoticeBanner, EmptyStateCard, Spinner, PrimaryButton, ConfirmDialog } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import { formatHistoryViewedAt } from '$lib/features/chart/chart-display';
  import {
    dedupeHistoryChartEntries,
    collectVisionHistoryEntries,
  } from '$lib/features/dashboard/dashboard-history';
  import MarkdownView from '$lib/features/explanation/MarkdownView.svelte';
  import type { DivinationPurposeKey } from '@ziweiai/contracts';

  const auth = getAuthStore();

  // Nửa thời hạn signed URL ảnh vision (server ký 3600s). Dùng làm staleTime/gcTime để query
  // history tự refetch + ký URL mới trước khi link cũ hết hạn; biên an toàn cho lệch giờ/clock skew.
  const VISION_SIGNED_URL_STALE_MS = 30 * 60 * 1000;

  const purposeLabels: Record<Exclude<DivinationPurposeKey, 'custom'>, string> = {
    career: viCopy.divination.purposeCareer,
    love: viCopy.divination.purposeLove,
    wealth: viCopy.divination.purposeWealth,
    health: viCopy.divination.purposeHealth,
    decision: viCopy.divination.purposeDecision,
  };

  function purposeLabel(purposeKey: DivinationPurposeKey, purposeCustom: string | null): string {
    if (purposeKey === 'custom') {
      return purposeCustom?.trim() || viCopy.divination.purposeCustom;
    }
    return purposeLabels[purposeKey];
  }

  const history = createQuery(() => ({
    queryKey: ['history', auth.getAccessToken(), HISTORY_SCREEN_LIMIT],
    queryFn: () => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new Error(viCopy.errors.missingChartContext);
      }
      return fetchHistory(token, HISTORY_SCREEN_LIMIT);
    },
    // Chờ có token thật: isAuthenticated có thể true trong khoảnh khắc token chưa nạp/đang
    // refresh — bật query lúc đó khiến queryFn ném missingChartContext và hiện banner lỗi
    // thừa cho người dùng (khớp chart-detail-model.svelte.ts §enabled).
    enabled: auth.isAuthenticated && !!auth.getAccessToken(),
    // Signed URL ảnh vision hết hạn sau 1 giờ (createSignedImageUrl, decision 0023). Giữ cache
    // ngắn hơn hạn đó để danh sách tự refetch và ký URL mới trước khi link cũ hỏng — tránh ảnh
    // vỡ khi user mở lại tab lịch sử để lâu. 30 phút = nửa hạn, an toàn cho lệch giờ/clock skew.
    staleTime: VISION_SIGNED_URL_STALE_MS,
    gcTime: VISION_SIGNED_URL_STALE_MS,
  }));

  const queryClient = useQueryClient();

  // Quyền được quên (decision 0023): xoá một mục Xem Tướng/Xem Tay (ảnh sinh trắc + luận giải).
  // Token đọc TƯƠI trong mutationFn (bất biến §3). pendingDeleteId = mục đang chờ xác nhận trong
  // ConfirmDialog (UX nhất quán với modal dự án, thay window.confirm); deletingId = mục đang gọi
  // API (disable đúng nút + khoá dialog); deleteErrorId = mục lỗi gần nhất để hiện thông báo cạnh
  // đúng mục. onSettled invalidate history để danh sách phản ánh state thật sau khi xoá.
  let pendingDeleteId = $state<string | null>(null);
  let deletingId = $state<string | null>(null);
  let deleteErrorId = $state<string | null>(null);

  const deleteMutation = createMutation(() => ({
    mutationFn: async (visionResultId: string): Promise<void> => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new Error(viCopy.errors.missingChartContext);
      }
      await deleteVisionResult(token, visionResultId);
    },
    onSuccess: (_data: void, visionResultId: string): void => {
      if (deleteErrorId === visionResultId) {
        deleteErrorId = null;
      }
    },
    onError: (_error: unknown, visionResultId: string): void => {
      deleteErrorId = visionResultId;
    },
    onSettled: async (): Promise<void> => {
      deletingId = null;
      pendingDeleteId = null;
      await queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  }));

  function isDeleting(visionResultId: string): boolean {
    return deletingId === visionResultId;
  }

  // Bấm "Xoá" → mở ConfirmDialog (không xoá ngay). Bỏ qua khi đang có request xoá chạy dở.
  function requestDelete(visionResultId: string): void {
    if (deletingId) {
      return;
    }
    pendingDeleteId = visionResultId;
  }

  // Xác nhận trong dialog → gọi API thật. deletingId khoá nút + đánh dấu dialog đang xử lý.
  function confirmDelete(): void {
    if (!pendingDeleteId) {
      return;
    }
    deletingId = pendingDeleteId;
    deleteMutation.mutate(pendingDeleteId);
  }

  // Huỷ dialog (Escape/backdrop/nút Huỷ). onSettled đã khoá huỷ khi đang xử lý nên an toàn.
  function cancelDelete(): void {
    pendingDeleteId = null;
  }

  // Gộp view cùng lá số → mục duy nhất; nhãn hệ tiếng Việt + ngày locale vi-VN.
  // US-025: mục gieo quẻ (divinationContext != null) hiện câu hỏi + lĩnh vực thay vì
  // chỉ nhãn hệ, để phân biệt rõ với lá số natal.
  const chartItems = $derived(
    dedupeHistoryChartEntries(history.data?.items ?? []).map((entry) => ({
      id: entry.chartRecord.id,
      systemLabel: viCopy.chartSystem[entry.chartRecord.chartSystem],
      createdAtLabel: formatHistoryViewedAt(entry.chartRecord.createdAt),
      hasExplanation: entry.hasExplanation,
      question: entry.divinationContext?.question ?? null,
      purposeText: entry.divinationContext
        ? purposeLabel(entry.divinationContext.purposeKey, entry.divinationContext.purposeCustom)
        : null,
    })),
  );

  // US-017 follow-up (decision 0023): Xem Tướng/Xem Tay không có lá số nên không link
  // /charts/[id]; render inline ngay tại đây (ảnh đã ký + câu hỏi + luận giải Markdown).
  const visionItems = $derived(
    collectVisionHistoryEntries(history.data?.items ?? []).map((entry) => ({
      id: entry.visionResult.id,
      kindLabel:
        entry.visionResult.kind === 'face'
          ? viCopy.history.visionKindFace
          : viCopy.history.visionKindPalm,
      createdAtLabel: formatHistoryViewedAt(entry.visionResult.createdAt),
      question: entry.visionResult.question,
      narrative: entry.visionResult.renderedMarkdown,
      imageUrl: entry.imageUrl,
    })),
  );

  // Trang trống chỉ khi không còn cả lá số lẫn vision; trước đây chỉ xét chartItems sẽ ẩn
  // các lượt Xem Tướng/Xem Tay đã lưu.
  const isEmpty = $derived(chartItems.length === 0 && visionItems.length === 0);

  // Signed URL ảnh vision chỉ sống ngắn hạn (~1h). Nếu tab mở lâu hơn thời hạn ký mà query
  // history chưa refetch, URL hết hạn → <img> load lỗi (markup vẫn có src nên nhánh imageUrl
  // null KHÔNG bắt được). Thu thập id ảnh load hỏng lúc runtime để rơi về cùng placeholder
  // "ảnh không còn khả dụng" thay vì hiện icon ảnh vỡ.
  const failedImageIds = new SvelteSet<string>();

  function markImageFailed(id: string): void {
    failedImageIds.add(id);
  }

  function goToDashboard(): void {
    void goto(resolve('/'));
  }
</script>

{#if history.isPending}
  <div class="state">
    <Spinner />
    <p class="state-text">{viCopy.history.loadingMessage}</p>
  </div>
{:else if history.isError}
  <NoticeBanner tone="danger">
    <div class="error-content">
      <p class="error-text">{viCopy.history.errorMessage}</p>
      <PrimaryButton
        variant="utility"
        label={viCopy.history.retryButton}
        loading={history.isFetching}
        onclick={() => void history.refetch()}
      />
    </div>
  </NoticeBanner>
{:else if isEmpty}
  <EmptyStateCard
    title={viCopy.history.emptyTitle}
    description={viCopy.history.emptyDescription}
    actionLabel={viCopy.dashboard.createChart}
    onaction={goToDashboard}
  />
{:else}
  {#if chartItems.length > 0}
    <ul class="list">
      {#each chartItems as item (item.id)}
        <li>
          <a class="item" href={resolve(`/charts/${item.id}`)}>
            {#if item.question}
              <span class="item-question">{item.question}</span>
              <span class="item-meta">
                {item.systemLabel} · {item.purposeText} · {item.createdAtLabel}
              </span>
            {:else}
              <span class="item-system">{item.systemLabel}</span>
              <span class="item-meta">
                {item.createdAtLabel}
                · {item.hasExplanation ? viCopy.history.savedExplanation : viCopy.history.chartOnly}
              </span>
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  {/if}

  {#if visionItems.length > 0}
    <section class="vision-section">
      <h2 class="vision-section-title">{viCopy.history.visionSectionTitle}</h2>
      <ul class="list">
        {#each visionItems as item (item.id)}
          <li class="vision-item">
            <div class="vision-head">
              <div class="vision-head-meta">
                <span class="item-system">{item.kindLabel}</span>
                <span class="item-meta">{item.createdAtLabel}</span>
              </div>
              <button
                type="button"
                class="vision-delete"
                disabled={isDeleting(item.id)}
                onclick={() => requestDelete(item.id)}
              >
                {isDeleting(item.id) ? viCopy.history.visionDeleting : viCopy.history.visionDeleteLabel}
              </button>
            </div>
            {#if deleteErrorId === item.id}
              <p class="vision-delete-error" role="alert">{viCopy.history.visionDeleteFailed}</p>
            {/if}
            {#if item.imageUrl && !failedImageIds.has(item.id)}
              <img
                class="vision-image"
                src={item.imageUrl}
                alt={viCopy.history.visionImageAlt}
                onerror={() => markImageFailed(item.id)}
              />
            {:else}
              <p class="vision-image-missing">{viCopy.history.visionImageUnavailable}</p>
            {/if}
            {#if item.question}
              <p class="vision-question">
                <span class="vision-question-label">{viCopy.history.visionQuestionLabel}:</span>
                {item.question}
              </p>
            {/if}
            <MarkdownView markdown={item.narrative} />
          </li>
        {/each}
      </ul>
    </section>
  {/if}
{/if}

{#if pendingDeleteId}
  <ConfirmDialog
    title={viCopy.history.visionDeleteTitle}
    message={viCopy.history.visionDeleteConfirm}
    confirmLabel={viCopy.history.visionDeleteLabel}
    cancelLabel={viCopy.history.visionDeleteCancel}
    loadingLabel={viCopy.history.visionDeleting}
    loading={deletingId !== null}
    onConfirm={confirmDelete}
    onCancel={cancelDelete}
  />
{/if}

<style>
  .state {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .state-text {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 14px;
  }

  .error-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    align-items: flex-start;
  }

  .error-text {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 1.5;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    padding: var(--space-md);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }

  .item:hover {
    border-color: var(--color-accent-primary);
  }

  .item:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 1px;
  }

  .item-system {
    font-size: 15px;
    font-weight: 600;
  }

  .item-question {
    font-size: 15px;
    font-weight: 600;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .item-meta {
    color: var(--color-text-muted);
    font-size: 13px;
  }

  .vision-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    margin-top: var(--space-lg);
  }

  .vision-section-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .vision-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-md);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
  }

  .vision-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  .vision-head-meta {
    display: flex;
    align-items: baseline;
    gap: var(--space-sm);
  }

  .vision-delete {
    flex-shrink: 0;
    padding: 4px 10px;
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-text-muted);
    font-size: 13px;
    cursor: pointer;
  }

  .vision-delete:hover:not(:disabled) {
    border-color: var(--color-danger, #c0392b);
    color: var(--color-danger, #c0392b);
  }

  .vision-delete:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 1px;
  }

  .vision-delete:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .vision-delete-error {
    margin: 0;
    color: var(--color-danger, #c0392b);
    font-size: 13px;
  }

  .vision-image {
    display: block;
    width: 100%;
    max-height: 320px;
    object-fit: contain;
    border-radius: var(--radius-md);
    background: var(--color-bg-elevated);
  }

  .vision-image-missing {
    margin: 0;
    padding: var(--space-md);
    border: 1px dashed var(--color-border-hairline);
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    font-size: 13px;
    text-align: center;
  }

  .vision-question {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 1.5;
  }

  .vision-question-label {
    font-weight: 600;
    color: var(--color-text-primary);
  }
</style>
