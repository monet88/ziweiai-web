<script lang="ts">
  // MonthlyFortuneCard (US-016): card vận tháng — tương tự DailyFortuneCard, đổi sang
  // fetchMonthlyFortune cho mốc tháng hiện tại (YYYY-MM). Thuần đọc, KHÔNG LLM.
  import { createQuery } from '@tanstack/svelte-query';
  import type { MonthlyFortuneResponse } from '@ziweiai/contracts';
  import type { AuthStore } from '$lib/auth/auth-store.svelte';
  import { fetchMonthlyFortune, MONTHLY_FORTUNE_QUERY_STALE_MS } from '$lib/api-client';
  import { createCurrentDate } from './current-date.svelte';
  import { viCopy } from '$lib/i18n/vi';

  interface Props {
    auth: AuthStore;
    chartId: string;
  }

  let { auth, chartId }: Props = $props();

  const copy = viCopy.fortune.monthly;
  // Mốc tháng PHẢN ỨNG (không đóng băng lúc mount): phiên dài qua giao thừa tháng sẽ tự đổi queryKey → fetch lại.
  const date = createCurrentDate();

  const query = createQuery<MonthlyFortuneResponse>(() => {
    const token = auth.getAccessToken();
    const asOf = date.month;
    return {
      queryKey: ['fortune', 'monthly', token, chartId, asOf],
      queryFn: (): Promise<MonthlyFortuneResponse> => {
        const fresh = auth.getAccessToken();
        if (!fresh) {
          throw new Error(viCopy.errors.missingChartContext);
        }
        return fetchMonthlyFortune(fresh, chartId, asOf);
      },
      enabled: auth.isAuthenticated && !!token && chartId.length > 0,
      staleTime: MONTHLY_FORTUNE_QUERY_STALE_MS,
      gcTime: 24 * 60 * 60 * 1000,
    };
  });
</script>

<article class="fortune-card surface-glass" data-reveal aria-labelledby="monthly-fortune-title">
  <header class="fortune-card__head">
    <h3 class="fortune-card__title" id="monthly-fortune-title">{copy.title}</h3>
    <span class="fortune-card__date">{date.month}</span>
  </header>

  {#if query.isPending}
    <p class="fortune-card__status">{copy.loading}</p>
  {:else if query.isError}
    <p class="fortune-card__error" role="alert">{copy.error}</p>
  {:else if query.data}
    <p class="fortune-card__summary">{query.data.summary}</p>
  {:else}
    <p class="fortune-card__status">{copy.empty}</p>
  {/if}
</article>

<style>
  .fortune-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-lg);
    border-radius: var(--radius-lg, 16px);
    background: rgba(15, 23, 42, 0.55);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .fortune-card:hover {
    border-color: rgba(99, 102, 241, 0.35);
    box-shadow: 0 8px 30px rgba(99, 102, 241, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }

  .fortune-card__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  .fortune-card__title {
    margin: 0;
    font-size: 16px;
    font-weight: 650;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .fortune-card__date {
    font-size: 12px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 9999px;
    background: rgba(99, 102, 241, 0.12);
    border: 1px solid rgba(99, 102, 241, 0.25);
    color: #818cf8;
    font-variant-numeric: tabular-nums;
  }

  .fortune-card__summary {
    margin: 0;
    line-height: 1.65;
    color: var(--color-text-primary);
    font-size: 14px;
  }

  .fortune-card__status {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 14px;
  }

  .fortune-card__error {
    margin: 0;
    color: var(--color-accent-danger);
    font-size: 14px;
  }
</style>
