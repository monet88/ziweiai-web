<script lang="ts">
  // BaziDetailCard: Đồ hình Tứ Trụ Bát Tự Hoàng Gia (Khâm Thiên Giám).
  // Hỗ trợ hiển thị hoàn hảo trên cả Desktop (bảng 5 cột có mục tra cứu) và Mobile
  // (bảng 4 cột dàn đều 100% màn hình, không bị tràn hay cắt xén, có micro-label từng hàng).
  import type { ChartDetailResponse } from '@ziweiai/contracts';
  import { SummaryCard } from '$lib/components/ui';
  import { formatBaziMetaItems, formatBaziPillarRows } from './chart-display';
  import { buildBaziDossierData } from '$lib/features/dossier/bazi-dossier-interpretations';

  interface Props {
    snapshot: ChartDetailResponse['snapshot'];
  }

  let { snapshot }: Props = $props();

  // Dữ liệu fallback nếu snapshot không có cấu trúc bazi chuẩn
  const pillarRows = $derived(formatBaziPillarRows(snapshot));
  const metaItems = $derived(formatBaziMetaItems(snapshot));

  // Dữ liệu Bát Tự chi tiết chuyên sâu
  const baziData = $derived.by(() => {
    if (!snapshot?.bazi) return null;
    try {
      return buildBaziDossierData(snapshot);
    } catch {
      return null;
    }
  });

  // Chế độ xem: 'board' (Đồ hình hoàng gia) hoặc 'list' (Danh sách tóm tắt)
  let viewMode = $state<'board' | 'list'>('board');

  function getElementClass(elemName: string): string {
    const norm = (elemName || '').toLowerCase();
    if (norm.includes('kim') || norm.includes('metal')) return 'elem-metal';
    if (norm.includes('mộc') || norm.includes('moc') || norm.includes('wood')) return 'elem-wood';
    if (norm.includes('thủy') || norm.includes('thuy') || norm.includes('water')) return 'elem-water';
    if (norm.includes('hỏa') || norm.includes('hoa') || norm.includes('fire')) return 'elem-fire';
    if (norm.includes('thổ') || norm.includes('tho') || norm.includes('earth')) return 'elem-earth';
    return '';
  }

  function getPillarShortName(slot: string): string {
    switch (slot) {
      case 'year':
        return 'Trụ Năm';
      case 'month':
        return 'Trụ Tháng';
      case 'day':
        return 'Trụ Ngày';
      case 'hour':
        return 'Trụ Giờ';
      default:
        return 'Trụ';
    }
  }
</script>

