<script lang="ts">
  // LiuyaoDetailCard: chi tiết Lục Hào (US-007). Presentational thuần — nhận snapshot,
  // dựng các thẻ tóm tắt qua formatter chart-display (đã guard chữ Hán: tên quẻ, phục
  // thần là chuỗi tự do từ engine). Sáu hào hiển thị từ trên (hào 6) xuống dưới (hào 1)
  // theo quy ước Dịch học.
  import type { ChartDetailResponse } from '@ziweiai/contracts';
  import { SummaryCard } from '$lib/components/ui';
  import { formatLiuyaoHexagramItems, formatLiuyaoMetaItems, formatLiuyaoLineDescription } from './chart-display';

  interface Props {
    snapshot: ChartDetailResponse['snapshot'];
  }

  let { snapshot }: Props = $props();

  const hexagramItems = $derived(formatLiuyaoHexagramItems(snapshot));
  const metaItems = $derived(formatLiuyaoMetaItems(snapshot));

  // Hào sắp từ trên (vị trí 6) xuống dưới (vị trí 1) theo cách vẽ quẻ truyền thống.
  const lineRows = $derived(
    snapshot.liuyao
      ? [...snapshot.liuyao.baseHexagram.lines]
          .sort((a, b) => b.position - a.position)
          .map((line) => ({
            label: `Hào ${line.position}`,
            value: formatLiuyaoLineDescription(line),
          }))
      : [],
  );
</script>

<div class="cards">
  {#if hexagramItems.length > 0}
    <SummaryCard title="Quẻ" items={hexagramItems} />
  {/if}
  {#if metaItems.length > 0}
    <SummaryCard title="Tóm tắt quẻ" items={metaItems} />
  {/if}
  {#if lineRows.length > 0}
    <SummaryCard title="Sáu hào" items={lineRows} />
  {/if}
</div>

<style>
  .cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }
</style>
