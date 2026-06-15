<script lang="ts">
  // DashboardSidebar: danh sách lá số gần đây (history limit 8). Mỗi mục có chartRecord
  // mở thẳng trang chi tiết /charts/[chartId]. Trạng thái: loading / error (NoticeBanner)
  // / empty (EmptyStateCard) / danh sách. Nhãn hệ tiếng Việt từ viCopy.chartSystem.
  //
  // Token đọc tươi trong queryFn (bất biến token tươi §3); queryKey gắn token để cache
  // tách theo user. Chỉ hiển thị item có chartRecord (id thật) — mục chỉ-luận-giải không
  // điều hướng được tới trang lá số. Nhiều view cùng một lá số được gộp về một mục.
  import { createQuery } from '@tanstack/svelte-query';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { fetchHistory, DASHBOARD_HISTORY_LIMIT } from '$lib/api-client';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { NoticeBanner, EmptyStateCard, Spinner } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import { dedupeHistoryChartEntries } from './dashboard-history';

  interface Props {
    /** Mở form tạo lá số đầu tiên khi lịch sử rỗng (cuộn tới BirthForm). */
    onCreateFirst?: () => void;
  }

  let { onCreateFirst }: Props = $props();

  const auth = getAuthStore();

  const history = createQuery(() => ({
    queryKey: ['history', auth.getAccessToken(), DASHBOARD_HISTORY_LIMIT],
    queryFn: () => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new Error(viCopy.errors.missingChartContext);
      }
      return fetchHistory(token, DASHBOARD_HISTORY_LIMIT);
    },
    enabled: auth.isAuthenticated,
  }));

  // Gộp nhiều view cùng một lá số về một mục (dedupeHistoryChartEntries — hàm thuần, có unit
  // test) rồi map sang nhãn hiển thị: hệ thuật số tiếng Việt + ngày theo locale vi-VN. Key
  // theo chartRecord.id sau khi dedupe nên không còn each_key_duplicate.
  const chartItems = $derived(
    dedupeHistoryChartEntries(history.data?.items ?? []).map((entry) => ({
      id: entry.chartRecord.id,
      systemLabel: viCopy.chartSystem[entry.chartRecord.chartSystem],
      createdAtLabel: new Date(entry.chartRecord.createdAt).toLocaleDateString('vi-VN'),
      hasExplanation: entry.hasExplanation,
    })),
  );

  function openChart(id: string): void {
    void goto(resolve(`/charts/${id}`));
  }
</script>

<section class="sidebar" aria-labelledby="dashboard-history-title">
  <h2 class="title" id="dashboard-history-title">{viCopy.history.title}</h2>

  {#if history.isPending}
    <div class="state">
      <Spinner />
      <p class="state-text">{viCopy.history.loadingMessage}</p>
    </div>
  {:else if history.isError}
    <NoticeBanner tone="danger" message={viCopy.history.errorMessage} />
  {:else if chartItems.length === 0}
    <EmptyStateCard
      title={viCopy.history.emptyTitle}
      description={viCopy.history.emptyDescription}
      actionLabel={onCreateFirst ? viCopy.dashboard.createChart : undefined}
      onaction={onCreateFirst}
    />
  {:else}
    <ul class="list">
      {#each chartItems as item (item.id)}
        <li>
          <button type="button" class="item" onclick={() => openChart(item.id)}>
            <span class="item-system">{item.systemLabel}</span>
            <span class="item-meta">
              {item.createdAtLabel}
              · {item.hasExplanation ? viCopy.history.savedExplanation : viCopy.history.chartOnly}
            </span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .title {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 17px;
    font-weight: 600;
  }

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
    cursor: pointer;
  }

  .item:hover {
    border-color: var(--color-border-gold);
  }

  .item:focus-visible {
    outline: 2px solid var(--color-accent-gold-soft);
    outline-offset: 1px;
  }

  .item-system {
    font-size: 15px;
    font-weight: 600;
  }

  .item-meta {
    color: var(--color-text-muted);
    font-size: 13px;
  }
</style>
