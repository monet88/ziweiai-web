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
  import type { HoroscopeOverlay } from '$lib/features/chart/horoscope-overlay';
  import { fetchChartHoroscope, DEFAULT_HOROSCOPE_SCOPES, HOROSCOPE_QUERY_STALE_MS, HOROSCOPE_QUERY_GC_MS } from '$lib/api-client/charts';;
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
    /** US-015: overlay highlight cung Mệnh vận 4 tầng (panel chọn mốc). null = không tô. */
    horoscopeOverlay?: HoroscopeOverlay | null;
    /** Slot trung cung (tóm tắt bản mệnh) — chỉ hiển thị ở bố cục bàn vuông. */
    center?: Snippet;
  }

  let {
    palaces,
    selectedPalaceKey,
    onSelect,
    chartId = '',
    enableFlowInfo = true,
    horoscopeOverlay = null,
    center,
  }: Props = $props();

  const auth = getAuthStore();

  // US-014: lát cắt vận hạn = hôm nay theo MÚI GIỜ ĐỊA PHƯƠNG của người xem. Dùng
  // getFullYear/getMonth/getDate (KHÔNG toISOString — UTC lệch 1 ngày cho GMT+7 lúc
  // 00:00–07:00, hiển thị sai lưu nhật). SPA tĩnh không SSR nên client-local an toàn.
  // Cố định trong vòng đời component (panel tương tác chọn mốc là US-015).
  const now = new Date();
  const asOf = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Vận hạn deterministic theo (chartId, asOf) → staleTime dài. Token vào queryKey để tách
  // cache theo phiên (đổi user / đăng xuất không tái dùng frame cũ — khớp pattern US-006);
  // token vẫn đọc TƯƠI trong queryFn (bất biến §3). Lỗi/đang tải KHÔNG chặn render bàn.
  const horoscopeQuery = createQuery(() => ({
    queryKey: ['horoscope', auth.getAccessToken(), chartId, asOf],
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

  // US-015: 4 boolean overlay vận hạn cho 1 cung (theo index). null overlay → tất cả false →
  // bàn về trạng thái US-011 thuần. Tách hẳn isInAspect (US-011) — hai overlay sống chung.
  function horoscopeFlags(palace: PalaceView): {
    isInDecadal: boolean;
    isInYearly: boolean;
    isInMonthly: boolean;
    isInDaily: boolean;
  } {
    const overlay = horoscopeOverlay;
    if (!overlay) {
      return { isInDecadal: false, isInYearly: false, isInMonthly: false, isInDaily: false };
    }
    return {
      isInDecadal: overlay.decadalPalaceIndex === palace.index,
      isInYearly: overlay.yearlyPalaceIndex === palace.index,
      isInMonthly: overlay.monthlyPalaceIndex === palace.index,
      isInDaily: overlay.dailyPalaceIndex === palace.index,
    };
  }

  // Smart Mobile View Modes
  type ViewMode = 'board' | 'list' | 'groups';
  let viewMode = $state<ViewMode>('board');
  let fitMobile = $state(true);
  let activeGroupIndex = $state(0);

  const PALACE_GROUPS = [
    {
      id: 'menh-tai-quan',
      title: 'Mệnh · Tài · Quan · Di',
      desc: 'Bản mệnh, tài lộc, sự nghiệp & đối ngoại',
      keys: ['soulPalace', 'wealthPalace', 'careerPalace', 'surfacePalace', 'travelPalace'],
      names: ['Mệnh', 'Tài Bạch', 'Quan Lộc', 'Thiên Di'],
    },
    {
      id: 'phuc-the-di',
      title: 'Phúc · Phối · Di',
      desc: 'Phúc đức tổ tiên, hôn nhân tình duyên & xuất hành',
      keys: ['spiritPalace', 'blessingPalace', 'spousePalace', 'surfacePalace', 'travelPalace'],
      names: ['Phúc Đức', 'Phu Thê', 'Thiên Di'],
    },
    {
      id: 'dien-huynh-tat',
      title: 'Điền · Huynh · Tật',
      desc: 'Đất đai điền sản, huynh đệ bạn bè & sức khỏe bệnh tật',
      keys: ['propertyPalace', 'siblingsPalace', 'siblingPalace', 'healthPalace'],
      names: ['Điền Trạch', 'Huynh Đệ', 'Tật Ách'],
    },
    {
      id: 'phu-tu-no',
      title: 'Phụ · Tử · Nô',
      desc: 'Cha mẹ phụ mẫu, con cái tử tức & bằng hữu nô bộc',
      keys: ['parentsPalace', 'parentPalace', 'childrenPalace', 'friendsPalace'],
      names: ['Phụ Mẫu', 'Tử Tức', 'Tử Nữ', 'Nô Bộc'],
    },
  ];

  const currentGroupPalaces = $derived.by(() => {
    const group = PALACE_GROUPS[activeGroupIndex];
    if (!group) return [];
    return palaces.filter(
      (p) => group.keys.includes(p.nameKey) || group.names.some((n) => p.name.includes(n)),
    );
  });
</script>

<div class="palace-grid-container">
  <!-- Smart View Switcher: Bàn Cờ Cổ Điển vs Danh Sách Dọc vs Bộ Tam Hợp -->
  <header class="view-switcher-bar">
    <div class="view-tabs" role="tablist" aria-label="Chế độ hiển thị 12 cung">
      <button
        type="button"
        class="view-tab"
        class:active={viewMode === 'board'}
        onclick={() => (viewMode = 'board')}
        role="tab"
        aria-selected={viewMode === 'board'}
      >
        <span class="tab-icon">⊞</span>
        <span>Bàn cờ 4x4</span>
      </button>

      <button
        type="button"
        class="view-tab"
        class:active={viewMode === 'list'}
        onclick={() => (viewMode = 'list')}
        role="tab"
        aria-selected={viewMode === 'list'}
      >
        <span class="tab-icon">☰</span>
        <span>Danh sách cung</span>
      </button>

      <button
        type="button"
        class="view-tab"
        class:active={viewMode === 'groups'}
        onclick={() => (viewMode = 'groups')}
        role="tab"
        aria-selected={viewMode === 'groups'}
      >
        <span class="tab-icon">❖</span>
        <span>Bộ Tam Hợp</span>
      </button>
    </div>

    {#if viewMode === 'board'}
      <div class="board-toggles">
        <button
          type="button"
          class="btn-fit-toggle"
          class:active={fitMobile}
          onclick={() => (fitMobile = !fitMobile)}
          title="Bật/tắt co giãn vừa khít màn hình trên mobile"
        >
          <span>{fitMobile ? '⇲ Vừa màn hình' : '⇄ Cuộn ngang'}</span>
        </button>
      </div>
    {/if}
  </header>

  {#if viewMode === 'board'}
    {#if useSquareBoard}
      <div class="board-scroll" class:fit-width={fitMobile}>
        <div class="board" class:fit-width={fitMobile} role="group" aria-label="Bàn 12 cung">
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
            {@const flags = horoscopeFlags(palace)}
            <div class="board-slot" style={cellStyle(palace)}>
              <PalaceCell
                {palace}
                selected={palace.nameKey === selectedPalaceKey}
                inAspect={isInAspect(palace)}
                dimmed={isDimmed(palace)}
                flowFlags={flagsByIndex.get(palace.index) ?? null}
                isInDecadal={flags.isInDecadal}
                isInYearly={flags.isInYearly}
                isInMonthly={flags.isInMonthly}
                isInDaily={flags.isInDaily}
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
          {@const flags = horoscopeFlags(palace)}
          <PalaceCell
            {palace}
            selected={palace.nameKey === selectedPalaceKey}
            inAspect={isInAspect(palace)}
            flowFlags={flagsByIndex.get(palace.index) ?? null}
            isInDecadal={flags.isInDecadal}
            isInYearly={flags.isInYearly}
            isInMonthly={flags.isInMonthly}
            isInDaily={flags.isInDaily}
            {onSelect}
          />
        {/each}
      </div>
    {/if}
  {:else if viewMode === 'list'}
    <div class="list-view-container">
      {#if center}
        <div class="list-view-summary">
          {@render center()}
        </div>
      {/if}
      <div class="palaces-vertical-list">
        {#each palaces as palace (palace.nameKey)}
          {@const flags = horoscopeFlags(palace)}
          <div class="list-palace-item">
            <PalaceCell
              {palace}
              selected={palace.nameKey === selectedPalaceKey}
              inAspect={isInAspect(palace)}
              dimmed={false}
              flowFlags={flagsByIndex.get(palace.index) ?? null}
              isInDecadal={flags.isInDecadal}
              isInYearly={flags.isInYearly}
              isInMonthly={flags.isInMonthly}
              isInDaily={flags.isInDaily}
              {onSelect}
            />
          </div>
        {/each}
      </div>
    </div>
  {:else if viewMode === 'groups'}
    <div class="groups-view-container">
      <div class="groups-nav" role="tablist">
        {#each PALACE_GROUPS as group, idx (group.title)}
          <button
            type="button"
            class="group-nav-btn"
            class:active={activeGroupIndex === idx}
            onclick={() => (activeGroupIndex = idx)}
            role="tab"
            aria-selected={activeGroupIndex === idx}
          >
            <span class="group-nav-title">{group.title}</span>
          </button>
        {/each}
      </div>

      <div class="group-description">
        <p>✦ {PALACE_GROUPS[activeGroupIndex]?.desc}</p>
      </div>

      <div class="group-palaces-grid">
        {#each currentGroupPalaces as palace (palace.nameKey)}
          {@const flags = horoscopeFlags(palace)}
          <div class="group-palace-slot">
            <PalaceCell
              {palace}
              selected={palace.nameKey === selectedPalaceKey}
              inAspect={isInAspect(palace)}
              dimmed={false}
              flowFlags={flagsByIndex.get(palace.index) ?? null}
              isInDecadal={flags.isInDecadal}
              isInYearly={flags.isInYearly}
              isInMonthly={flags.isInMonthly}
              isInDaily={flags.isInDaily}
              {onSelect}
            />
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .palace-grid-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    width: 100%;
  }

  /* View Switcher Toolbar */
  .view-switcher-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    flex-wrap: wrap;
    padding: 6px 10px;
    background: rgba(15, 23, 42, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-md);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .view-tabs {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .view-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    background: transparent;
    border: 1px solid transparent;
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .view-tab:hover {
    color: var(--color-text-primary);
    background: rgba(255, 255, 255, 0.05);
  }

  .view-tab.active {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.08) 100%);
    border-color: rgba(212, 175, 55, 0.4);
    color: #d4af37;
    font-weight: 600;
  }

  .tab-icon {
    font-size: 14px;
  }

  .btn-fit-toggle {
    display: inline-flex;
    align-items: center;
    padding: 5px 10px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--color-text-muted);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-fit-toggle:hover {
    color: var(--color-text-primary);
    background: rgba(255, 255, 255, 0.08);
  }

  .btn-fit-toggle.active {
    color: #d4af37;
    border-color: rgba(212, 175, 55, 0.3);
  }

  /* Cho bàn vuông cuộn ngang khi màn quá hẹp */
  .board-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }

  .board-scroll.fit-width {
    overflow-x: hidden;
  }

  .board {
    position: relative;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(4, minmax(116px, auto));
    gap: var(--space-sm);
    min-width: 560px;
    width: 100%;
    box-sizing: border-box;
  }

  @media (max-width: 640px) {
    .board.fit-width {
      min-width: 0;
      width: 100%;
      gap: 3px;
      grid-template-rows: repeat(4, minmax(85px, auto));
    }
  }

  /* Đường nối phủ toàn bàn */
  .aspect-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  }

  .aspect-overlay line {
    stroke: var(--color-accent-primary-soft);
    stroke-width: 0.5;
    stroke-opacity: 0.7;
    vector-effect: non-scaling-stroke;
  }

  .board-slot {
    display: flex;
    width: 100%;
  }

  .board-center {
    grid-row: 2 / 4;
    grid-column: 2 / 4;
    display: flex;
    flex-direction: column;
    padding: var(--space-md);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    background: var(--color-bg-elevated);
  }

  @media (max-width: 640px) {
    .board.fit-width .board-center {
      padding: var(--space-xs);
    }
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--space-sm);
  }

  /* Danh Sách 12 Cung (Dọc) */
  .list-view-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    width: 100%;
  }

  .list-view-summary {
    padding: var(--space-md);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: var(--radius-md);
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(15, 23, 42, 0.4) 100%);
  }

  .palaces-vertical-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    width: 100%;
  }

  .list-palace-item {
    width: 100%;
  }

  /* Bộ Tam Hợp */
  .groups-view-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    width: 100%;
  }

  .groups-nav {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    width: 100%;
  }

  @media (min-width: 768px) {
    .groups-nav {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .group-nav-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .group-nav-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--color-text-primary);
  }

  .group-nav-btn.active {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.06) 100%);
    border-color: rgba(212, 175, 55, 0.45);
    color: #d4af37;
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.15);
  }

  .group-nav-title {
    font-size: 13px;
    font-weight: 600;
  }

  .group-description {
    padding: 8px 12px;
    background: rgba(212, 175, 55, 0.06);
    border-left: 3px solid #d4af37;
    border-radius: 4px;
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  .group-description p {
    margin: 0;
  }

  .group-palaces-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: var(--space-sm);
    width: 100%;
  }

  @media (min-width: 640px) {
    .group-palaces-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .group-palace-slot {
    width: 100%;
  }

  /* Dual-Theme Light Mode */
  :global([data-theme="light"]) .view-switcher-bar {
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  :global([data-theme="light"]) .view-tab {
    color: #475569;
  }

  :global([data-theme="light"]) .view-tab:hover {
    color: #0f172a;
    background: #f1f5f9;
  }

  :global([data-theme="light"]) .view-tab.active {
    background: #fef3c7;
    border-color: #f59e0b;
    color: #b45309;
  }

  :global([data-theme="light"]) .btn-fit-toggle {
    background: #ffffff;
    border-color: #cbd5e1;
    color: #64748b;
  }

  :global([data-theme="light"]) .btn-fit-toggle.active {
    color: #b45309;
    border-color: #f59e0b;
  }

  :global([data-theme="light"]) .list-view-summary {
    background: #fffbeb;
    border-color: rgba(180, 83, 9, 0.25);
  }

  :global([data-theme="light"]) .group-nav-btn {
    background: #f8fafc;
    border-color: #e2e8f0;
    color: #475569;
  }

  :global([data-theme="light"]) .group-nav-btn.active {
    background: #fef3c7;
    border-color: #f59e0b;
    color: #b45309;
  }

  :global([data-theme="light"]) .group-description {
    background: #fffbeb;
    border-left-color: #b45309;
    color: #78350f;
  }
</style>
