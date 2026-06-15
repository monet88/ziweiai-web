<script lang="ts">
  // QimenDetailCard: chi tiết Kỳ Môn Độn Giáp (US-007). Presentational thuần — thẻ tóm
  // tắt cục/nguyên + lưới cửu cung 3x3 theo bố cục Lạc Thư (buildQimenPalaceCells trả
  // mảng đã sắp đúng thứ tự 4-9-2/3-5-7/8-1-6). Mọi nhãn đã dịch tiếng Việt; ô trống
  // (trung cung không cửa/thần) hiển thị gạch ngang. Lưới gom 1 cột ở màn hẹp.
  import type { ChartDetailResponse } from '@ziweiai/contracts';
  import { SummaryCard } from '$lib/components/ui';
  import { formatQimenMetaItems, buildQimenPalaceCells } from './chart-display';

  interface Props {
    snapshot: ChartDetailResponse['snapshot'];
  }

  let { snapshot }: Props = $props();

  const metaItems = $derived(formatQimenMetaItems(snapshot));
  const cells = $derived(buildQimenPalaceCells(snapshot));
</script>

<div class="cards">
  {#if metaItems.length > 0}
    <SummaryCard title="Cục Kỳ Môn" items={metaItems} />
  {/if}

  {#if cells.length > 0}
    <section class="board" aria-label="Bàn cửu cung Kỳ Môn">
      {#each cells as cell (cell.palaceIndex)}
        <div class="cell" class:center={cell.palaceIndex === 5}>
          <span class="cell-index">Cung {cell.palaceIndex}</span>
          {#if cell.spirit}<span class="cell-line spirit">{cell.spirit}</span>{/if}
          {#if cell.star}<span class="cell-line star">{cell.star}{#if cell.companionStar} · {cell.companionStar}{/if}</span>{/if}
          {#if cell.gate}<span class="cell-line gate">{cell.gate}</span>{/if}
          {#if cell.heavenStem || cell.earthStem}
            <span class="cell-line stems">{cell.heavenStem ?? '—'} / {cell.earthStem ?? '—'}</span>
          {/if}
        </div>
      {/each}
    </section>
  {/if}
</div>

<style>
  .cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-sm);
  }

  .cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-height: 96px;
    padding: var(--space-md);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
  }

  .cell.center {
    border-color: var(--color-border-gold);
  }

  .cell-index {
    color: var(--color-text-muted);
    font-size: 11px;
    letter-spacing: 0.4px;
  }

  .cell-line {
    font-size: 13px;
    line-height: 1.4;
  }

  .cell-line.star {
    color: var(--color-accent-gold-soft);
    font-weight: 600;
  }

  .cell-line.gate {
    color: var(--color-text-primary);
  }

  .cell-line.spirit {
    color: var(--color-text-secondary);
  }

  .cell-line.stems {
    color: var(--color-text-muted);
    font-size: 12px;
  }

  /* Màn hẹp (<560px): cửu cung gom 1 cột để ô không bị bóp vỡ chữ. */
  @media (max-width: 560px) {
    .board {
      grid-template-columns: 1fr;
    }
  }
</style>
