<script lang="ts">
  // PalaceGrid: bàn 12 cung. Khi mọi cung có địa chi chuẩn → bố cục bàn Tử Vi truyền thống
  // 4x4 (12 cung quanh viền, trung cung ở giữa cho slot tóm tắt bản mệnh), kể cả trên mobile
  // (bàn co giãn theo bề rộng + cuộn ngang khi quá hẹp). Ngược lại (legacy thiếu địa chi
  // chuẩn) → lưới responsive xếp theo index.
  //
  // Quyết định bố cục lấy từ helper thuần `shouldUseSquareBoard` (chỉ tiêu thụ, không viết
  // lại). Định vị ô theo địa chi là việc trình bày (CSS grid). Tam phương tứ chính của cung
  // đang chọn tính qua helper thuần `palace-aspect` trên index vòng cung — KHÔNG import core.
  //
  // US-011: lớp SVG overlay vẽ đường nối tam phương tứ chính + hover-dim. Ba trạng thái:
  //   - Mặc định (chưa tương tác): auto-chọn cung Mệnh làm cung hiệu lực → vẽ sẵn đường nối +
  //     làm nổi tam phương tứ chính, KHÔNG mờ ô nào. Auto-Mệnh là trạng thái TRÌNH BÀY cục bộ
  //     của bàn, KHÔNG ghi vào `selectedPalaceKey` của model (model đó điều khiển phạm vi luận
  //     giải AI — overview vs cung; giữ nguyên mặc định overview của US-006). Tách selection
  //     của bàn khỏi explanation đúng như taibu.
  //   - Click (bền): `selectedPalaceKey` (từ model) → cung hiệu lực + đánh dấu `selected`
  //     (aria-pressed), giữ sau khi rời chuột.
  //   - Hover (tạm): `hoveredPalaceKey` (state cục bộ) ưu tiên cao nhất cho lớp trình bày;
  //     rời chuột → quay về cung đang chọn (hoặc auto-Mệnh). Hover KHÔNG đổi aria-pressed.
  import type { Snippet } from 'svelte';
  import { createQuery } from '@tanstack/svelte-query';
  import type { PalaceView } from '$lib/features/chart/palace-view-builder';
  import { shouldUseSquareBoard } from '$lib/features/chart/palace-grid-layout';
  import { getPalaceAspectIndices } from '$lib/features/chart/palace-aspect';
  import { buildAspectLines, type AspectLine, type GridCell } from '$lib/features/chart/palace-board-geometry';
  import { buildPalaceFlowFlagsMap, type PalaceFlowView } from '$lib/features/chart/palace-flow-flags';
  import {
    fetchChartHoroscope,
    DEFAULT_HOROSCOPE_SCOPES,
    HOROSCOPE_QUERY_STALE_MS,
    HOROSCOPE_QUERY_GC_MS,
  } from '$lib/api-client';
  import { getAuthStore } from '$lib/auth/auth-context';
  import PalaceCell from './PalaceCell.svelte';

  // Cung Mệnh (auto-chọn mặc định cho lớp trình bày). Khớp nameKey snapshot (US-006).
  const SOUL_PALACE_KEY = 'soulPalace';

  interface Props {
    palaces: PalaceView[];
    selectedPalaceKey: string | null;
    onSelect: (nameKey: string) => void;
    /** US-014: id lá số để fetch vận hạn. Trống → tắt flow-info. */
    chartId?: string;
    /** US-014: bật lớp flow-info đa màu (mặc định bật; tắt cho test / non-Tử-Vi). */
    enableFlowInfo?: boolean;
    /** Slot trung cung (tóm tắt bản mệnh) — chỉ hiển thị ở bố cục bàn vuông. */
    center?: Snippet;
  }

  let { palaces, selectedPalaceKey, onSelect, chartId = '', enableFlowInfo = true, center }: Props = $props();

  const auth = getAuthStore();

  // US-014: lát cắt vận hạn = hôm nay. asOf suy ra client-side (chấp nhận lệch múi giờ ±1 ngày,
  // đủ cho Phase 1 — panel tương tác chọn mốc là US-015). Cố định trong vòng đời component.
  const asOf = new Date().toISOString().slice(0, 10);

  // Vận hạn deterministic theo (chartId, asOf) → staleTime dài. Token đọc TƯƠI trong queryFn
  // (bất biến §3). Lỗi/đang tải KHÔNG chặn render bàn (degrade gọn: map rỗng).
  const horoscopeQuery = createQuery(() => ({
    queryKey: ['horoscope', chartId, asOf],
    queryFn: () => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new Error('Thiếu token để tính vận hạn.');
      }
      return fetchChartHoroscope(token, chartId, asOf, DEFAULT_HOROSCOPE_SCOPES);
    },
    enabled:
      enableFlowInfo &&
      palaces.length === 12 &&
      chartId.length > 0 &&
      auth.isAuthenticated &&
      !!auth.getAccessToken(),
    staleTime: HOROSCOPE_QUERY_STALE_MS,
    gcTime: HOROSCOPE_QUERY_GC_MS,
  }));

  // Map palaceIndex → flow-flags. translateZiweiKey fail-fast: snapshot legacy có key lạ →
  // throw trong helper → bắt ở đây, degrade thành map rỗng (bàn vẫn render, không flow-info).
  const flagsByIndex = $derived.by<Map<number, PalaceFlowView>>(() => {
    const frame = horoscopeQuery.data?.frame ?? null;
    if (!frame) {
      return new Map<number, PalaceFlowView>();
    }
    try {
      return buildPalaceFlowFlagsMap(palaces, frame);
    } catch (error) {
      console.warn('[palace-grid] bỏ qua flow-info do key vận hạn lạ', error);
      return new Map<number, PalaceFlowView>();
    }
  });

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

  // Hover tạm (preview tam phương tứ chính); null khi rời chuột. Tách khỏi selectedPalaceKey.
  let hoveredPalaceKey = $state<string | null>(null);

  // Cung Mệnh có trong bàn không (auto-chọn mặc định). null khi snapshot thiếu Mệnh → không vẽ.
  const soulPalaceKey = $derived(
    palaces.some((palace) => palace.nameKey === SOUL_PALACE_KEY) ? SOUL_PALACE_KEY : null,
  );

  // Cung hiệu lực cho lớp trình bày (đường nối + nổi + dim), theo thứ tự ưu tiên:
  // hover (tạm) → click (bền) → auto-Mệnh (mặc định). null khi thiếu cả ba → không vẽ gì.
  const activePalaceKey = $derived(hoveredPalaceKey ?? selectedPalaceKey ?? soulPalaceKey);

  const activePalace = $derived<PalaceView | null>(
    palaces.find((palace) => palace.nameKey === activePalaceKey) ?? null,
  );

  // Tập index tam phương tứ chính của cung hiệu lực. Rỗng khi không có cung hiệu lực.
  const aspectIndices = $derived.by<Set<number>>(() => {
    if (!activePalace) {
      return new Set<number>();
    }
    return new Set(getPalaceAspectIndices(activePalace.index));
  });

  // inAspect = thuộc tam phương tứ chính của cung hiệu lực NHƯNG không phải chính cung hiệu lực
  // (chính cung dùng style `selected` riêng khi là cung click; không tô trùng viền aspect).
  function isInAspect(palace: PalaceView): boolean {
    return palace.nameKey !== activePalaceKey && aspectIndices.has(palace.index);
  }

  // dim chỉ bật khi đang hover (preview): mọi cung NGOÀI tam phương tứ chính của cung hover mờ
  // đi. Không hover (mặc định / chỉ click) → không mờ ô nào, giữ bàn rõ như lá số giấy.
  function isDimmed(palace: PalaceView): boolean {
    return hoveredPalaceKey !== null && !aspectIndices.has(palace.index);
  }

  function handleHover(nameKey: string | null): void {
    hoveredPalaceKey = nameKey;
  }

  function cellStyle(palace: PalaceView): string {
    const position = BRANCH_GRID_POSITION[palace.earthlyBranchKey];
    if (!position) {
      return '';
    }
    return `grid-row: ${position.row}; grid-column: ${position.col};`;
  }

  // --- Lớp đường nối SVG (chỉ ở bố cục bàn vuông) ---
  // CSS grid của bàn là 1-indexed; hình học SVG (palace-board-geometry) dùng 0-indexed.
  function toGridCell(palace: PalaceView): GridCell | null {
    const position = BRANCH_GRID_POSITION[palace.earthlyBranchKey];
    if (!position) {
      return null;
    }
    return { row: position.row - 1, col: position.col - 1 };
  }

  // Đoạn thẳng nối từ cung hiệu lực tới từng cung tam phương tứ chính (đã loại chính cung).
  // Rỗng khi: không bàn vuông, không cung hiệu lực, hoặc không định vị được ô (degrade gọn).
  const aspectLines = $derived.by<AspectLine[]>(() => {
    if (!useSquareBoard || !activePalace) {
      return [];
    }
    const fromCell = toGridCell(activePalace);
    if (!fromCell) {
      return [];
    }
    const toCells = palaces
      .filter((palace) => palace.nameKey !== activePalaceKey && aspectIndices.has(palace.index))
      .map(toGridCell)
      .filter((cell): cell is GridCell => cell !== null);
    return buildAspectLines(fromCell, toCells);
  });