{#if baziData && viewMode === 'board'}
  <div class="bazi-royal-container">
    <!-- Thanh điều khiển chế độ xem -->
    <div class="view-mode-bar">
      <div class="mode-badge">
        <span class="emblem-dot">✦</span>
        <span>KHÂM THIÊN GIÁM · TIÊN THIÊN BÁT TỰ</span>
      </div>
      <button
        type="button"
        class="btn-toggle-mode"
        onclick={() => (viewMode = 'list')}
        title="Chuyển sang dạng danh sách truyền thống"
      >
        <span>Xem dạng tóm tắt</span>
      </button>
    </div>

    <!-- 1. Thẻ Tổng Quan Nhật Chủ & Thân Mệnh -->
    <section class="bazi-card dm-overview-card" aria-label="Tổng quan Nhật Chủ">
      <div class="dm-header-row">
        <div class="dm-core-info">
          <span class="dm-sub-label">NHẬT CHỦ BẢN MỆNH</span>
          <div class="dm-title-line">
            <span class="dm-name {getElementClass(baziData.dayMasterElement)}">{baziData.dayMasterText}</span>
            <span class="dm-elem-pill {getElementClass(baziData.dayMasterElement)}">
              {baziData.dayMasterElement} ({baziData.dayMasterPolarity})
            </span>
            <span class="strength-badge" class:is-strong={baziData.dayMasterStrength.includes('Vượng')}>
              {baziData.dayMasterStrength}
            </span>
          </div>
        </div>

        <div class="dm-gods-summary">
          <div class="god-chip yong-shen">
            <span class="chip-label">Dụng Thần:</span>
            <span class="chip-value">{baziData.usefulGods.yongShen.name}</span>
          </div>
          <div class="god-chip xi-shen">
            <span class="chip-label">Hỷ Thần:</span>
            <span class="chip-value">{baziData.usefulGods.xiShen.name}</span>
          </div>
          <div class="god-chip ji-shen">
            <span class="chip-label">Kỵ Thần:</span>
            <span class="chip-value">{baziData.usefulGods.jiShen.name}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. Bảng Tứ Trụ 4 Cột Hoàng Cung (Responsive Perfect: Desktop 5 Cột, Mobile 4 Cột 100% Fit) -->
    <section class="bazi-card pillars-board-card" aria-label="Đồ hình Tứ Trụ">
      <div class="card-header">
        <h3 class="card-title">✦ ĐỒ HÌNH BÁT TỰ TỨ TRỤ TIÊN THIÊN ✦</h3>
        <p class="card-hint">Tương tác 4 cột mốc thời gian: Năm, Tháng, Ngày, Giờ sinh</p>
      </div>

      <div class="table-scroll-wrapper">
        <div class="pillars-grid-table">
          <!-- Cột nhãn hàng bên trái (Chỉ hiện trên Desktop/Tablet để tối ưu không gian màn hình) -->
          <div class="grid-col label-col">
            <div class="cell col-head-cell">Mục Tra Cứu</div>
            <div class="cell">Thập Thần Can</div>
            <div class="cell can-row-cell">Thiên Can</div>
            <div class="cell chi-row-cell">Địa Chi</div>
            <div class="cell">Thập Thần Chi</div>
            <div class="cell hidden-stems-row-cell">Tàng Can Ẩn</div>
            <div class="cell">Vòng Trường Sinh</div>
            <div class="cell nayin-row-cell">Nạp Âm Ngũ Hành</div>
          </div>

          <!-- 4 Cột Trụ (Dàn đều 100% trên Mobile, không bao giờ bị cắt xén hay tràn dòng) -->
          {#each baziData.pillars as pillar (pillar.slot)}
            {@const isDayMaster = pillar.slot === 'day'}
            <div class="grid-col pillar-col" class:is-day-master={isDayMaster}>
              <!-- Header Cột -->
              <div class="cell col-head-cell">
                <div class="pillar-title">
                  <span class="desktop-only">{pillar.slotName}</span>
                  <span class="mobile-only">{getPillarShortName(pillar.slot)}</span>
                </div>
                <div class="pillar-age">{pillar.ageRange}</div>
                {#if isDayMaster}
                  <span class="daymaster-tag">NHẬT CHỦ</span>
                {/if}
              </div>

              <!-- Thập Thần Can -->
              <div class="cell tengod-cell">
                <span class="cell-micro-label mobile-only">Thần can</span>
                <span class="tengod-badge {getElementClass(pillar.stemElement)}">
                  {pillar.stemTenGod}
                </span>
              </div>

              <!-- Thiên Can -->
              <div class="cell can-row-cell">
                <span class="cell-micro-label mobile-only">Can</span>
                <div class="stem-big {getElementClass(pillar.stemElement)}">{pillar.stem}</div>
                <div class="stem-elem-sub">{pillar.stemElement}</div>
              </div>

              <!-- Địa Chi -->
              <div class="cell chi-row-cell">
                <span class="cell-micro-label mobile-only">Chi</span>
                <div class="branch-big {getElementClass(pillar.branchElement)}">{pillar.branch}</div>
                <div class="branch-elem-sub">{pillar.branchElement}</div>
              </div>

              <!-- Thập Thần Chi -->
              <div class="cell branch-tengod-cell">
                <span class="cell-micro-label mobile-only">Thần chi</span>
                <span class="branch-tengod-text">{pillar.branchTenGods}</span>
              </div>

              <!-- Tàng Can & Thập Thần Ẩn -->
              <div class="cell hidden-stems-row-cell">
                <span class="cell-micro-label mobile-only">Tàng can</span>
                <span class="hidden-stems-text">{pillar.hiddenStemsText}</span>
              </div>

              <!-- Vòng Trường Sinh -->
              <div class="cell life-stage-cell">
                <span class="cell-micro-label mobile-only">Trường sinh</span>
                <span class="life-stage-badge">{pillar.lifeStage}</span>
              </div>

              <!-- Nạp Âm Ngũ Hành -->
              <div class="cell nayin-row-cell">
                <span class="cell-micro-label mobile-only">Nạp âm</span>
                <span class="nayin-text">{pillar.naYin}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <!-- 3. Khối Cân Bằng Ngũ Hành & Dụng Thần -->
    <section class="bazi-card five-elements-card" aria-label="Cân bằng ngũ hành">
      <div class="card-header">
        <h3 class="card-title">✦ CÂN BẰNG NGŨ HÀNH & NĂNG LƯỢNG TIÊN THIÊN ✦</h3>
      </div>

      <div class="elements-bars-grid">
        <div class="element-bar-row">
          <div class="bar-meta">
            <span class="elem-name elem-metal">Kim (Bạc)</span>
            <span class="elem-pct">{baziData.fiveElements.percentages.metal}%</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill elem-metal-fill" style="width: {baziData.fiveElements.percentages.metal}%"></div>
          </div>
        </div>

        <div class="element-bar-row">
          <div class="bar-meta">
            <span class="elem-name elem-wood">Mộc (Xanh)</span>
            <span class="elem-pct">{baziData.fiveElements.percentages.wood}%</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill elem-wood-fill" style="width: {baziData.fiveElements.percentages.wood}%"></div>
          </div>
        </div>

        <div class="element-bar-row">
          <div class="bar-meta">
            <span class="elem-name elem-water">Thủy (Lam)</span>
            <span class="elem-pct">{baziData.fiveElements.percentages.water}%</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill elem-water-fill" style="width: {baziData.fiveElements.percentages.water}%"></div>
          </div>
        </div>

        <div class="element-bar-row">
          <div class="bar-meta">
            <span class="elem-name elem-fire">Hỏa (Đỏ)</span>
            <span class="elem-pct">{baziData.fiveElements.percentages.fire}%</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill elem-fire-fill" style="width: {baziData.fiveElements.percentages.fire}%"></div>
          </div>
        </div>

        <div class="element-bar-row">
          <div class="bar-meta">
            <span class="elem-name elem-earth">Thổ (Vàng)</span>
            <span class="elem-pct">{baziData.fiveElements.percentages.earth}%</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill elem-earth-fill" style="width: {baziData.fiveElements.percentages.earth}%"></div>
          </div>
        </div>
      </div>

      <div class="elements-summary-text">
        <p>{baziData.fiveElements.summaryText}</p>
      </div>
    </section>

    <!-- 4. Khối Tứ Phụ Cung (Tiên Thiên Mệnh Bàn) -->
    <section class="bazi-card extra-pillars-card" aria-label="Tứ Phụ Cung">
      <div class="card-header">
        <h3 class="card-title">✦ TỨ PHỤ CUNG TIÊN THIÊN (HỖN NGUYÊN BỔ TRỢ) ✦</h3>
        <p class="card-hint">Các tọa độ phong thủy trợ mệnh cho Tứ Trụ nguyên bản</p>
      </div>

      <div class="extra-pillars-grid">
        <div class="extra-item">
          <div class="ext-header">
            <span class="ext-title">Thai Nguyên</span>
            <span class="ext-sub desktop-only">Khí chất thụ thai</span>
          </div>
          <div class="ext-val">{baziData.extraPillars.taiYuan}</div>
        </div>

        <div class="extra-item">
          <div class="ext-header">
            <span class="ext-title">Thai Tức</span>
            <span class="ext-sub desktop-only">Khí huyết sinh dưỡng</span>
          </div>
          <div class="ext-val">{baziData.extraPillars.taiXi}</div>
        </div>

        <div class="extra-item">
          <div class="ext-header">
            <span class="ext-title">Mệnh Cung</span>
            <span class="ext-sub desktop-only">Chí hướng & tinh thần</span>
          </div>
          <div class="ext-val">{baziData.extraPillars.mingGong}</div>
        </div>

        <div class="extra-item">
          <div class="ext-header">
            <span class="ext-title">Thân Cung</span>
            <span class="ext-sub desktop-only">Nương tựa nửa đời sau</span>
          </div>
          <div class="ext-val">{baziData.extraPillars.shenGong}</div>
        </div>
      </div>
    </section>

    <!-- 5. Thần Sát Cát Hung Tiêu Biểu (nếu có) -->
    {#if baziData.shenShaList && baziData.shenShaList.length > 0}
      <section class="bazi-card shensha-card" aria-label="Thần Sát Tiêu Biểu">
        <div class="card-header">
          <h3 class="card-title">✦ THẦN SÁT TIÊU BIỂU TRONG TỨ TRỤ ✦</h3>
        </div>
        <div class="shensha-tags-grid">
          {#each baziData.shenShaList as item (item.name + item.pillar)}
            <div class="shensha-chip" class:is-auspicious={item.type === 'cát'}>
              <span class="ss-name">{item.name}</span>
              <span class="ss-pillar">({item.pillar})</span>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  </div>
{:else}
  <!-- Chế độ xem danh sách (hoặc fallback khi không có dữ liệu bazi đầy đủ) -->
  <div class="cards">
    {#if baziData}
      <div class="view-mode-bar">
        <button
          type="button"
          class="btn-toggle-mode is-primary"
          onclick={() => (viewMode = 'board')}
          title="Chuyển sang Đồ hình Tứ Trụ Hoàng Gia"
        >
          <span>✦ Mở Đồ Hình Tứ Trụ Hoàng Gia</span>
        </button>
      </div>
    {/if}
    <SummaryCard variant="glass" title="Tứ trụ" items={pillarRows} />
    {#if metaItems.length > 0}
      <SummaryCard variant="glass" title="Mệnh bàn" items={metaItems} />
    {/if}
  </div>
{/if}

<style>
  .cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .bazi-royal-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
  }

  /* Responsive Display Utility */
  .mobile-only {
    display: none;
  }
  .desktop-only {
    display: inline;
  }

  /* View Mode Bar */
  .view-mode-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding: 8px 14px;
    background: rgba(25, 20, 38, 0.6);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 12px;
    backdrop-filter: blur(8px);
  }

  .mode-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #e6c875;
    letter-spacing: 0.5px;
  }

  .emblem-dot {
    color: #d4af37;
    font-size: 0.95rem;
  }

  .btn-toggle-mode {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    color: #f1ebd8;
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.35);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-toggle-mode:hover {
    background: rgba(212, 175, 55, 0.28);
    border-color: #d4af37;
    color: #ffffff;
    box-shadow: 0 0 12px rgba(212, 175, 55, 0.25);
  }

  .btn-toggle-mode.is-primary {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(180, 130, 20, 0.35));
    border-color: #d4af37;
    color: #ffe89e;
  }

  /* Bazi Card Chung */
  .bazi-card {
    background: rgba(18, 14, 28, 0.72);
    border: 1px solid rgba(212, 175, 55, 0.28);
    border-radius: 16px;
    padding: 20px;
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  }

  .card-header {
    text-align: center;
    margin-bottom: 18px;
  }

  .card-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: #e8d08d;
    letter-spacing: 0.5px;
  }

  .card-hint {
    margin: 4px 0 0;
    font-size: 0.82rem;
    color: rgba(220, 215, 235, 0.65);
  }

  /* 1. Nhật Chủ Banner */
  .dm-overview-card {
    background: linear-gradient(135deg, rgba(28, 20, 42, 0.85) 0%, rgba(20, 16, 32, 0.9) 100%);
    border-color: rgba(212, 175, 55, 0.4);
  }

  .dm-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }

  .dm-core-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .dm-sub-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(212, 175, 55, 0.85);
    letter-spacing: 1px;
  }

  .dm-title-line {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .dm-name {
    font-size: 1.6rem;
    font-weight: 800;
    line-height: 1;
  }

  .dm-elem-pill {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .strength-badge {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 700;
    background: rgba(147, 51, 234, 0.2);
    border: 1px solid rgba(168, 85, 247, 0.4);
    color: #d8b4fe;
  }

  .strength-badge.is-strong {
    background: rgba(34, 197, 94, 0.2);
    border-color: rgba(74, 222, 128, 0.4);
    color: #86efac;
  }

  .dm-gods-summary {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .god-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 10px;
    font-size: 0.82rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .god-chip .chip-label {
    color: rgba(230, 230, 245, 0.65);
    font-size: 0.78rem;
  }

  .god-chip .chip-value {
    font-weight: 700;
  }

  .god-chip.yong-shen {
    border-color: rgba(74, 222, 128, 0.4);
    background: rgba(34, 197, 94, 0.12);
  }
  .god-chip.yong-shen .chip-value {
    color: #4ade80;
  }

  .god-chip.xi-shen {
    border-color: rgba(96, 165, 250, 0.4);
    background: rgba(59, 130, 246, 0.12);
  }
  .god-chip.xi-shen .chip-value {
    color: #60a5fa;
  }

  .god-chip.ji-shen {
    border-color: rgba(248, 113, 113, 0.4);
    background: rgba(239, 68, 68, 0.12);
  }
  .god-chip.ji-shen .chip-value {
    color: #f87171;
  }

  /* 2. Bảng Tứ Trụ 4 Cột */
  .table-scroll-wrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 4px;
  }

  .pillars-grid-table {
    display: grid;
    grid-template-columns: 140px repeat(4, 1fr);
    width: 100%;
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 12px;
    overflow: hidden;
    background: rgba(12, 10, 20, 0.85);
  }

  .grid-col {
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
  }

  .grid-col:last-child {
    border-right: none;
  }

  .grid-col.label-col {
    background: rgba(25, 20, 36, 0.95);
    border-right: 1px solid rgba(212, 175, 55, 0.25);
    font-weight: 600;
    font-size: 0.82rem;
    color: #d1c8b2;
  }

  .grid-col.pillar-col {
    text-align: center;
    transition: background 0.2s ease;
  }

  .grid-col.pillar-col:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  .grid-col.pillar-col.is-day-master {
    background: rgba(212, 175, 55, 0.09);
    border-left: 2px solid rgba(212, 175, 55, 0.6);
    border-right: 2px solid rgba(212, 175, 55, 0.6);
    box-shadow: inset 0 0 16px rgba(212, 175, 55, 0.12);
    position: relative;
  }

  .cell {
    padding: 10px 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    min-height: 48px;
    font-size: 0.85rem;
    position: relative;
  }

  .label-col .cell {
    justify-content: flex-start;
    padding-left: 14px;
    color: rgba(230, 220, 200, 0.8);
  }

  .cell:last-child {
    border-bottom: none;
  }

  /* Micro Label cho Mobile */
  .cell-micro-label {
    font-size: 0.58rem;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: rgba(212, 175, 55, 0.7);
    margin-bottom: 2px;
    font-weight: 600;
  }

  /* Col Header Cell */
  .col-head-cell {
    min-height: 64px;
    background: rgba(35, 28, 48, 0.9);
    border-bottom: 2px solid rgba(212, 175, 55, 0.35);
    flex-direction: column;
    gap: 3px;
  }

  .pillar-title {
    font-weight: 700;
    color: #f1ebd8;
    font-size: 0.9rem;
  }

  .pillar-age {
    font-size: 0.72rem;
    color: rgba(212, 175, 55, 0.8);
  }

  .daymaster-tag {
    display: inline-block;
    font-size: 0.65rem;
    font-weight: 800;
    color: #120e18;
    background: linear-gradient(135deg, #fcd34d, #d4af37);
    padding: 1px 6px;
    border-radius: 4px;
    margin-top: 2px;
    letter-spacing: 0.5px;
    box-shadow: 0 0 8px rgba(212, 175, 55, 0.4);
  }

  /* Thập Thần */
  .tengod-cell {
    flex-direction: column;
  }

  .tengod-badge {
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .branch-tengod-cell {
    flex-direction: column;
  }

  .branch-tengod-text {
    font-size: 0.78rem;
    color: rgba(240, 235, 220, 0.85);
    line-height: 1.25;
  }

  /* Can & Chi Big Cells */
  .can-row-cell,
  .chi-row-cell {
    min-height: 72px;
    flex-direction: column;
    gap: 2px;
  }

  .stem-big,
  .branch-big {
    font-size: 1.55rem;
    font-weight: 800;
    line-height: 1.1;
  }

  .stem-elem-sub,
  .branch-elem-sub {
    font-size: 0.72rem;
    color: rgba(220, 215, 235, 0.6);
  }

  /* Tàng Can */
  .hidden-stems-row-cell {
    min-height: 60px;
    font-size: 0.76rem;
    line-height: 1.35;
    padding: 6px;
    flex-direction: column;
  }

  .hidden-stems-text {
    color: #e2dcd0;
  }

  /* Trường Sinh & Nạp Âm */
  .life-stage-cell {
    flex-direction: column;
  }

  .life-stage-badge {
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.76rem;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #f3eedd;
  }

  .nayin-row-cell {
    font-size: 0.8rem;
    font-weight: 500;
    color: #e8dbbe;
    flex-direction: column;
  }

  /* 3. Ngũ Hành Phân Bổ */
  .elements-bars-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .element-bar-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .bar-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.82rem;
    font-weight: 600;
  }

  .bar-track {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 999px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.6s ease;
  }

  .elem-metal-fill { background: linear-gradient(90deg, #94a3b8, #e2e8f0); }
  .elem-wood-fill  { background: linear-gradient(90deg, #16a34a, #4ade80); }
  .elem-water-fill { background: linear-gradient(90deg, #2563eb, #60a5fa); }
  .elem-fire-fill  { background: linear-gradient(90deg, #dc2626, #f87171); }
  .elem-earth-fill { background: linear-gradient(90deg, #d97706, #fbbf24); }

  .elements-summary-text {
    font-size: 0.86rem;
    line-height: 1.6;
    color: rgba(230, 225, 215, 0.85);
    background: rgba(255, 255, 255, 0.03);
    padding: 12px 16px;
    border-radius: 10px;
    border-left: 3px solid #d4af37;
  }

  .elements-summary-text p {
    margin: 0;
  }

  /* 4. Tứ Phụ Cung */
  .extra-pillars-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 14px;
  }

  .extra-item {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 12px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ext-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .ext-title {
    font-weight: 700;
    font-size: 0.88rem;
    color: #e8d08d;
  }

  .ext-sub {
    font-size: 0.72rem;
    color: rgba(220, 215, 235, 0.55);
  }

  .ext-val {
    font-size: 0.95rem;
    font-weight: 600;
    color: #f7f3e8;
  }

  /* 5. Thần Sát */
  .shensha-tags-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .shensha-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #e2dcd0;
  }

  .shensha-chip.is-auspicious {
    background: rgba(212, 175, 55, 0.12);
    border-color: rgba(212, 175, 55, 0.35);
    color: #fde68a;
  }

  .ss-pillar {
    font-size: 0.72rem;
    opacity: 0.75;
  }

  /* Ngũ Hành Classes */
  .elem-metal { color: #f1f5f9; background: rgba(241, 245, 249, 0.12); border-color: rgba(241, 245, 249, 0.3); }
  .elem-wood  { color: #4ade80; background: rgba(74, 222, 128, 0.12); border-color: rgba(74, 222, 128, 0.3); }
  .elem-water { color: #60a5fa; background: rgba(96, 165, 250, 0.12); border-color: rgba(96, 165, 250, 0.3); }
  .elem-fire  { color: #f87171; background: rgba(248, 113, 113, 0.12); border-color: rgba(248, 113, 113, 0.3); }
  .elem-earth { color: #fbbf24; background: rgba(251, 191, 36, 0.12); border-color: rgba(251, 191, 36, 0.3); }

  /* ========================================================================= */
  /* MOBILE-FIRST OPTIMIZATION (< 640px)                                      */
  /* ========================================================================= */
  @media (max-width: 639px) {
    .mobile-only {
      display: inline-block;
    }
    .desktop-only {
      display: none;
    }

    .bazi-royal-container {
      gap: 14px;
    }

    .bazi-card {
      padding: 14px 10px;
      border-radius: 12px;
    }

    /* 1. Header Nhật Chủ trên Mobile: xếp 3 chip Dụng/Hỷ/Kỵ thành 3 cột cân xứng */
    .dm-header-row {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }

    .dm-core-info {
      text-align: center;
      align-items: center;
    }

    .dm-title-line {
      justify-content: center;
      gap: 8px;
    }

    .dm-name {
      font-size: 1.5rem;
    }

    .dm-elem-pill {
      font-size: 0.78rem;
      padding: 3px 8px;
    }

    .strength-badge {
      font-size: 0.78rem;
      padding: 3px 8px;
    }

    .dm-gods-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      width: 100%;
    }

    .god-chip {
      flex-direction: column;
      padding: 6px 4px;
      text-align: center;
      gap: 2px;
      border-radius: 8px;
    }

    .god-chip .chip-label {
      font-size: 0.68rem;
    }

    .god-chip .chip-value {
      font-size: 0.8rem;
    }

    /* 2. Bảng Tứ Trụ 4 Cột: Dàn đều 100% màn hình, ẩn cột nhãn cồng kềnh bên trái */
    .table-scroll-wrapper {
      overflow-x: visible;
      padding: 0;
      width: 100%;
    }

    .pillars-grid-table {
      grid-template-columns: repeat(4, 1fr);
      min-width: 0;
      width: 100%;
      border-radius: 10px;
    }

    .grid-col.label-col {
      display: none; /* Ẩn cột nhãn để 4 cột trụ chiếm trọn 100% viewport */
    }

    .cell {
      padding: 6px 2px;
      min-height: 42px;
    }

    .col-head-cell {
      min-height: 54px;
      padding: 6px 2px;
    }

    .pillar-title {
      font-size: 0.78rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .pillar-age {
      font-size: 0.62rem;
    }

    .daymaster-tag {
      font-size: 0.58rem;
      padding: 1px 4px;
      margin-top: 1px;
    }

    .tengod-badge {
      font-size: 0.7rem;
      padding: 2px 4px;
      white-space: nowrap;
    }

    .can-row-cell,
    .chi-row-cell {
      min-height: 62px;
    }

    .stem-big,
    .branch-big {
      font-size: 1.35rem;
    }

    .stem-elem-sub,
    .branch-elem-sub {
      font-size: 0.65rem;
    }

    .branch-tengod-text {
      font-size: 0.68rem;
      line-height: 1.2;
    }

    .hidden-stems-row-cell {
      min-height: 52px;
      font-size: 0.66rem;
      line-height: 1.25;
      padding: 4px 2px;
    }

    .life-stage-badge {
      font-size: 0.68rem;
      padding: 2px 4px;
      white-space: nowrap;
    }

    .nayin-row-cell {
      font-size: 0.68rem;
      line-height: 1.25;
      padding: 4px 2px;
    }

    /* 3. Tứ Phụ Cung trên Mobile: 2 cột x 2 hàng gọn gàng */
    .extra-pillars-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .extra-item {
      padding: 10px;
      gap: 4px;
    }

    .ext-title {
      font-size: 0.8rem;
    }

    .ext-val {
      font-size: 0.84rem;
      line-height: 1.25;
    }

    .elements-summary-text {
      font-size: 0.8rem;
      padding: 10px 12px;
    }
  }
</style>
