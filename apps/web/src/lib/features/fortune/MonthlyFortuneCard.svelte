<script lang="ts">
  // MonthlyFortuneCard (US-016): card vận tháng — tương tự DailyFortuneCard, đổi sang
  // fetchMonthlyFortune cho mốc tháng hiện tại (YYYY-MM). Thuần đọc, KHÔNG LLM.
  import { createQuery } from '@tanstack/svelte-query';
  import type { MonthlyFortuneResponse } from '@ziweiai/contracts';
  import type { AuthStore } from '$lib/auth/auth-store.svelte';
  import { fetchMonthlyFortune, MONTHLY_FORTUNE_QUERY_STALE_MS } from '$lib/api-client';
  import { currentMonthAsOf } from './fortune-dates';
  import { viCopy } from '$lib/i18n/vi';

  interface Props {
    auth: AuthStore;
    chartId: string;
  }

  let { auth, chartId }: Props = $props();

  const copy = viCopy.fortune.monthly;
  const asOf = currentMonthAsOf();

  const query = createQuery<MonthlyFortuneResponse>(() => {
    const token = auth.getAccessToken();
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

<article class="fortune-card" aria-labelledby="monthly-fortune-title">
  <header class="fortune-card__head">
    <h3 class="fortune-card__title" id="monthly-fortune-title">{copy.title}</h3>
    <span class="fortune-card__date">{asOf}</span>
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
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
  }

  .fortune-card__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  .fortune-card__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .fortune-card__date {
    font-size: 13px;
    color: var(--color-text-secondary);
    font-variant-numeric: tabular-nums;
  }

  .fortune-card__summary {
    margin: 0;
    line-height: 1.6;
    color: var(--color-text-primary);
  }

  .fortune-card__status {
    margin: 0;
    color: var(--color-text-secondary);
  }

  .fortune-card__error {
    margin: 0;
    color: var(--color-danger, #c0392b);
  }
</style>
