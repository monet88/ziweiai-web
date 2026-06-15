<script lang="ts">
  // PalaceGrid: bàn 12 cung. Khi mọi cung có địa chi chuẩn + màn rộng → bố cục bàn Tử Vi
  // truyền thống 4x4 (12 cung quanh viền, trung cung ở giữa cho slot tóm tắt bản mệnh).
  // Ngược lại (legacy thiếu địa chi chuẩn, hoặc màn hẹp) → lưới responsive xếp theo index.
  //
  // Quyết định bố cục lấy từ helper thuần US-003 `shouldUseWidePalaceGrid` (chỉ tiêu thụ,
  // không viết lại). Định vị ô theo địa chi là việc trình bày (CSS grid), không phải logic.
  import type { Snippet } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import type { PalaceView } from '$lib/features/chart/palace-view-builder';
  import { shouldUseWidePalaceGrid } from '$lib/features/chart/palace-grid-layout';
  import PalaceCell from './PalaceCell.svelte';

  interface Props {
    palaces: PalaceView[];
    selectedPalaceKey: string | null;
    onSelect: (nameKey: string) => void;
    /** Slot trung cung (tóm tắt bản mệnh) — chỉ hiển thị ở bố cục bàn rộng. */
    center?: Snippet;
  }

  let { palaces, selectedPalaceKey, onSelect, center }: Props = $props();

  // Vị trí ô bàn Tử Vi theo địa chi (CSS grid 4x4, 1-indexed). Nam ở trên: Tỵ-Ngọ-Mùi-Thân
  // hàng trên, viền theo chiều kim đồng hồ. Trung cung (hàng 2-3, cột 2-3) dành cho tóm tắt.
  const BRANCH_GRID_POSITION: Record<string, { row: number; col: number }> = {
    siEarthly: { row: 1, col: 1 },
    wuEarthly: { row: 1, col: 2 },
    weiEarthly: { row: 1, col: 3 },
    shenEarthly: { row: 1, col: 4 },
    youEarthly: { row: 2, col: 4 },
    xuEarthly: { row: 3, col: 4 },
    haiEarthly: { row: 4, col: 4 },
    ziEarthly: { row: 4, col: 3 },
    chouEarthly: { row: 4, col: 2 },
    yinEarthly: { row: 4, col: 1 },
    maoEarthly: { row: 3, col: 1 },
    chenEarthly: { row: 2, col: 1 },
  };

  // isWide: đủ chỗ vẽ bàn 4x4 (màn > 768px — khớp ngưỡng @media bên dưới). Dưới ngưỡng này
  // bàn 4x4 chật, ép về lưới responsive theo index. Quyết định cuối vẫn qua helper US-003
  // (chỉ bật khi mọi cung có địa chi chuẩn). MediaQuery reactive nên xoay/đổi cỡ cập nhật ngay.
  const wideScreen = new MediaQuery('min-width: 769px');
  const useWideBoard = $derived(shouldUseWidePalaceGrid(wideScreen.current, palaces));

  function cellStyle(palace: PalaceView): string {
    const position = BRANCH_GRID_POSITION[palace.earthlyBranchKey];
    if (!position) {
      return '';
    }
    return `grid-row: ${position.row}; grid-column: ${position.col};`;
  }
</script>

{#if useWideBoard}
  <div class="board" role="group" aria-label="Bàn 12 cung">
    {#each palaces as palace (palace.nameKey)}
      <div class="board-slot" style={cellStyle(palace)}>
        <PalaceCell
          {palace}
          selected={palace.nameKey === selectedPalaceKey}
          {onSelect}
        />
      </div>
    {/each}
    {#if center}
      <div class="board-center">{@render center()}</div>
    {/if}
  </div>
{:else}
  <div class="grid" role="group" aria-label="Bàn 12 cung">
    {#each palaces as palace (palace.nameKey)}
      <PalaceCell
        {palace}
        selected={palace.nameKey === selectedPalaceKey}
        {onSelect}
      />
    {/each}
  </div>
{/if}

<style>
  .board {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(4, minmax(116px, auto));
    gap: var(--space-sm);
  }

  .board-slot {
    display: flex;
  }

  .board-center {
    grid-row: 2 / 4;
    grid-column: 2 / 4;
    display: flex;
    flex-direction: column;
    padding: var(--space-md);
    border: 1px solid var(--color-border-gold);
    border-radius: var(--radius-md);
    background: var(--color-bg-elevated);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--space-sm);
  }
</style>