</script>

{#if useSquareBoard}
  <div class="board-scroll">
    <div class="board" role="group" aria-label="Bàn 12 cung">
      <!-- Lớp đường nối tam phương tứ chính: SVG phủ tuyệt đối lên bàn, toạ độ viewBox 0–100
           khớp lưới co giãn (preserveAspectRatio="none"). Trang trí thuần → aria-hidden +
           pointer-events none để không chắn click/hover của ô. -->
      {#if aspectLines.length > 0}
        <svg
          class="aspect-overlay"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {#each aspectLines as line (`${line.x1}-${line.y1}-${line.x2}-${line.y2}`)}
            <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
          {/each}
        </svg>
      {/if}
      {#each palaces as palace (palace.nameKey)}
        <div class="board-slot" style={cellStyle(palace)}>
          <PalaceCell
            {palace}
            selected={palace.nameKey === selectedPalaceKey}
            inAspect={isInAspect(palace)}
            dimmed={isDimmed(palace)}
            flowFlags={flagsByIndex.get(palace.index) ?? null}
            {onSelect}
            onHover={handleHover}
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
        flowFlags={flagsByIndex.get(palace.index) ?? null}
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
    position: relative;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(4, minmax(116px, auto));
    gap: var(--space-sm);
    /* Bàn co giãn theo container nhưng không bóp các ô dưới mức đọc được → cuộn ngang. */
    min-width: 560px;
  }

  /* Đường nối phủ toàn bàn, nằm trên ô (z) nhưng không chắn tương tác. preserveAspectRatio
     none cho phép toạ độ 0–100 co giãn khớp lưới. */
  .aspect-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  }

  .aspect-overlay line {
    stroke: var(--color-accent-gold-soft);
    stroke-width: 0.5;
    stroke-opacity: 0.7;
    vector-effect: non-scaling-stroke;
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
