<script lang="ts">
  // DaliurenDetailCard: chi tiết Đại Lục Nhâm (US-007). Presentational thuần — nhận
  // snapshot, dựng các thẻ tóm tắt qua formatter chart-display (mọi key đã dịch tiếng
  // Việt). Tứ khóa + tam truyền là cấu trúc cốt lõi của bàn Đại Lục Nhâm.
  import type { ChartDetailResponse } from '@ziweiai/contracts';
  import { SummaryCard } from '$lib/components/ui';
  import {
    formatDaliurenMetaItems,
    formatDaliurenLessonItems,
    formatDaliurenTransmissionItems,
  } from './chart-display';

  interface Props {
    snapshot: ChartDetailResponse['snapshot'];
  }

  let { snapshot }: Props = $props();

  const metaItems = $derived(formatDaliurenMetaItems(snapshot));
  const lessonItems = $derived(formatDaliurenLessonItems(snapshot));
  const transmissionItems = $derived(formatDaliurenTransmissionItems(snapshot));
</script>

<div class="cards">
  {#if metaItems.length > 0}
    <SummaryCard title="Thiên địa bàn" items={metaItems} />
  {/if}
  {#if lessonItems.length > 0}
    <SummaryCard title="Tứ khóa" items={lessonItems} />
  {/if}
  {#if transmissionItems.length > 0}
    <SummaryCard title="Tam truyền" items={transmissionItems} />
  {/if}
</div>

<style>
  .cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }
</style>
