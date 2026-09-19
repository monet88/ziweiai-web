<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { Download, Share2, X } from 'lucide-svelte';
  import type { ChartSnapshot } from '@ziweiai/contracts';
  import { buildBaziDossierData, type BaziDossierPayload } from '$lib/features/dossier/bazi-dossier-interpretations';
  import {
    exportPosterToPng,
    triggerDirectDownload,
    sharePosterImage,
    formatBaziPosterFileName,
  } from './royal-poster-exporter';
  import { toast } from '$lib/stores/toast';

  interface Props {
    snapshot: ChartSnapshot;
    chartId: string;
    userName?: string;
    onClose: () => void;
  }

  let { snapshot, chartId, userName = '', onClose }: Props = $props();

  const data: BaziDossierPayload = $derived(buildBaziDossierData(snapshot, userName));
  const royalSecurityCode = $derived(`VIOS-BAZI-${chartId.slice(0, 8).toUpperCase()}`);

  let posterElement = $state<HTMLDivElement | null>(null);
  let isExporting = $state(false);

  function getElementColor(elem: string): string {
    const norm = (elem || '').toLowerCase();
    if (norm.includes('kim')) return '#cbd5e1'; // Kim: Bạch Kim
    if (norm.includes('mộc') || norm.includes('moc')) return '#34d399'; // Mộc: Thanh Mộc
    if (norm.includes('thủy') || norm.includes('thuy')) return '#38bdf8'; // Thủy: Lam Thủy
    if (norm.includes('hỏa') || norm.includes('hoa')) return '#f87171'; // Hỏa: Xích Hỏa
    if (norm.includes('thổ') || norm.includes('tho')) return '#fbbf24'; // Thổ: Hoàng Thổ
    return '#e2e8f0';
  }

  onMount(() => {
    if (!browser) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  async function handleDownloadPng() {
    if (!posterElement || isExporting) return;
    isExporting = true;
    try {
      toast.show('Đang khởi tạo ảnh Poster Bát Tự Hoàng Gia độ phân giải cao...', 'info');
      const blob = await exportPosterToPng(posterElement, { scale: 2 });
      const fileName = formatBaziPosterFileName(data.userName, data.dayMasterText);
      triggerDirectDownload(blob, fileName);
      toast.show('Đã tải thành công Poster Bát Tự Hoàng Gia!', 'success');
    } catch {
      toast.show('Không thể xuất ảnh poster. Vui lòng thử lại!', 'danger');
    } finally {
      isExporting = false;
    }
  }

  async function handleShare() {
    if (!posterElement || isExporting) return;
    isExporting = true;
    try {
      toast.show('Đang chuẩn bị ảnh chia sẻ...', 'info');
      const blob = await exportPosterToPng(posterElement, { scale: 2 });
      const fileName = formatBaziPosterFileName(data.userName, data.dayMasterText);
      const shared = await sharePosterImage(
        blob,
        fileName,
        `Bản Đồ Mệnh Lý Bát Tự — ${data.userName}`,
        `Bản đồ Bát Tự Tứ Trụ tiên thiên của ${data.userName} trên ViOS Tử Vi Toàn Tập.`,
      );
      if (!shared) {
        triggerDirectDownload(blob, fileName);
        toast.show('Thiết bị không hỗ trợ chia sẻ trực tiếp. Đã tự động tải file ảnh về máy!', 'info');
      } else {
        toast.show('Đã chia sẻ thành công!', 'success');
      }
    } catch {
      toast.show('Không thể chia sẻ poster.', 'danger');
    } finally {
      isExporting = false;
    }
  }
</script>

<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="bazi-poster-modal-title">
  <!-- Toolbar điều khiển -->
  <header class="poster-modal-toolbar">
    <div class="toolbar-left">
      <span class="toolbar-icon">👑</span>
      <h2 id="bazi-poster-modal-title" class="toolbar-title">Xuất Ảnh Bát Tự Hoàng Gia</h2>
      <span class="toolbar-badge">High-DPI 2x Retina</span>
    </div>

    <div class="toolbar-actions">
      <button
        type="button"
        class="action-btn btn-share"
        onclick={handleShare}
        disabled={isExporting}
        title="Chia sẻ lá số trực tiếp qua mạng xã hội"
      >
        <Share2 size={16} />
        <span class="btn-text">Chia Sẻ</span>
      </button>

      <button
        type="button"
        class="action-btn btn-download"
        onclick={handleDownloadPng}
        disabled={isExporting}
        title="Tải ảnh PNG chất lượng in ấn"
      >
        <Download size={16} />
        <span class="btn-text">{isExporting ? 'Đang xuất...' : 'Tải Ảnh PNG'}</span>
      </button>

      <button
        type="button"
        class="action-btn btn-close"
        onclick={onClose}
        title="Đóng cửa sổ"
        aria-label="Đóng"
      >
        <X size={18} />
      </button>
    </div>
  </header>

  <!-- Vùng xem trước Poster -->
  <main class="poster-scroll-area">
    <div class="poster-wrapper">
      <div class="royal-poster-canvas" bind:this={posterElement}>
        <div class="poster-gold-border">
          <div class="corner-ornament top-left">✦</div>
          <div class="corner-ornament top-right">✦</div>
          <div class="corner-ornament bottom-left">✦</div>
          <div class="corner-ornament bottom-right">✦</div>

          <!-- Header Poster -->
          <header class="poster-header">
            <div class="imperial-crest">
              <span class="crest-crown">👑</span>
              <span class="crest-label">KHÂM THIÊN GIÁM NGỰ PHÊ</span>
              <span class="crest-crown">👑</span>
            </div>
            <h1 class="poster-title">BẢN ĐỒ MỆNH LÝ BÁT TỰ HOÀNG GIA</h1>
            <p class="poster-subtitle">ViOS Imperial Bazi Codex • Tiên Thiên Tứ Trụ Toàn Thư</p>
          </header>

          <!-- Profile Summary Grid -->
          <section class="poster-profile-section">
            <div class="profile-card">
              <div class="profile-row-main">
                <span class="profile-name">{data.userName}</span>
                <span class="profile-gender-tag">{data.genderText} • {data.dayMasterElement} ({data.dayMasterPolarity})</span>
              </div>
              <div class="profile-meta-grid">
                <div class="meta-item">
                  <span class="meta-label">Dương Lịch:</span>
                  <span class="meta-val">{data.solarDateText}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Âm Lịch:</span>
                  <span class="meta-val">{data.lunarDateText}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Nhật Chủ:</span>
                  <span class="meta-val highlight-amber">{data.dayMasterText} ({data.dayMasterElement})</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Bản Thể Thần:</span>
                  <span class="meta-val highlight-emerald">{data.dayMasterStrength}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Dụng Thần:</span>
                  <span class="meta-val highlight-gold">{data.usefulGods.yongShen.name}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Hỷ Thần:</span>
                  <span class="meta-val highlight-cyan">{data.usefulGods.xiShen.name}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Kỵ Thần:</span>
                  <span class="meta-val highlight-rose">{data.usefulGods.jiShen.name}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Nạp Âm Mệnh:</span>
                  <span class="meta-val">{data.pillars[0]?.naYin ?? 'Chưa định'}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Bảng Tứ Trụ Tiên Thiên 4 Cột Hoàng Cung -->
          <section class="poster-pillars-section">
            <div class="section-title-wrap">
              <span class="section-ornament">✦</span>
              <h2 class="section-title">ĐỒ HÌNH TỨ TRỤ TIÊN THIÊN</h2>
              <span class="section-ornament">✦</span>
            </div>

            <div class="pillars-table-grid">
              <!-- Header hàng các trụ -->
              <div class="pillar-col label-col">
                <div class="cell-head">TRỤ MỆNH</div>
                <div class="cell-row">THẬP THẦN</div>
                <div class="cell-row can-row">THIÊN CAN</div>
                <div class="cell-row chi-row">ĐỊA CHI</div>
                <div class="cell-row tang-can-row">TÀNG CAN</div>
                <div class="cell-row">TRƯỜNG SINH</div>
                <div class="cell-row nap-am-row">NẠP ÂM</div>
              </div>

              {#each data.pillars as p (p.slot)}
                {@const isDayMaster = p.slot === 'day'}
                <div class="pillar-col data-col" class:is-day-master={isDayMaster}>
                  <div class="cell-head">
                    <span class="pillar-name">{p.slot === 'year' ? 'NĂM' : p.slot === 'month' ? 'THÁNG' : p.slot === 'day' ? 'NGÀY' : 'GIỜ'}</span>
                    {#if isDayMaster}
                      <span class="dm-badge">NHẬT CHỦ</span>
                    {/if}
                  </div>

                  <!-- Thập thần Can -->
                  <div class="cell-row god-cell">
                    <span class="god-badge">{isDayMaster ? 'Nhật Can' : p.stemTenGod}</span>
                  </div>

                  <!-- Thiên Can -->
                  <div class="cell-row can-row">
                    <span class="stem-text" style="color: {getElementColor(p.stemElement)};">
                      {p.stem}
                    </span>
                    <span class="elem-sub" style="color: {getElementColor(p.stemElement)};">
                      {p.stemElement}
                    </span>
                  </div>

                  <!-- Địa Chi -->
                  <div class="cell-row chi-row">
                    <span class="branch-text" style="color: {getElementColor(p.branchElement)};">
                      {p.branch}
                    </span>
                    <span class="elem-sub" style="color: {getElementColor(p.branchElement)};">
                      {p.branchElement}
                    </span>
                  </div>

                  <!-- Tàng Can -->
                  <div class="cell-row tang-can-row">
                    <span class="hidden-stems">{p.hiddenStemsText}</span>
                  </div>

                  <!-- Trường Sinh -->
                  <div class="cell-row stage-cell">
                    <span class="stage-tag">{p.lifeStage}</span>
                  </div>

                  <!-- Nạp Âm -->
                  <div class="cell-row nap-am-row">
                    <span class="na-yin-text">{p.naYin}</span>
                  </div>
                </div>
              {/each}
            </div>
          </section>

          <!-- Cân Bằng Ngũ Hành Tiên Thiên & Tứ Phụ Cung -->
          <section class="poster-elements-and-extra">
            <!-- 5 Hành Năng Lượng -->
            <div class="sub-panel wuxing-panel">
              <h3 class="panel-title">✦ CÂN BẰNG NGŨ HÀNH ✦</h3>
              <div class="wuxing-bars">
                <div class="wuxing-row">
                  <span class="elem-name" style="color: #cbd5e1;">Kim</span>
                  <div class="bar-track">
                    <div class="bar-fill fill-metal" style="width: {data.fiveElements.percentages.metal}%;"></div>
                  </div>
                  <span class="elem-pct">{data.fiveElements.percentages.metal}%</span>
                </div>
                <div class="wuxing-row">
                  <span class="elem-name" style="color: #34d399;">Mộc</span>
                  <div class="bar-track">
                    <div class="bar-fill fill-wood" style="width: {data.fiveElements.percentages.wood}%;"></div>
                  </div>
                  <span class="elem-pct">{data.fiveElements.percentages.wood}%</span>
                </div>
                <div class="wuxing-row">
                  <span class="elem-name" style="color: #38bdf8;">Thủy</span>
                  <div class="bar-track">
                    <div class="bar-fill fill-water" style="width: {data.fiveElements.percentages.water}%;"></div>
                  </div>
                  <span class="elem-pct">{data.fiveElements.percentages.water}%</span>
                </div>
                <div class="wuxing-row">
                  <span class="elem-name" style="color: #f87171;">Hỏa</span>
                  <div class="bar-track">
                    <div class="bar-fill fill-fire" style="width: {data.fiveElements.percentages.fire}%;"></div>
                  </div>
                  <span class="elem-pct">{data.fiveElements.percentages.fire}%</span>
                </div>
                <div class="wuxing-row">
                  <span class="elem-name" style="color: #fbbf24;">Thổ</span>
                  <div class="bar-track">
                    <div class="bar-fill fill-earth" style="width: {data.fiveElements.percentages.earth}%;"></div>
                  </div>
                  <span class="elem-pct">{data.fiveElements.percentages.earth}%</span>
                </div>
              </div>
            </div>

            <!-- Tứ Phụ Cung -->
            <div class="sub-panel extra-panel">
              <h3 class="panel-title">✦ TỨ PHỤ CUNG ✦</h3>
              <div class="extra-grid">
                <div class="extra-item">
                  <span class="extra-label">Thai Nguyên</span>
                  <strong class="extra-val">{data.extraPillars.taiYuan}</strong>
                </div>
                <div class="extra-item">
                  <span class="extra-label">Thai Tức</span>
                  <strong class="extra-val">{data.extraPillars.taiXi}</strong>
                </div>
                <div class="extra-item">
                  <span class="extra-label">Mệnh Cung</span>
                  <strong class="extra-val">{data.extraPillars.mingGong}</strong>
                </div>
                <div class="extra-item">
                  <span class="extra-label">Thân Cung</span>
                  <strong class="extra-val">{data.extraPillars.shenGong}</strong>
                </div>
              </div>
              <div class="shensha-strip">
                <span class="shensha-title">Thần Sát Tiêu Biểu:</span>
                <span class="shensha-content">
                  {data.shenShaList.slice(0, 5).map((s) => s.name).join(' · ') || 'Thiên Đức, Nguyệt Đức, Văn Xương'}
                </span>
              </div>
            </div>
          </section>

          <!-- Dải Vòng Đại Vận 10 Năm -->
          {#if data.decadals && data.decadals.length > 0}
            <section class="poster-decadals-section">
              <div class="section-title-wrap">
                <span class="section-ornament">✦</span>
                <h3 class="section-title-sm">ĐẠI VẬN TIÊN THIÊN KHỞI HÀNH</h3>
                <span class="section-ornament">✦</span>
              </div>
              <div class="decadals-strip">
                {#each data.decadals.slice(0, 8) as d (d.step)}
                  <div class="decadal-card">
                    <span class="dec-age">{d.ageRange}</span>
                    <strong class="dec-stem-branch" style="color: {getElementColor(d.element)};">{d.stemBranch}</strong>
                    <span class="dec-god">{d.tenGod}</span>
                  </div>
                {/each}
              </div>
            </section>
          {/if}

          <!-- Ngự Bút Khâm Thiên Giám & Triện Chu Sa -->
          <section class="poster-seal-section">
            <div class="hall-inner">
              <div class="hall-crest">✦ 👑 ✦</div>
              <h3 class="hall-title">KHÂM THIÊN GIÁM · NGỰ PHÊ</h3>
              <p class="hall-subtitle">
                BẢN THỂ NHẬT CHỦ: <strong class="highlight-amber">{data.dayMasterText}</strong> • KHÍ TRƯỜNG: <strong class="highlight-emerald">{data.dayMasterStrength}</strong>
              </p>

              <!-- Con dấu Triện Hoàng Gia (Imperial Red Seal) -->
              <div class="imperial-seal-box">
                <div class="seal-ring">
                  <span class="seal-char">BÁT</span>
                  <span class="seal-char">TỰ</span>
                  <span class="seal-char">TOÀN</span>
                  <span class="seal-char">TẬP</span>
                </div>
              </div>

              <p class="hall-motto">« Âm Dương Thuận Lý • Cương Nhu Tương Tế • Phúc Thọ Vẹn Toàn »</p>
            </div>
          </section>

          <!-- Footer Poster -->
          <footer class="poster-footer">
            <div class="footer-left">
              <span class="footer-verified-icon">🛡️</span>
              <span>Bản quyền số hóa bởi ViOS Tử Vi Toàn Tập</span>
            </div>
            <div class="footer-center">
              <span>https://tuvitoantap.online</span>
            </div>
            <div class="footer-right">
              <span class="footer-code-label">Mã chứng thư:</span>
              <strong class="footer-code">{royalSecurityCode}</strong>
            </div>
          </footer>
        </div>
      </div>
    </div>
  </main>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(4, 3, 2, 0.88);
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    color: #f3f4f6;
  }

  /* Toolbar */
  .poster-modal-toolbar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 24px;
    background: rgba(18, 14, 9, 0.95);
    border-bottom: 1px solid rgba(212, 175, 55, 0.3);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .toolbar-icon {
    font-size: 1.25rem;
  }

  .toolbar-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #fbbf24;
    font-family: var(--font-serif, serif);
  }

  .toolbar-badge {
    padding: 2px 8px;
    font-size: 0.72rem;
    font-weight: 600;
    border-radius: 12px;
    background: rgba(212, 175, 55, 0.15);
    color: #ffd700;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-share {
    background: rgba(255, 255, 255, 0.08);
    color: #e5e7eb;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .btn-share:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
  }

  .btn-download {
    background: linear-gradient(135deg, #d4af37, #b45309);
    color: #17120a;
    border: 1px solid #ffd700;
    box-shadow: 0 0 14px rgba(212, 175, 55, 0.35);
  }

  .btn-download:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  .btn-close {
    padding: 8px;
    background: rgba(255, 255, 255, 0.05);
    color: #9ca3af;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .btn-close:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.4);
  }

  /* Scroll Area */
  .poster-scroll-area {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    padding: 24px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .poster-wrapper {
    display: flex;
    justify-content: center;
    min-width: min-content;
  }

  /* Fixed Width 780px Canvas */
  .royal-poster-canvas {
    width: 780px;
    background: #0b0906;
    background-image:
      radial-gradient(ellipse at 50% 0%, rgba(212, 175, 55, 0.12) 0%, transparent 60%),
      radial-gradient(ellipse at 50% 100%, rgba(180, 83, 9, 0.1) 0%, transparent 50%),
      linear-gradient(180deg, #0c0a07 0%, #080604 100%);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(212, 175, 55, 0.25);
    padding: 22px;
    box-sizing: border-box;
    font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    color: #e5e7eb;
  }

  /* Gold Border with Corner Ornaments */
  .poster-gold-border {
    position: relative;
    border: 1.5px solid rgba(212, 175, 55, 0.6);
    outline: 1px solid rgba(212, 175, 55, 0.2);
    outline-offset: 4px;
    padding: 20px 22px;
    background: rgba(14, 11, 7, 0.82);
    box-sizing: border-box;
  }

  .corner-ornament {
    position: absolute;
    width: 14px;
    height: 14px;
    color: #ffd700;
    font-size: 14px;
    line-height: 14px;
    text-align: center;
    pointer-events: none;
  }

  .corner-ornament.top-left {
    top: -8px;
    left: -8px;
  }
  .corner-ornament.top-right {
    top: -8px;
    right: -8px;
  }
  .corner-ornament.bottom-left {
    bottom: -8px;
    left: -8px;
  }
  .corner-ornament.bottom-right {
    bottom: -8px;
    right: -8px;
  }

  /* Poster Header */
  .poster-header {
    text-align: center;
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.25);
  }

  .imperial-crest {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 3px 12px;
    background: rgba(212, 175, 55, 0.12);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 20px;
    margin-bottom: 8px;
  }

  .crest-crown {
    font-size: 0.9rem;
  }

  .crest-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: #ffd700;
    font-family: var(--font-serif, serif);
  }

  .poster-title {
    margin: 0 0 4px 0;
    font-size: 1.45rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    background: linear-gradient(135deg, #ffd700 0%, #f59e0b 50%, #d97706 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-family: var(--font-serif, serif);
    text-shadow: 0 2px 10px rgba(212, 175, 55, 0.25);
  }

  .poster-subtitle {
    margin: 0;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    color: #9ca3af;
    font-family: var(--font-serif, serif);
  }

  /* Profile Summary Card */
  .poster-profile-section {
    margin-bottom: 18px;
  }

  .profile-card {
    background: rgba(25, 20, 13, 0.7);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 8px;
    padding: 12px 16px;
  }

  .profile-row-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 8px;
    margin-bottom: 10px;
    border-bottom: 1px dashed rgba(212, 175, 55, 0.2);
  }

  .profile-name {
    font-size: 1.2rem;
    font-weight: 800;
    color: #ffd700;
    letter-spacing: 0.02em;
    font-family: var(--font-serif, serif);
  }

  .profile-gender-tag {
    font-size: 0.8rem;
    font-weight: 700;
    color: #fde047;
    background: rgba(212, 175, 55, 0.15);
    padding: 3px 10px;
    border-radius: 4px;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  .profile-meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px 12px;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .meta-label {
    font-size: 0.68rem;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .meta-val {
    font-size: 0.82rem;
    font-weight: 600;
    color: #e5e7eb;
  }

  .highlight-amber {
    color: #f59e0b;
    font-weight: 700;
  }
  .highlight-emerald {
    color: #10b981;
    font-weight: 700;
  }
  .highlight-gold {
    color: #ffd700;
    font-weight: 700;
  }
  .highlight-cyan {
    color: #38bdf8;
    font-weight: 700;
  }
  .highlight-rose {
    color: #f87171;
    font-weight: 700;
  }

  /* Section Titles */
  .section-title-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 14px 0 10px 0;
  }

  .section-ornament {
    color: #ffd700;
    font-size: 0.75rem;
  }

  .section-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: #ffd700;
    font-family: var(--font-serif, serif);
  }

  .section-title-sm {
    margin: 0;
    font-size: 0.82rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: #fbbf24;
    font-family: var(--font-serif, serif);
  }

  /* Pillars Grid Table (5 Columns: 1 Label + 4 Pillars) */
  .poster-pillars-section {
    margin-bottom: 18px;
  }

  .pillars-table-grid {
    display: grid;
    grid-template-columns: 100px repeat(4, 1fr);
    gap: 6px;
  }

  .pillar-col {
    background: rgba(18, 14, 9, 0.75);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .pillar-col.label-col {
    background: rgba(28, 22, 14, 0.6);
    border-color: rgba(212, 175, 55, 0.2);
  }

  .pillar-col.label-col .cell-row,
  .pillar-col.label-col .cell-head {
    font-size: 0.68rem;
    font-weight: 700;
    color: #d4af37;
    justify-content: flex-start;
    padding-left: 10px;
    letter-spacing: 0.05em;
  }

  .pillar-col.is-day-master {
    background: rgba(36, 26, 12, 0.9);
    border: 2px solid #ffd700;
    box-shadow: 0 0 16px rgba(255, 215, 0, 0.25);
    position: relative;
  }

  .cell-head {
    height: 38px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(212, 175, 55, 0.15);
    border-bottom: 1px solid rgba(212, 175, 55, 0.3);
    font-weight: 800;
    font-size: 0.82rem;
    color: #fbbf24;
  }

  .dm-badge {
    font-size: 0.58rem;
    font-weight: 800;
    color: #17120a;
    background: #ffd700;
    padding: 1px 6px;
    border-radius: 8px;
    margin-top: 1px;
    letter-spacing: 0.05em;
  }

  .cell-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6px 4px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    min-height: 38px;
    box-sizing: border-box;
  }

  .can-row, .chi-row {
    min-height: 52px;
  }

  .tang-can-row {
    min-height: 48px;
  }

  .nap-am-row {
    min-height: 42px;
    border-bottom: none;
  }

  .god-badge {
    font-size: 0.72rem;
    font-weight: 700;
    color: #fde047;
    background: rgba(253, 224, 71, 0.12);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .stem-text, .branch-text {
    font-size: 1.3rem;
    font-weight: 900;
    line-height: 1.1;
    font-family: var(--font-serif, serif);
  }

  .elem-sub {
    font-size: 0.62rem;
    font-weight: 700;
    opacity: 0.9;
  }

  .hidden-stems {
    font-size: 0.68rem;
    color: #d1d5db;
    text-align: center;
    line-height: 1.3;
    padding: 0 4px;
  }

  .stage-tag {
    font-size: 0.72rem;
    font-weight: 700;
    color: #6ee7b7;
    background: rgba(16, 185, 129, 0.12);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .na-yin-text {
    font-size: 0.7rem;
    font-weight: 600;
    color: #e5e7eb;
    text-align: center;
    line-height: 1.2;
  }

  /* Elements & Extra Panel Grid */
  .poster-elements-and-extra {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 18px;
  }

  .sub-panel {
    background: rgba(18, 14, 9, 0.75);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 6px;
    padding: 12px 14px;
  }

  .panel-title {
    margin: 0 0 10px 0;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #ffd700;
    text-align: center;
    font-family: var(--font-serif, serif);
  }

  .wuxing-bars {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .wuxing-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .elem-name {
    width: 34px;
    font-size: 0.75rem;
    font-weight: 800;
  }

  .bar-track {
    flex: 1;
    height: 8px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .fill-metal { background: linear-gradient(90deg, #94a3b8, #cbd5e1); }
  .fill-wood { background: linear-gradient(90deg, #059669, #34d399); }
  .fill-water { background: linear-gradient(90deg, #0284c7, #38bdf8); }
  .fill-fire { background: linear-gradient(90deg, #dc2626, #f87171); }
  .fill-earth { background: linear-gradient(90deg, #d97706, #fbbf24); }

  .elem-pct {
    width: 32px;
    text-align: right;
    font-size: 0.72rem;
    font-weight: 700;
    color: #d1d5db;
  }

  .extra-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 8px;
  }

  .extra-item {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    padding: 6px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .extra-label {
    font-size: 0.65rem;
    color: #9ca3af;
    text-transform: uppercase;
  }

  .extra-val {
    font-size: 0.82rem;
    color: #ffd700;
  }

  .shensha-strip {
    font-size: 0.68rem;
    color: #9ca3af;
    line-height: 1.4;
    border-top: 1px dashed rgba(212, 175, 55, 0.2);
    padding-top: 6px;
    margin-top: 4px;
  }

  .shensha-title {
    color: #ffd700;
    font-weight: 700;
    margin-right: 4px;
  }

  .shensha-content {
    color: #d1d5db;
  }

  /* Decadals Strip */
  .poster-decadals-section {
    margin-bottom: 18px;
    background: rgba(18, 14, 9, 0.75);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 6px;
    padding: 10px 12px;
  }

  .decadals-strip {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 6px;
  }

  .decadal-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    padding: 6px 2px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .dec-age {
    font-size: 0.64rem;
    color: #9ca3af;
  }

  .dec-stem-branch {
    font-size: 0.82rem;
    font-weight: 800;
  }

  .dec-god {
    font-size: 0.62rem;
    color: #fbbf24;
  }

  /* Imperial Seal & Motto */
  .poster-seal-section {
    text-align: center;
    padding: 12px 16px;
    background: rgba(20, 16, 10, 0.7);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 6px;
    margin-bottom: 16px;
  }

  .hall-crest {
    color: #ffd700;
    font-size: 0.9rem;
    letter-spacing: 0.2em;
    margin-bottom: 4px;
  }

  .hall-title {
    margin: 0 0 4px 0;
    font-size: 0.95rem;
    font-weight: 800;
    letter-spacing: 0.15em;
    color: #ffd700;
    font-family: var(--font-serif, serif);
  }

  .hall-subtitle {
    margin: 0 0 10px 0;
    font-size: 0.75rem;
    color: #d1d5db;
  }

  .imperial-seal-box {
    display: inline-block;
    padding: 6px 10px;
    background: rgba(185, 28, 28, 0.15);
    border: 2px solid #ef4444;
    border-radius: 6px;
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.35);
    margin-bottom: 8px;
  }

  .seal-ring {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2px 6px;
  }

  .seal-char {
    font-size: 0.75rem;
    font-weight: 900;
    color: #ef4444;
    letter-spacing: 0.1em;
    font-family: var(--font-serif, serif);
  }

  .hall-motto {
    margin: 0;
    font-size: 0.72rem;
    font-style: italic;
    letter-spacing: 0.06em;
    color: #fbbf24;
    font-family: var(--font-serif, serif);
  }

  /* Footer Poster */
  .poster-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    border-top: 1px solid rgba(212, 175, 55, 0.25);
    font-size: 0.68rem;
    color: #9ca3af;
  }

  .footer-left {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .footer-verified-icon {
    font-size: 0.8rem;
  }

  .footer-center {
    color: #d4af37;
  }

  .footer-right {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .footer-code-label {
    color: #9ca3af;
  }

  .footer-code {
    color: #ffd700;
    font-family: var(--font-mono, monospace);
    font-weight: 700;
    letter-spacing: 0.05em;
  }
</style>
