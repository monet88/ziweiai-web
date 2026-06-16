<script lang="ts">
  // PalaceGrid: bàn 12 cung. Khi mọi cung có địa chi chuẩn → bố cục bàn Tử Vi truyền thống
  // 4x4 (12 cung quanh viền, trung cung ở giữa cho slot tóm tắt bản mệnh), kể cả trên mobile
  // (bàn co giãn theo bề rộng + cuộn ngang khi quá hẹp). Ngược lại (legacy thiếu địa chi
  // chuẩn) → lưới responsive xếp theo index.
  //
  // Quyết định bố cục lấy từ helper thuần `shouldUseSquareBoard` (chỉ tiêu thụ, không viết
  // lại). Định vị ô theo địa chi là việc trình bày (CSS grid). Tam phương tứ chính của cung
  // đang chọn tính qua helper thuần `palace-aspect` trên index vòng cung — KHÔNG import core.
  import type { Snippet } from 'svelte';
  import type { PalaceView } from '$lib/features/chart/palace-view-builder';
  import { shouldUseSquareBoard } from '$lib/features/chart/palace-grid-layout';
  import { getPalaceAspectIndices } from '$lib/features/chart/palace-aspect';
  import PalaceCell from './PalaceCell.svelte';

  interface Props {
    palaces: PalaceView[];
    selectedPalaceKey: string | null;
    onSelect: (nameKey: string) => void;
    /** Slot trung cung (tóm tắt bản mệnh) — chỉ hiển thị ở bố cục bàn vuông. */
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

  const useSquareBoard = $derived(shouldUseSquareBoard(palaces));

  // index vòng cung của cung đang chọn → tập tam phương tứ chính để làm nổi. null khi chưa
  // chọn (không cung nào nổi). Dùng Set cho tra cứu O(1) khi render từng ô.
  const aspectIndices = $derived.by<Set<number>>(() => {
    const selected = palaces.find((palace) => palace.nameKey === selectedPalaceKey);
    if (!selected) {
      return new Set<number>();
    }
    return new Set(getPalaceAspectIndices(selected.index));
  });

  // inAspect = thuộc tam phương tứ chính NHƯNG không phải chính cung đang chọn (chính cung đã
  // có style `selected` riêng, không tô trùng).
  function isInAspect(palace: PalaceView): boolean {
    return palace.nameKey !== selectedPalaceKey && aspectIndices.has(palace.index);
  }

  function cellStyle(palace: PalaceView): string {
    const position = BRANCH_GRID_POSITION[palace.earthlyBranchKey];
    if (!position) {
      return '';
    }
    return `grid-row: ${position.row}; grid-column: ${position.col};`;
  }
</script>

{#if useSquareBoard}
  <div class="board-scroll">
    <div class="board" role="group" aria-label="Bàn 12 cung">
      {#each palaces as palace (palace.nameKey)}
        <div class="board-slot" style={cellStyle(palace)}>
          <PalaceCell
            {palace}
            selected={palace.nameKey === selectedPalaceKey}
            inAspect={isInAspect(palace)}
            {onSelect}
          />
        </div>
      {/each}
      {#if center}
        <div class="board-center">{@render center()}</div>
      {/if}
    </div>
  </div>
{:else}
  <div class="grid" role="group" aria-label="Bàn 12 cung">
    {#each palaces as palace (palace.nameKey)}
      <PalaceCell
        {palace}
        selected={palace.nameKey === selectedPalaceKey}
        inAspect={isInAspect(palace)}
        {onSelect}
      />
    {/each}
  </div>
{/if}

<style>
  /* Cho bàn vuông cuộn ngang khi màn quá hẹp thay vì vỡ layout (US-008: hiển thị cả mobile). */
  .board-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .board {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(4, minmax(116px, auto));
    gap: var(--space-sm);
    /* Bàn co giãn theo container nhưng không bóp các ô dưới mức đọc được → cuộn ngang. */
    min-width: 560px;
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
