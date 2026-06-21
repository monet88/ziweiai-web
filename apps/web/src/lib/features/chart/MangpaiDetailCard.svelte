<script lang="ts">
  // MangpaiDetailCard: chi tiết Mạnh Phái (US-017d). Presentational thuần — luận giải đặt trên
  // Bát Tự nên hiển thị thêm khối tứ trụ (tái dùng formatter Bát Tự) phía dưới phần luận Mạnh
  // Phái. Mọi chuỗi đã guard chữ Hán qua chart-display.
  import type { ChartDetailResponse } from '@ziweiai/contracts';
  import { SummaryCard } from '$lib/components/ui';
  import {
    formatBaziMetaItems,
    formatBaziPillarRows,
    formatMangpaiInsightItems,
    formatMangpaiNarrative,
    formatMangpaiTitle,
  } from './chart-display';

  interface Props {
    snapshot: ChartDetailResponse['snapshot'];
  }

  let { snapshot }: Props = $props();

  const title = $derived(formatMangpaiTitle(snapshot));
  const narrative = $derived(formatMangpaiNarrative(snapshot));
  const insightItems = $derived(formatMangpaiInsightItems(snapshot));
  const pillarRows = $derived(formatBaziPillarRows(snapshot));
  const metaItems = $derived(formatBaziMetaItems(snapshot));
</script>

<div class="cards">
  {#if title}
    <section class="reading" aria-labelledby="mangpai-title">
      <h3 class="reading-title" id="mangpai-title">{title}</h3>
      <p class="reading-narrative">{narrative}</p>
    </section>
  {/if}
  {#if insightItems.length > 0}
    <SummaryCard title="Luận giải Mạnh Phái" items={insightItems} />
  {/if}
  {#if pillarRows.length > 0}
    <SummaryCard title="Tứ trụ" items={pillarRows} />
  {/if}
  {#if metaItems.length > 0}
    <SummaryCard title="Mệnh bàn" items={metaItems} />
  {/if}
</div>

<style>
  .cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .reading {
    padding: var(--space-lg);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-lg);
    background: var(--color-bg-surface);
  }

  .reading-title {
    margin: 0 0 var(--space-sm);
    color: var(--color-accent-gold-soft);
    font-size: 16px;
    font-weight: 600;
  }

  .reading-narrative {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 1.6;
  }
</style>
