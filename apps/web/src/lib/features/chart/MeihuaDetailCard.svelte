<script lang="ts">
  // MeihuaDetailCard: chi tiết Mai Hoa Dịch Số (US-007). Presentational thuần — meta quẻ
  // + ba quẻ (chính/hỗ/biến) qua formatter chart-display (đã key-hóa, không chữ Hán).
  import type { ChartDetailResponse } from '@ziweiai/contracts';
  import { SummaryCard } from '$lib/components/ui';
  import { formatMeihuaMetaItems, formatMeihuaHexagramItems } from './chart-display';

  interface Props {
    snapshot: ChartDetailResponse['snapshot'];
  }

  let { snapshot }: Props = $props();

  const metaItems = $derived(formatMeihuaMetaItems(snapshot));
  const hexagramItems = $derived(formatMeihuaHexagramItems(snapshot));
</script>

<div class="cards">
  {#if metaItems.length > 0}
    <SummaryCard title="Thông tin quẻ" items={metaItems} />
  {/if}
  {#if hexagramItems.length > 0}
    <SummaryCard title="Quẻ tượng" items={hexagramItems} />
  {/if}
</div>

<style>
  .cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }
</style>
