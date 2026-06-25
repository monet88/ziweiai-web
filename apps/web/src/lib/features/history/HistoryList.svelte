<script lang="ts">
  // HistoryList: danh sách lịch sử lá số đầy đủ (US-007, limit HISTORY_SCREEN_LIMIT=20).
  // Khác DashboardSidebar (limit 8): đây là trang lịch sử riêng. Tái dùng dedupe thuần
  // (dedupeHistoryChartEntries) để gộp nhiều view cùng lá số về một mục → key theo
  // chartRecord.id không trùng. Mỗi mục link tới /charts/[id] (route chi tiết đúng hệ
  // tự chọn card theo chartSystem của snapshot). Token đọc tươi trong queryFn (§3).
  import { createQuery } from '@tanstack/svelte-query';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { fetchHistory, HISTORY_SCREEN_LIMIT } from '$lib/api-client';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { NoticeBanner, EmptyStateCard, Spinner, PrimaryButton } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import { formatHistoryViewedAt } from '$lib/features/chart/chart-display';
  import { dedupeHistoryChartEntries } from '$lib/features/dashboard/dashboard-history';
  import type { DivinationPurposeKey } from '@ziweiai/contracts';

  const auth = getAuthStore();

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
  }));

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
{:else if chartItems.length === 0}
  <EmptyStateCard
    title={viCopy.history.emptyTitle}
    description={viCopy.history.emptyDescription}
    actionLabel={viCopy.dashboard.createChart}
    onaction={goToDashboard}
  />
{:else}
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
    -webkit-box-orient: vertical;
  }

  .item-meta {
    color: var(--color-text-muted);
    font-size: 13px;
  }
</style>
