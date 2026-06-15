<script lang="ts">
  // BaziDetailCard: chi tiết Bát Tự (US-007). Presentational thuần — nhận snapshot,
  // dựng các thẻ tóm tắt qua formatter chart-display (đã guard chữ Hán). Tứ trụ hiển
  // thị dạng lưới, gom 1 cột ở màn hẹp qua media query (không đo width bằng JS).
  import type { ChartDetailResponse } from '@ziweiai/contracts';
  import { SummaryCard } from '$lib/components/ui';
  import { formatBaziMetaItems, formatBaziPillarRows } from './chart-display';

  interface Props {
    snapshot: ChartDetailResponse['snapshot'];
  }

  let { snapshot }: Props = $props();

  const pillarRows = $derived(formatBaziPillarRows(snapshot));
  const metaItems = $derived(formatBaziMetaItems(snapshot));
</script>

<div class="cards">
  <SummaryCard title="Tứ trụ" items={pillarRows} />
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
</style>
