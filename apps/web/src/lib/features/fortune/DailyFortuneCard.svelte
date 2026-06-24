<script lang="ts">
  // DailyFortuneCard (US-016): card vận ngày hiển thị ở chi tiết lá số Tử Vi.
  // Thuần đọc (KHÔNG LLM): createQuery gọi fetchDailyFortune cho mốc hôm nay. Token đọc TƯƠI
  // trong queryFn (bất biến §3), gắn token vào queryKey để cache tách theo phiên. Mọi nhãn
  // tiếng Việt qua viCopy; summary do server render (đã đảm bảo không rò Hán ở backend).
  import { createQuery } from '@tanstack/svelte-query';
  import type { DailyFortuneResponse } from '@ziweiai/contracts';
  import type { AuthStore } from '$lib/auth/auth-store.svelte';
  import { fetchDailyFortune, DAILY_FORTUNE_QUERY_STALE_MS } from '$lib/api-client';
  import { createCurrentDate } from './current-date.svelte';
  import { viCopy } from '$lib/i18n/vi';

  interface Props {
    auth: AuthStore;
    chartId: string;
  }

  let { auth, chartId }: Props = $props();

  const copy = viCopy.fortune.daily;
  // Mốc ngày PHẢN ỨNG (không đóng băng lúc mount): phiên dài qua nửa đêm sẽ tự đổi queryKey → fetch lại.
  const date = createCurrentDate();

  const query = createQuery<DailyFortuneResponse>(() => {
    const token = auth.getAccessToken();
    const asOf = date.today;
    return {
      queryKey: ['fortune', 'daily', token, chartId, asOf],
      queryFn: (): Promise<DailyFortuneResponse> => {
        const fresh = auth.getAccessToken();
        if (!fresh) {
          throw new Error(viCopy.errors.missingChartContext);
        }
        return fetchDailyFortune(fresh, chartId, asOf);
      },
      enabled: auth.isAuthenticated && !!token && chartId.length > 0,
      staleTime: DAILY_FORTUNE_QUERY_STALE_MS,
      gcTime: 24 * 60 * 60 * 1000,
    };
  });
</script>

<article class="fortune-card" aria-labelledby="daily-fortune-title">
  <header class="fortune-card__head">
    <h3 class="fortune-card__title" id="daily-fortune-title">{copy.title}</h3>
    <span class="fortune-card__date">{date.today}</span>
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
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-lg);
    background: var(--color-bg-surface);
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
    color: var(--color-accent-danger);
  }
</style>
