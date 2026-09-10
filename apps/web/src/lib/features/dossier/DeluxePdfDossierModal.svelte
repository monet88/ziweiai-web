<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import {
    Printer,
    Download,
    X,
    ChevronLeft,
    ChevronRight,
    Award,
    BookOpen,
    ScrollText,
    Share2,
    Check,
  } from 'lucide-svelte';
  import type { ChartSnapshot } from '@ziweiai/contracts';
  import { buildDossierData, type DossierInterpretationPayload } from './dossier-interpretations';
  import {
    exportDossierToPdf,
    triggerDirectDownload,
    formatRoyalSecurityCode,
    type DossierExportProgress,
  } from './dossier-pdf-exporter';
  import DossierExportProgressModal from './DossierExportProgressModal.svelte';
  import { toast } from '$lib/stores/toast';

  interface Props {
    snapshot: ChartSnapshot;
    chartId: string;
    userName?: string;
    onClose: () => void;
  }

  let { snapshot, chartId, userName = '', onClose }: Props = $props();

  const data: DossierInterpretationPayload = $derived(buildDossierData(snapshot, userName));
  const royalSecurityCode = $derived(formatRoyalSecurityCode(chartId));

  let activePageIndex = $state(0);
  let viewMode = $state<'book' | 'scroll'>('book');
  let copied = $state(false);
  const totalPages = 19;

  let isExportingPdf = $state(false);
  let exportProgress = $state<DossierExportProgress>({
    current: 0,
    total: totalPages,
    percent: 0,
    stage: '',
  });
  let abortController = $state<AbortController | null>(null);

  onMount(() => {
    if (!browser) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      } else if (viewMode === 'book') {
        if (e.key === 'ArrowLeft' && activePageIndex > 0) {
          scrollToPage(activePageIndex - 1);
        } else if (e.key === 'ArrowRight' && activePageIndex < totalPages - 1) {
          scrollToPage(activePageIndex + 1);
        }
      }
    }

    function handleBeforePrint() {
      document.body.classList.add('printing-deluxe-dossier');
    }

    function handleAfterPrint() {
      document.body.classList.remove('printing-deluxe-dossier');
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove('printing-deluxe-dossier');
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  });

  function handlePrint() {
    if (!browser) return;
    document.body.classList.add('printing-deluxe-dossier');
    toast.show('🖨️ Đang mở giao diện in ấn chuẩn A4 Vector...', 'info');
    setTimeout(() => {
      window.print();
    }, 250);
  }

  function scrollToPage(index: number) {
    activePageIndex = Math.max(0, Math.min(totalPages - 1, index));
    if (!browser) return;
    if (viewMode === 'scroll') {
      const el = document.getElementById(`dossier-page-${activePageIndex + 1}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      const scrollContainer = document.querySelector('.dossier-document-scroll');
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }
    }
  }

  // Generate SVG QR Code URL for direct digital verification
  const qrVerificationUrl = $derived.by(() => {
    if (!browser) return '';
    return `${window.location.origin}/charts/${chartId}`;
  });

  async function handleShare() {
    if (!browser) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Hồ Sơ Mệnh Lý Hoàng Gia - ${data.userName}`,
          text: `Tra cứu Hồ Sơ Mệnh Lý Hoàng Gia Khâm Thiên Giám của ${data.userName} trên ViOS`,
          url: qrVerificationUrl,
        });
        toast.show('✨ Đã mở chia sẻ thành công!', 'success');
        return;
      } catch {
        // User dismissed
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(qrVerificationUrl);
      copied = true;
      toast.show('✨ Đã sao chép liên kết bảo chứng hồ sơ vào bộ nhớ tạm!', 'success');
      setTimeout(() => {
        copied = false;
      }, 3000);
    } catch {
      toast.show('Không thể sao chép liên kết, vui lòng thử lại.', 'warning');
    }
  }

  async function handleDirectDownload() {
    if (!browser) return;
    if (isExportingPdf) return;

    try {
      isExportingPdf = true;
      abortController = new AbortController();

      // Thu thập 19 trang DOM A4
      const pageElements: HTMLElement[] = [];
      for (let i = 1; i <= totalPages; i++) {
        const el = document.getElementById(`dossier-page-${i}`);
        if (el) pageElements.push(el);
      }

      if (pageElements.length === 0) {
        throw new Error('Không tìm thấy nội dung 19 trang hồ sơ.');
      }

      const result = await exportDossierToPdf({
        pages: pageElements,
        userName: data.userName,
        chartId,
        signal: abortController.signal,
        onProgress: (p) => {
          exportProgress = p;
        },
      });

      triggerDirectDownload(result.blob, result.fileName);
      toast.show('👑 Tải Hồ Sơ Mệnh Lý Hoàng Gia thành công!', 'success');

      setTimeout(() => {
        isExportingPdf = false;
        abortController = null;
      }, 800);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        toast.show('Đã hủy bỏ xuất tệp PDF.', 'info');
      } else {
        console.error('Lỗi khi xuất PDF:', err);
        toast.show(err?.message || 'Có lỗi khi xuất tệp PDF, vui lòng thử lại.', 'danger');
      }
      isExportingPdf = false;
      abortController = null;
    }
  }

  function handleCancelExport() {
    if (abortController) {
      abortController.abort();
    }
  }
</script>

{#snippet securityWatermark()}
  <!-- Personalized Security Watermark -->
  <div class="dossier-watermark" aria-hidden="true">
    <div class="watermark-center">
      <span class="watermark-symbol">❖</span>
      <span class="watermark-text">
        VIOS BẢO CHỨNG HOÀNG TRIỀU · {data.userName.toUpperCase()} · {royalSecurityCode}
      </span>
      <span class="watermark-symbol">❖</span>
    </div>
    <div class="watermark-footer-ribbon">
      <span>BẢN QUYỀN: {data.userName.toUpperCase()} · MÃ BẢO CHỨNG: {royalSecurityCode} · KHÂM THIÊN GIÁM</span>
    </div>
  </div>
{/snippet}

<div class="dossier-overlay" role="dialog" aria-modal="true" aria-labelledby="dossier-modal-title">
  <!-- Screen-only Header Bar -->
  <header class="dossier-screen-bar no-print">
    <div class="bar-left">
      <div class="bar-icon"><Award size={20} class="text-gold" /></div>
      <div>
        <h2 id="dossier-modal-title" class="bar-title">Hồ Sơ Mệnh Lý Hoàng Gia</h2>
        <span class="bar-subtitle">19 Trang Chuẩn In A4 Vector · Khâm Thiên Bảo Giám</span>
      </div>
    </div>

    <!-- Page Jump Navigator -->
    <div class="bar-center">
      <button
        type="button"
        class="nav-btn"
        disabled={activePageIndex === 0}
        onclick={() => scrollToPage(activePageIndex - 1)}
        aria-label="Trang trước"
      >
        <ChevronLeft size={16} />
      </button>

      <span class="page-indicator">Trang {activePageIndex + 1} / {totalPages}</span>

      <button
        type="button"
        class="nav-btn"
        disabled={activePageIndex === totalPages - 1}
        onclick={() => scrollToPage(activePageIndex + 1)}
        aria-label="Trang tiếp"
      >
        <ChevronRight size={16} />
      </button>

      <select
        class="page-select"
        value={activePageIndex}
        onchange={(e) => scrollToPage(Number(e.currentTarget.value))}
      >
        <option value={0}>Trang 1: Bìa Hoàng Gia</option>
        <option value={1}>Trang 2: Tổng Quan Bản Mệnh</option>
        <option value={2}>Trang 3: Toàn Cảnh Tinh Bàn</option>
        {#each data.palaces as p, idx (p.name + idx)}
          <option value={idx + 3}>Trang {idx + 4}: Cung {p.name}</option>
        {/each}
        <option value={15}>Trang 16: Thập Niên Đại Vận (I)</option>
        <option value={16}>Trang 17: Thập Niên Đại Vận (II)</option>
        <option value={17}>Trang 18: Vận Hạn Lưu Niên 2026</option>
        <option value={18}>Trang 19: Triện Son & Xác Thực</option>
      </select>
    </div>

    <div class="bar-right">
      <!-- Toggle View Mode Button -->
      <button
        type="button"
        class="btn-util-dossier"
        onclick={() => (viewMode = viewMode === 'book' ? 'scroll' : 'book')}
        title={viewMode === 'book' ? 'Chuyển sang chế độ cuộn liên tục' : 'Chuyển sang chế độ lật từng trang (Sách)'}
      >
        {#if viewMode === 'book'}
          <ScrollText size={15} />
          <span class="btn-text-desktop">Cuộn liên tục</span>
        {:else}
          <BookOpen size={15} />
          <span class="btn-text-desktop">Lật từng trang</span>
        {/if}
      </button>

      <!-- Share / Copy Link Button -->
      <button
        type="button"
        class="btn-util-dossier"
        onclick={handleShare}
        title="Sao chép liên kết bảo chứng lá số trực tuyến"
      >
        {#if copied}
          <Check size={15} class="text-emerald-400" />
          <span class="btn-text-desktop text-emerald-400">Đã chép link</span>
        {:else}
          <Share2 size={15} />
          <span class="btn-text-desktop">Chia sẻ</span>
        {/if}
      </button>

      <!-- Direct Download PDF Button -->
      <button
        type="button"
        class="btn-download-pdf"
        onclick={handleDirectDownload}
        disabled={isExportingPdf}
        title="Tải trực tiếp tệp PDF 19 trang vector/raster chất lượng cao về máy"
      >
        <Download size={15} />
        <span class="btn-text-desktop">Tải PDF (.pdf)</span>
      </button>

      <!-- Print Button -->
      <button type="button" class="btn-print-dossier" onclick={handlePrint} title="In ấn hoặc Lưu PDF vector 300 DPI">
        <Printer size={16} />
        <span class="btn-text-desktop">In / Lưu PDF</span>
      </button>

      <!-- Close Button -->
      <button type="button" class="btn-close-modal" onclick={onClose} aria-label="Đóng hồ sơ (Esc)">
        <X size={20} />
      </button>
    </div>

    <!-- Golden Reading Progress Bar -->
    <div class="reading-progress-track">
      <div
        class="reading-progress-fill"
        style="width: {((activePageIndex + 1) / totalPages) * 100}%"
      ></div>
    </div>
  </header>

  <!-- Scrollable Document Container -->
  <main class="dossier-document-scroll">
    {#if viewMode === 'book'}
      {#if activePageIndex > 0}
        <button
          type="button"
          class="floating-book-nav prev no-print"
          onclick={() => scrollToPage(activePageIndex - 1)}
          title="Trang trước (←)"
          aria-label="Trang trước"
        >
          <ChevronLeft size={28} />
        </button>
      {/if}
      {#if activePageIndex < totalPages - 1}
        <button
          type="button"
          class="floating-book-nav next no-print"
          onclick={() => scrollToPage(activePageIndex + 1)}
          title="Trang tiếp (→)"
          aria-label="Trang tiếp"
        >
          <ChevronRight size={28} />
        </button>
      {/if}
    {/if}

    <div
      class="dossier-print-container"
      class:mode-book={viewMode === 'book'}
      class:mode-scroll={viewMode === 'scroll'}
      class:is-exporting-pdf={isExportingPdf}
    >

      <!-- ================================================================= -->
      <!-- TRANG 1: BÌA MỘC SON HOÀNG GIA (COVER PAGE) -->
      <!-- ================================================================= -->
      <section id="dossier-page-1" class="dossier-page page-cover" class:is-active={activePageIndex === 0}>
        <div class="page-border-ornament">
          <div class="inner-frame">
            {@render securityWatermark()}
            <!-- Imperial Seal Header -->
            <div class="cover-top">
              <div class="seal-mark">✦ VIOS KHÂM THIÊN GIÁM ✦</div>
              <div class="dynasty-badge">ĐẶC BẢN HOÀNG TRIỀU TIÊN THIÊN BẢO ĐIỂN</div>
            </div>

            <div class="cover-center">
              <h1 class="royal-main-title">HỒ SƠ MỆNH LÝ<br /><span class="highlight-gold">TOÀN THƯ</span></h1>
              <div class="royal-divider">
                <span class="line"></span>
                <span class="diamond">❖</span>
                <span class="line"></span>
              </div>
              <p class="royal-subtitle">KHÂM THIÊN BẢO GIÁM ĐẠI THÀNH TOÀN THƯ</p>

              <!-- Profile Box -->
              <div class="royal-profile-card">
                <div class="profile-row main-name">
                  <span class="label">ĐƯƠNG SỐ:</span>
                  <span class="val name">{data.userName}</span>
                </div>
                <div class="profile-grid">
                  <div class="item">
                    <span class="lbl">Giới Tính:</span>
                    <span class="val">{data.genderText}</span>
                  </div>
                  <div class="item">
                    <span class="lbl">Dương Lịch:</span>
                    <span class="val">{data.solarDateText}</span>
                  </div>
                  <div class="item">
                    <span class="lbl">Âm Lịch:</span>
                    <span class="val">{data.lunarDateText}</span>
                  </div>
                  <div class="item">
                    <span class="lbl">Bản Mệnh:</span>
                    <span class="val gold">{data.destinyElementText}</span>
                  </div>
                  <div class="item">
                    <span class="lbl">Cục Số:</span>
                    <span class="val">{data.fiveElementsClassText}</span>
                  </div>
                  <div class="item">
                    <span class="lbl">Thân Cư:</span>
                    <span class="val">{data.bodyPalaceText}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Cover Footer with Vermilion Stamp -->
            <div class="cover-bottom">
              <div class="imperial-stamp">
                <div class="stamp-box">
                  <span>KHÂM THIÊN</span>
                  <span>GIÁM BÚT</span>
                </div>
                <div class="stamp-label">NGỰ BÚT KHÂM PHÊ</div>
              </div>
              <div class="cover-legal">
                Tài liệu nghiên cứu mệnh lý cung đình được bảo hộ số hóa độc quyền bởi ViOS.<br />
                Xuất bản lưu hành: {new Date().toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 2: TỔNG QUAN BẢN MỆNH & TỨ TRỤ TIÊN THIÊN -->
      <!-- ================================================================= -->
      <section id="dossier-page-2" class="dossier-page" class:is-active={activePageIndex === 1}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG I</span>
              <h2 class="page-title">TIÊN THIÊN KHÍ SỐ & BÁT TỰ TỨ TRỤ</h2>
              <div class="header-divider"></div>
            </header>

            <!-- Bát Tự Tứ Trụ Table -->
            <div class="dossier-card">
              <h3 class="card-title">✦ BÁT TỰ TỨ TRỤ (CAN CHI TIÊN THIÊN)</h3>
              <div class="bazi-columns">
                <div class="bazi-col">
                  <span class="pillar-label">TRỤ NĂM</span>
                  <span class="pillar-val red">{data.baziYear}</span>
                  <span class="pillar-desc">Tổ nghiệp · Phúc ấm</span>
                </div>
                <div class="bazi-col">
                  <span class="pillar-label">TRỤ THÁNG</span>
                  <span class="pillar-val red">{data.baziMonth}</span>
                  <span class="pillar-desc">Cha mẹ · Thời thế</span>
                </div>
                <div class="bazi-col">
                  <span class="pillar-label">TRỤ NGÀY</span>
                  <span class="pillar-val red">{data.baziDay}</span>
                  <span class="pillar-desc">Bản thân · Hôn nhân</span>
                </div>
                <div class="bazi-col">
                  <span class="pillar-label">TRỤ GIỜ</span>
                  <span class="pillar-val red">{data.baziHour}</span>
                  <span class="pillar-desc">Con cái · Hậu vận</span>
                </div>
              </div>
            </div>

            <!-- Tiên Thiên Elements -->
            <div class="dossier-card">
              <h3 class="card-title">✦ KHÍ TIẾT NGŨ HÀNH & TƯƠNG QUAN BẢN MỆNH</h3>
              <div class="element-grid">
                <div class="element-cell">
                  <span class="label">Âm Dương:</span>
                  <span class="value">{data.destinyYinYangText}</span>
                </div>
                <div class="element-cell">
                  <span class="label">Ngũ Hành Cục:</span>
                  <span class="value">{data.fiveElementsClassText}</span>
                </div>
                <div class="element-cell">
                  <span class="label">Chủ Mệnh Tinh:</span>
                  <span class="value gold">{data.masterStarText}</span>
                </div>
                <div class="element-cell">
                  <span class="label">Chủ Thân Tinh:</span>
                  <span class="value gold">{data.bodyMasterStarText}</span>
                </div>
              </div>
            </div>

            <!-- Comprehensive Reading -->
            <div class="dossier-card reading-box">
              <h3 class="card-title">✦ ĐẠI LUẬN TỔNG QUAN KHÍ SỐ</h3>
              <p class="reading-text">{data.overviewReading}</p>
              <p class="reading-text secondary">
                Theo học phái Khâm Thiên Giám, sự hòa hợp giữa Bản Mệnh và Cục định hình 60% nền móng tiên thiên.
                Khi Thân cư đóng tại {data.bodyPalaceText}, đương số càng lớn tuổi càng bộc lộ rõ rệt những khát vọng
                và nhân duyên xoay quanh lĩnh vực của cung vị này.
              </p>
            </div>

            <footer class="page-footer">
              <span>Tử Vi Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 2 / 19</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 3: TOÀN CẢNH TINH BÀN 12 CUNG (VECTOR 300 DPI) -->
      <!-- ================================================================= -->
      <section id="dossier-page-3" class="dossier-page" class:is-active={activePageIndex === 2}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG II</span>
              <h2 class="page-title">TOÀN CẢNH TINH BÀN THIÊN ĐỊA NHÂN</h2>
              <div class="header-divider"></div>
            </header>

            <!-- Vector 4x4 Traditional Astrolabe Board -->
            <div class="astrolabe-print-board">
              <div class="board-12-grid">
                {#each data.palaces as p (p.name + p.index)}
                  <div class="print-palace-cell" class:is-body={p.isBody}>
                    <div class="cell-head">
                      <span class="cell-stem-branch">{p.heavenlyStem} {p.earthlyBranch}</span>
                      <span class="cell-name">{p.name}</span>
                      {#if p.isBody}<span class="badge-body">THÂN</span>{/if}
                    </div>
                    <div class="cell-majors">
                      {#each p.majorStars as ms (ms.name)}
                        <div class="major-item">
                          <span class="star-name">{ms.name}</span>
                          {#if ms.brightness}<span class="star-bright">({ms.brightness})</span>{/if}
                          {#if ms.mutagen}<span class="star-mutagen">[{ms.mutagen}]</span>{/if}
                        </div>
                      {/each}
                      {#if p.majorStars.length === 0}
                        <span class="no-major">Vô Chính Diệu</span>
                      {/if}
                    </div>
                    <div class="cell-minors">
                      {#if p.goodStars.length > 0}
                        <div class="minors-good">{p.goodStars.slice(0, 4).join(', ')}</div>
                      {/if}
                      {#if p.badStars.length > 0}
                        <div class="minors-bad">{p.badStars.slice(0, 4).join(', ')}</div>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <div class="board-legend">
              <div class="legend-item"><span class="dot red"></span> Chính tinh tọa thủ</div>
              <div class="legend-item"><span class="dot green"></span> Cát diệu phò trợ</div>
              <div class="legend-item"><span class="dot purple"></span> Sát tinh cảnh báo</div>
              <div class="legend-item"><span class="dot gold"></span> Tứ hóa quyền biến</div>
            </div>

            <footer class="page-footer">
              <span>Tử Vi Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 3 / 19</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 4 -> 15: ĐẠI LUẬN CHI TIẾT 12 CUNG (MỖI TRANG 1 CUNG A4) -->
      <!-- ================================================================= -->
      {#each data.palaces as palace, pIdx (palace.name + pIdx)}
        <section
          id="dossier-page-{pIdx + 4}"
          class="dossier-page page-palace"
          class:is-active={activePageIndex === pIdx + 3}
        >
          <div class="page-border-ornament">
            <div class="inner-frame page-content">
              {@render securityWatermark()}
              <header class="page-header">
                <span class="chapter-num">CHƯƠNG III · CUNG THỨ {pIdx + 1}</span>
                <h2 class="page-title">
                  CUNG {palace.name.toUpperCase()}
                  <span class="sub-coords">({palace.heavenlyStem.toUpperCase()} {palace.earthlyBranch.toUpperCase()})</span>
                  {#if palace.isBody}<span class="badge-body-title">✦ THÂN CƯ ✦</span>{/if}
                </h2>
                <div class="header-divider"></div>
              </header>

              <!-- Star Distribution Box -->
              <div class="dossier-card star-manifest">
                <div class="manifest-section">
                  <span class="manifest-title">✦ CHÍNH TINH CHỦ QUẢN:</span>
                  <div class="star-tags">
                    {#each palace.majorStars as s (s.name)}
                      <span class="star-pill major">
                        {s.name}
                        {#if s.brightness}<small>({s.brightness})</small>{/if}
                        {#if s.mutagen}<strong>[{s.mutagen}]</strong>{/if}
                      </span>
                    {/each}
                    {#if palace.majorStars.length === 0}
                      <span class="star-pill empty">Vô Chính Diệu (Mượn lực tam hợp & xung chiếu)</span>
                    {/if}
                  </div>
                </div>

                {#if palace.goodStars.length > 0}
                  <div class="manifest-section">
                    <span class="manifest-title">✦ CÁT TINH PHÙ TRỢ:</span>
                    <div class="star-tags">
                      {#each palace.goodStars as s (s)}
                        <span class="star-pill good">{s}</span>
                      {/each}
                    </div>
                  </div>
                {/if}

                {#if palace.badStars.length > 0}
                  <div class="manifest-section">
                    <span class="manifest-title">✦ HUNG SÁT DIỆU GIAO HỘI:</span>
                    <div class="star-tags">
                      {#each palace.badStars as s (s)}
                        <span class="star-pill bad">{s}</span>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>

              <!-- 4-part Royal Interpretation for this Palace -->
              <div class="palace-deep-readings">
                <div class="dossier-card reading-step">
                  <h3 class="step-head">1. BẢN THỂ CUNG VỊ & KHÍ CHẤT TIÊN THIÊN</h3>
                  <p class="step-content">{palace.essenceReading}</p>
                </div>

                <div class="dossier-card reading-step">
                  <h3 class="step-head">2. ĐIỂM TỰA VẬN HỘI & TIỀM NĂNG PHÁT TRIỂN</h3>
                  <p class="step-content">{palace.opportunityReading}</p>
                </div>

                <div class="dossier-card reading-step">
                  <h3 class="step-head">3. CẠM BẪY HUNG SÁT & NGUY CƠ TIỀM ẨN</h3>
                  <p class="step-content">{palace.warningReading}</p>
                </div>

                <div class="dossier-card reading-step royal-accent">
                  <h3 class="step-head gold">4. KIM CHỈ NAM KHÂM THIÊN GIÁM</h3>
                  <p class="step-content">{palace.guidanceReading}</p>
                </div>
              </div>

              <footer class="page-footer">
                <span>Tử Vi Toàn Tập · Cung {palace.name}</span>
                <span>Trang {pIdx + 4} / 19</span>
              </footer>
            </div>
          </div>
        </section>
      {/each}

      <!-- ================================================================= -->
      <!-- TRANG 16: THẬP NIÊN ĐẠI VẬN (PHẦN I: VẬN ĐỜI 1 - 6) -->
      <!-- ================================================================= -->
      <section id="dossier-page-16" class="dossier-page" class:is-active={activePageIndex === 15}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG IV · PHẦN I</span>
              <h2 class="page-title">THẬP NIÊN ĐẠI VẬN & QUỸ ĐẠO VẬN TRÌNH</h2>
              <div class="header-divider"></div>
            </header>

            <p class="section-intro">
              Mệnh là gốc, Vận là đường đi. Một đời người trải qua các chu kỳ 10 năm chuyển cung. Dưới đây là
              phân tích chi tiết tiến trình đại vận từ thời niên thiếu đến trung niên của đương số:
            </p>

            <div class="decadal-timeline">
              {#each data.decadalSummary.slice(0, 6) as dec, dIdx (dec.ageRange + dIdx)}
                <div class="timeline-card">
                  <div class="timeline-badge">ĐẠI VẬN {dIdx + 1}</div>
                  <div class="timeline-content">
                    <div class="timeline-row">
                      <span class="timeline-age">{dec.ageRange}</span>
                      <span class="timeline-palace">Chuyển cung {dec.palaceName} ({dec.branchName.toUpperCase()})</span>
                    </div>
                    <div class="timeline-stars">Sao chủ tọa: <strong>{dec.stars}</strong></div>
                    <p class="timeline-desc">
                      Giai đoạn mang tính bản lề về tích lũy kinh nghiệm, định hình cá tính và xây dựng nền tảng
                      vững chắc cho sự nghiệp và các mối quan hệ đời người.
                    </p>
                  </div>
                </div>
              {/each}
            </div>

            <footer class="page-footer">
              <span>Tử Vi Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 16 / 19</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 17: THẬP NIÊN ĐẠI VẬN (PHẦN II: VẬN ĐỜI 7 - 12) -->
      <!-- ================================================================= -->
      <section id="dossier-page-17" class="dossier-page" class:is-active={activePageIndex === 16}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG IV · PHẦN II</span>
              <h2 class="page-title">QUỸ ĐẠO HẬU VẬN & THÀNH TOÀN CƠ NGHIỆP</h2>
              <div class="header-divider"></div>
            </header>

            <div class="decadal-timeline">
              {#each data.decadalSummary.slice(6, 12) as dec, dIdx (dec.ageRange + dIdx)}
                <div class="timeline-card">
                  <div class="timeline-badge">ĐẠI VẬN {dIdx + 7}</div>
                  <div class="timeline-content">
                    <div class="timeline-row">
                      <span class="timeline-age">{dec.ageRange}</span>
                      <span class="timeline-palace">Chuyển cung {dec.palaceName} ({dec.branchName.toUpperCase()})</span>
                    </div>
                    <div class="timeline-stars">Sao chủ tọa: <strong>{dec.stars}</strong></div>
                    <p class="timeline-desc">
                      Giai đoạn thu hoạch quả ngọt sau những năm tháng phấn đấu, gìn giữ gia phong, chuyển giao
                      phúc ấm cho con cháu và tĩnh dưỡng tinh thần thanh tịnh.
                    </p>
                  </div>
                </div>
              {/each}
            </div>

            <footer class="page-footer">
              <span>Tử Vi Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 17 / 19</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 18: VẬN HẠN LƯU NIÊN BÍNH NGỌ 2026 -->
      <!-- ================================================================= -->
      <section id="dossier-page-18" class="dossier-page" class:is-active={activePageIndex === 17}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG V</span>
              <h2 class="page-title">ĐẠI VẬN LƯU NIÊN BÍNH NGỌ (2026)</h2>
              <div class="header-divider"></div>
            </header>

            <!-- 2026 Special Parameters -->
            <div class="dossier-card year-params">
              <h3 class="card-title">✦ TỌA ĐỘ VẬN HẠN NĂM BÍNH NGỌ 2026</h3>
              <div class="params-grid">
                <div class="param-cell">
                  <span class="label">Lưu Thái Tuế:</span>
                  <span class="value red">{data.yearly2026.thaiTuePalace}</span>
                </div>
                <div class="param-cell">
                  <span class="label">Lưu Kình Dương:</span>
                  <span class="value">{data.yearly2026.kinhDuongBranch}</span>
                </div>
                <div class="param-cell">
                  <span class="label">Lưu Đà La:</span>
                  <span class="value">{data.yearly2026.daLaBranch}</span>
                </div>
                <div class="param-cell">
                  <span class="label">Lưu Tang Môn:</span>
                  <span class="value purple">{data.yearly2026.tangMonBranch}</span>
                </div>
                <div class="param-cell">
                  <span class="label">Lưu Bạch Hổ:</span>
                  <span class="value purple">{data.yearly2026.bachHoBranch}</span>
                </div>
              </div>
            </div>

            <div class="dossier-card reading-box">
              <h3 class="card-title">✦ PHÂN TÍCH DIỄN BIẾN NĂM 2026</h3>
              <p class="reading-text">{data.yearly2026.analysis}</p>
            </div>

            <div class="dossier-card reading-box royal-accent">
              <h3 class="card-title gold">✦ CHIẾN LƯỢC XU CÁT TỊ HÙNG NĂM 2026</h3>
              <p class="reading-text">{data.yearly2026.advice}</p>
            </div>

            <footer class="page-footer">
              <span>Tử Vi Toàn Tập · Lưu Niên 2026</span>
              <span>Trang 18 / 19</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 19: KIM CHỈ NAM TU THÂN & XÁC THỰC SỐ HÓA -->
      <!-- ================================================================= -->
      <section id="dossier-page-19" class="dossier-page page-seal" class:is-active={activePageIndex === 18}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content seal-layout">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG KẾT</span>
              <h2 class="page-title">KIM CHỈ NAM CẢI MỆNH & TRIỆN THƯ HOÀNG GIA</h2>
              <div class="header-divider"></div>
            </header>

            <div class="dossier-card tenets-card">
              <h3 class="card-title gold">✦ TAM ĐẠI NGUYÊN TẮC CẢI MỆNH HOÀNG TRIỀU</h3>
              <div class="tenet-item">
                <span class="tenet-num">I.</span>
                <div class="tenet-text">
                  <strong>ĐỨC NĂNG THẮNG SỐ:</strong> Mệnh do Trời định nhưng Nghiệp do Tâm tạo. Tích đức, hành thiện,
                  hiếu thuận song thân chính là luồng sinh khí mạnh nhất hóa giải mọi hung sát tinh trên tinh bàn.
                </div>
              </div>
              <div class="tenet-item">
                <span class="tenet-num">II.</span>
                <div class="tenet-text">
                  <strong>BIẾT MỆNH ĐỂ THUẬN THỜI:</strong> Khi thời vận chưa tới hãy ẩn nhẫn trau dồi nội lực; khi thời
                  vận hanh thông hãy dốc sức tiến thoái nhịp nhàng, chớ kiêu căng tự mãn.
                </div>
              </div>
              <div class="tenet-item">
                <span class="tenet-num">III.</span>
                <div class="tenet-text">
                  <strong>TÂM AN VẠN SỰ AN:</strong> Tinh bàn là tấm bản đồ dẫn lối, lòng dạ kiên định và trí tuệ sáng suốt
                  mới chính là ngọn hải đăng đưa đương số vượt qua muôn trùng sóng gió cuộc đời.
                </div>
              </div>
            </div>

            <!-- Red Cinnabar Seal & Digital QR Box -->
            <div class="verification-seal-box">
              <div class="seal-column">
                <div class="imperial-grand-seal">
                  <div class="seal-inner">
                    <span class="seal-text-top">KHÂM THIÊN</span>
                    <span class="seal-text-bot">BẢO GIÁM</span>
                  </div>
                </div>
                <span class="seal-caption">MỘC ẤN KHÂM THIÊN GIÁM</span>
              </div>

              <div class="qr-column">
                <div class="qr-code-box">
                  {#if qrVerificationUrl}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrVerificationUrl)}`}
                      alt="Mã QR Xác Thực Hồ Sơ Số Hóa"
                      class="qr-img"
                    />
                  {/if}
                </div>
                <span class="qr-caption">QUÉT MÃ ĐỂ XEM LÁ SỐ ONLINE</span>
              </div>
            </div>

            <div class="closing-blessing">
              Kính chúc đương số <strong>{data.userName}</strong> vạn sự an khang, tài lộc dồi dào, tâm sáng trí minh,
              trọn đời cát tường như ý!
            </div>

            <footer class="page-footer">
              <span>Bản quyền nội dung © ViOS · Tử Vi Toàn Tập</span>
              <span>Trang 19 / 19</span>
            </footer>
          </div>
        </div>
      </section>

    </div>
  </main>

  <!-- Export Progress Modal Overlay -->
  {#if isExportingPdf}
    <DossierExportProgressModal
      progress={exportProgress}
      onCancel={handleCancelExport}
    />
  {/if}
</div>

<style>
  /* =========================================================================
     MODAL LAYOUT & SCREEN STYLING
     ========================================================================= */
  .dossier-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(10, 8, 5, 0.94);
    backdrop-filter: blur(12px);
    z-index: 99999;
    display: flex;
    flex-direction: column;
  }

  .dossier-screen-bar {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    background: linear-gradient(180deg, #1f1a14 0%, #14100c 100%);
    border-bottom: 1px solid #d4af37;
    color: #faf6ed;
    flex-shrink: 0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  }

  .reading-progress-track {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(255, 255, 255, 0.08);
    overflow: hidden;
  }

  .reading-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #d4af37, #ffe082);
    box-shadow: 0 0 8px #d4af37;
    transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .bar-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .bar-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid #d4af37;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bar-title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #d4af37;
    letter-spacing: 0.5px;
  }

  .bar-subtitle {
    font-size: 12px;
    color: #a89f91;
  }

  .bar-center {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .nav-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #faf6ed;
    border-radius: 6px;
    padding: 6px 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .nav-btn:hover:not(:disabled) {
    background: rgba(212, 175, 55, 0.2);
    border-color: #d4af37;
  }

  .nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .page-indicator {
    font-size: 13px;
    font-weight: 600;
    color: #d4af37;
    min-width: 90px;
    text-align: center;
  }

  .page-select {
    background: #252019;
    border: 1px solid rgba(212, 175, 55, 0.4);
    color: #faf6ed;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
  }

  .bar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-util-dossier {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(212, 175, 55, 0.35);
    border-radius: 6px;
    color: #e2d9cc;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-util-dossier:hover {
    background: rgba(212, 175, 55, 0.2);
    border-color: #d4af37;
    color: #fff;
    transform: translateY(-1px);
  }

  .btn-print-dossier {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: linear-gradient(135deg, #d4af37 0%, #aa821c 100%);
    border: 1px solid #ffe082;
    border-radius: 6px;
    color: #1a140a;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(212, 175, 55, 0.3);
    transition: all 0.2s;
  }

  .btn-print-dossier:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  .btn-download-pdf {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 16px;
    background: linear-gradient(135deg, #aa821c 0%, #d4af37 50%, #f59e0b 100%);
    border: 1px solid #fde047;
    border-radius: 6px;
    color: #17130e;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(212, 175, 55, 0.4);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .btn-download-pdf:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(212, 175, 55, 0.6);
    filter: brightness(1.08);
  }

  .btn-download-pdf:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-close-modal {
    background: transparent;
    border: none;
    color: #a89f91;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .btn-close-modal:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }

  .dossier-document-scroll {
    position: relative;
    flex: 1;
    overflow-y: auto;
    padding: 30px 20px;
    display: flex;
    justify-content: center;
  }

  .floating-book-nav {
    position: fixed;
    top: 52%;
    transform: translateY(-50%);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(20, 16, 12, 0.85);
    border: 1px solid #d4af37;
    color: #d4af37;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 100;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.6);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(8px);
  }

  .floating-book-nav:hover {
    background: #d4af37;
    color: #1a140a;
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
  }

  .floating-book-nav.prev {
    left: 24px;
  }

  .floating-book-nav.next {
    right: 24px;
  }

  .dossier-print-container {
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  /* In Book View, hide inactive pages on screen (unless exporting PDF) */
  .dossier-print-container.mode-book:not(.is-exporting-pdf) .dossier-page:not(.is-active) {
    display: none !important;
  }

  /* Khi đang xuất PDF trực tiếp: Hiển thị đầy đủ 19 trang để capture */
  .dossier-print-container.is-exporting-pdf .dossier-page {
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
  }

  .dossier-print-container.mode-book .dossier-page.is-active {
    animation: pageFadeIn 0.22s ease-out;
  }

  @keyframes pageFadeIn {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 900px) {
    .floating-book-nav {
      display: none;
    }
    .btn-text-desktop {
      display: none;
    }
    .bar-subtitle {
      display: none;
    }
  }

  /* =========================================================================
     A4 PAGE SPECIFICATION (210mm x 297mm)
     ========================================================================= */
  .dossier-page {
    width: 210mm;
    min-height: 297mm;
    max-height: 297mm;
    background-color: #faf6ed;
    color: #2b251d;
    box-sizing: border-box;
    padding: 12mm;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    position: relative;
    page-break-after: always;
    break-after: page;
    font-family: 'Playfair Display', Georgia, serif;
    overflow: hidden;
  }

  .page-border-ornament {
    width: 100%;
    height: 100%;
    border: 3px double #d4af37;
    padding: 6mm;
    box-sizing: border-box;
    position: relative;
  }

  .inner-frame {
    width: 100%;
    height: 100%;
    border: 1px solid rgba(212, 175, 55, 0.5);
    padding: 8mm;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  /* =========================================================================
     WATERMARK BẢO MẬT CÁ NHÂN HÓA (PERSONALIZED SECURITY WATERMARK)
     ========================================================================= */
  .dossier-watermark {
    position: absolute;
    inset: 0;
    pointer-events: none;
    user-select: none;
    z-index: 1;
    overflow: hidden;
  }

  .watermark-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-25deg);
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 3.5px;
    color: #aa821c;
    opacity: 0.055;
    white-space: nowrap;
  }

  .watermark-symbol {
    font-size: 16px;
    color: #d4af37;
  }

  .watermark-footer-ribbon {
    position: absolute;
    bottom: 2.5mm;
    left: 10mm;
    right: 10mm;
    display: flex;
    justify-content: center;
    font-size: 7.5px;
    letter-spacing: 1.5px;
    color: #8c734b;
    opacity: 0.42;
    font-weight: 600;
    text-transform: uppercase;
    border-top: 1px dashed rgba(212, 175, 55, 0.25);
    padding-top: 2px;
  }

  /* =========================================================================
     COVER PAGE STYLING (PAGE 1)
     ========================================================================= */
  .page-cover .inner-frame {
    justify-content: space-between;
    align-items: center;
    text-align: center;
    background: radial-gradient(circle at center, #fffdfa 0%, #faf5ea 100%);
  }

  .cover-top {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding-top: 10mm;
  }

  .seal-mark {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 3px;
    color: #b71c1c;
  }

  .dynasty-badge {
    font-size: 10px;
    letter-spacing: 2px;
    color: #7d6b53;
  }

  .cover-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .royal-main-title {
    font-size: 32px;
    font-weight: 800;
    letter-spacing: 4px;
    color: #2b251d;
    margin: 0 0 12px 0;
    line-height: 1.25;
  }

  .royal-main-title .highlight-gold {
    color: #aa821c;
  }

  .royal-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 60%;
    margin: 10px 0;
  }

  .royal-divider .line {
    flex: 1;
    height: 1px;
    background: #d4af37;
  }

  .royal-divider .diamond {
    color: #d4af37;
    font-size: 14px;
  }

  .royal-subtitle {
    font-size: 12px;
    letter-spacing: 3px;
    color: #5c4d3c;
    margin-bottom: 24px;
  }

  .royal-profile-card {
    width: 85%;
    border: 1px solid #d4af37;
    background: rgba(255, 255, 255, 0.85);
    padding: 16px 24px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(212, 175, 55, 0.1);
  }

  .profile-row.main-name {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding-bottom: 12px;
    border-bottom: 1px dashed rgba(212, 175, 55, 0.4);
    margin-bottom: 12px;
  }

  .profile-row.main-name .label {
    font-size: 12px;
    font-weight: 600;
    color: #7d6b53;
  }

  .profile-row.main-name .val.name {
    font-size: 18px;
    font-weight: 800;
    color: #b71c1c;
    letter-spacing: 1px;
  }

  .profile-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
    text-align: left;
    font-size: 11px;
  }

  .profile-grid .item {
    display: flex;
    justify-content: space-between;
  }

  .profile-grid .lbl {
    color: #7d6b53;
  }

  .profile-grid .val {
    font-weight: 600;
    color: #2b251d;
  }

  .profile-grid .val.gold {
    color: #aa821c;
  }

  .cover-bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding-bottom: 10mm;
  }

  .imperial-stamp {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .stamp-box {
    width: 64px;
    height: 64px;
    border: 3px solid #b71c1c;
    color: #b71c1c;
    font-weight: 900;
    font-size: 11px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    letter-spacing: 2px;
    transform: rotate(-3deg);
  }

  .stamp-label {
    font-size: 9px;
    letter-spacing: 1px;
    color: #b71c1c;
    font-weight: 700;
  }

  .cover-legal {
    font-size: 9px;
    color: #8c7e6c;
    line-height: 1.4;
  }

  /* =========================================================================
     PAGE CONTENT & HEADER/FOOTER (PAGES 2 - 19)
     ========================================================================= */
  .page-header {
    text-align: center;
    margin-bottom: 12px;
    flex-shrink: 0;
  }

  .chapter-num {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #aa821c;
    display: block;
    margin-bottom: 2px;
  }

  .page-title {
    font-size: 16px;
    font-weight: 800;
    color: #2b251d;
    letter-spacing: 1px;
    margin: 0;
  }

  .sub-coords {
    font-size: 12px;
    color: #b71c1c;
    margin-left: 6px;
  }

  .badge-body-title {
    font-size: 10px;
    color: #b71c1c;
    font-weight: 700;
    margin-left: 8px;
  }

  .header-divider {
    width: 80px;
    height: 1px;
    background: #d4af37;
    margin: 6px auto 0;
  }

  .page-footer {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: #8c7e6c;
    border-top: 1px solid rgba(212, 175, 55, 0.4);
    padding-top: 6px;
    margin-top: auto;
    flex-shrink: 0;
  }

  .dossier-card {
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(212, 175, 55, 0.4);
    border-radius: 4px;
    padding: 10px 14px;
    margin-bottom: 10px;
  }

  .dossier-card.royal-accent {
    background: rgba(255, 250, 240, 0.95);
    border: 1px solid #d4af37;
  }

  .card-title {
    font-size: 11px;
    font-weight: 700;
    color: #7d6b53;
    margin: 0 0 8px 0;
    letter-spacing: 0.5px;
  }

  .card-title.gold {
    color: #aa821c;
  }

  /* Bazi Columns */
  .bazi-columns {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    text-align: center;
  }

  .bazi-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #fff;
    border: 1px solid rgba(212, 175, 55, 0.3);
    padding: 6px;
    border-radius: 4px;
  }

  .pillar-label {
    font-size: 9px;
    font-weight: 600;
    color: #7d6b53;
  }

  .pillar-val.red {
    font-size: 13px;
    font-weight: 800;
    color: #b71c1c;
    margin: 2px 0;
  }

  .pillar-desc {
    font-size: 8px;
    color: #8c7e6c;
  }

  /* Element Grid */
  .element-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 16px;
    font-size: 11px;
  }

  .element-cell {
    display: flex;
    justify-content: space-between;
  }

  .element-cell .value.gold {
    color: #aa821c;
    font-weight: 700;
  }

  .reading-text {
    font-size: 11px;
    line-height: 1.6;
    color: #2b251d;
    margin: 0 0 8px 0;
    text-align: justify;
  }

  .reading-text.secondary {
    color: #5c4d3c;
    font-style: italic;
    margin: 0;
  }

  /* =========================================================================
     PAGE 3: ASTROLABE BOARD (4x4 GRID)
     ========================================================================= */
  .astrolabe-print-board {
    margin: 8px 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .board-12-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    flex: 1;
  }

  .print-palace-cell {
    border: 1px solid rgba(212, 175, 55, 0.5);
    background: #fff;
    padding: 6px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 85px;
    border-radius: 2px;
  }

  .print-palace-cell.is-body {
    background: #fffdf5;
    border-color: #aa821c;
  }

  .cell-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(212, 175, 55, 0.25);
    padding-bottom: 2px;
    margin-bottom: 4px;
  }

  .cell-stem-branch {
    font-size: 8px;
    color: #8c7e6c;
  }

  .cell-name {
    font-size: 9px;
    font-weight: 700;
    color: #2b251d;
  }

  .badge-body {
    font-size: 7px;
    background: #b71c1c;
    color: #fff;
    padding: 1px 3px;
    border-radius: 2px;
  }

  .major-item {
    font-size: 8.5px;
    font-weight: 700;
    color: #b71c1c;
    line-height: 1.2;
  }

  .star-bright {
    font-size: 7.5px;
    color: #aa821c;
  }

  .star-mutagen {
    font-size: 7.5px;
    color: #d4af37;
  }

  .no-major {
    font-size: 8px;
    color: #8c7e6c;
    font-style: italic;
  }

  .cell-minors {
    margin-top: 4px;
    font-size: 7.5px;
    line-height: 1.2;
  }

  .minors-good {
    color: #1b5e20;
  }

  .minors-bad {
    color: #4a148c;
  }

  .board-legend {
    display: flex;
    justify-content: center;
    gap: 16px;
    font-size: 9px;
    margin-top: 8px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .dot.red { background: #b71c1c; }
  .dot.green { background: #1b5e20; }
  .dot.purple { background: #4a148c; }
  .dot.gold { background: #d4af37; }

  /* =========================================================================
     PALACE PAGES (PAGES 4 - 15)
     ========================================================================= */
  .star-manifest {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
  }

  .manifest-section {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .manifest-title {
    font-size: 9.5px;
    font-weight: 700;
    color: #7d6b53;
    min-width: 140px;
  }

  .star-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .star-pill {
    font-size: 8.5px;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 600;
  }

  .star-pill.major {
    background: #ffebee;
    color: #b71c1c;
    border: 1px solid #ffcdd2;
  }

  .star-pill.major strong {
    color: #aa821c;
    margin-left: 2px;
  }

  .star-pill.good {
    background: #e8f5e9;
    color: #1b5e20;
    border: 1px solid #c8e6c9;
  }

  .star-pill.bad {
    background: #f3e5f5;
    color: #4a148c;
    border: 1px solid #e1bee7;
  }

  .star-pill.empty {
    font-size: 8.5px;
    color: #8c7e6c;
    font-style: italic;
  }

  .palace-deep-readings {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .reading-step {
    margin-bottom: 0;
  }

  .step-head {
    font-size: 10px;
    font-weight: 700;
    color: #7d6b53;
    margin: 0 0 4px 0;
  }

  .step-head.gold {
    color: #aa821c;
  }

  .step-content {
    font-size: 10.5px;
    line-height: 1.5;
    color: #2b251d;
    margin: 0;
    text-align: justify;
  }

  /* =========================================================================
     DECADAL & 2026 PAGES (PAGES 16 - 18)
     ========================================================================= */
  .section-intro {
    font-size: 10.5px;
    color: #5c4d3c;
    margin: 0 0 12px 0;
    line-height: 1.5;
    text-align: justify;
  }

  .decadal-timeline {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .timeline-card {
    display: flex;
    border: 1px solid rgba(212, 175, 55, 0.4);
    background: #fff;
    border-radius: 4px;
    overflow: hidden;
  }

  .timeline-badge {
    background: #aa821c;
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
  }

  .timeline-content {
    padding: 8px 12px;
    flex: 1;
  }

  .timeline-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 2px;
  }

  .timeline-age {
    font-size: 11px;
    font-weight: 800;
    color: #b71c1c;
  }

  .timeline-palace {
    font-size: 10px;
    font-weight: 700;
    color: #2b251d;
  }

  .timeline-stars {
    font-size: 9px;
    color: #7d6b53;
    margin-bottom: 4px;
  }

  .timeline-desc {
    font-size: 9.5px;
    color: #5c4d3c;
    margin: 0;
    line-height: 1.4;
  }

  /* Year params */
  .year-params .params-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    font-size: 10px;
  }

  .param-cell {
    display: flex;
    flex-direction: column;
  }

  .param-cell .label {
    color: #7d6b53;
    font-size: 8.5px;
  }

  .param-cell .value {
    font-weight: 700;
    font-size: 11px;
  }

  .param-cell .value.red { color: #b71c1c; }
  .param-cell .value.purple { color: #4a148c; }

  /* =========================================================================
     SEAL & VERIFICATION PAGE (PAGE 19)
     ========================================================================= */
  .seal-layout {
    justify-content: space-between;
    text-align: center;
  }

  .tenets-card {
    text-align: left;
    margin-top: 10px;
  }

  .tenet-item {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
  }

  .tenet-num {
    font-size: 14px;
    font-weight: 800;
    color: #aa821c;
  }

  .tenet-text {
    font-size: 10.5px;
    line-height: 1.5;
    color: #2b251d;
  }

  .verification-seal-box {
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin: 20px 0;
    padding: 16px;
    border: 1px dashed #d4af37;
    background: rgba(255, 255, 255, 0.6);
  }

  .seal-column, .qr-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .imperial-grand-seal {
    width: 80px;
    height: 80px;
    border: 4px solid #b71c1c;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .seal-inner {
    width: 100%;
    height: 100%;
    border: 1px solid #b71c1c;
    color: #b71c1c;
    font-weight: 900;
    font-size: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    letter-spacing: 2px;
  }

  .seal-caption, .qr-caption {
    font-size: 8.5px;
    font-weight: 700;
    letter-spacing: 1px;
    color: #7d6b53;
  }

  .qr-code-box {
    width: 80px;
    height: 80px;
    border: 1px solid #d4af37;
    background: #fff;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .qr-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .closing-blessing {
    font-size: 12px;
    font-style: italic;
    color: #aa821c;
    padding: 12px;
    border-top: 1px solid rgba(212, 175, 55, 0.4);
  }

  /* =========================================================================
     PRINT STYLES (@media print)
     ========================================================================= */
  @media print {
    :global(html),
    :global(body) {
      margin: 0 !important;
      padding: 0 !important;
      background: #faf6ed !important;
    }

    :global(body.printing-deluxe-dossier),
    :global(body:has(.dossier-overlay)) {
      overflow: visible !important;
      height: auto !important;
      min-height: 0 !important;
      background: #faf6ed !important;
    }

    /* Ẩn các thành phần giao diện nền khi in Dossier */
    :global(body.printing-deluxe-dossier .top-nav-bar),
    :global(body.printing-deluxe-dossier .hero),
    :global(body.printing-deluxe-dossier .board-section),
    :global(body.printing-deluxe-dossier .explanation-section),
    :global(body.printing-deluxe-dossier .assistant-section),
    :global(body.printing-deluxe-dossier .fortune-section),
    :global(body.printing-deluxe-dossier .mobile-bottom-nav),
    :global(body.printing-deluxe-dossier .dossier-header-bar),
    :global(body.printing-deluxe-dossier .reading-progress-track),
    :global(body.printing-deluxe-dossier .floating-book-nav),
    :global(body.printing-deluxe-dossier .no-print),
    :global(body.printing-deluxe-dossier nav),
    :global(body.printing-deluxe-dossier header),
    :global(body.printing-deluxe-dossier footer),
    :global(body.printing-deluxe-dossier button),
    :global(body.printing-deluxe-dossier .toast-container) {
      display: none !important;
    }

    /* Mở khóa toàn bộ container cha để trình duyệt phân trang mượt mà */
    :global(body.printing-deluxe-dossier .app-content-wrapper),
    :global(body.printing-deluxe-dossier .screen),
    :global(body.printing-deluxe-dossier .container),
    :global(body.printing-deluxe-dossier .body-layout),
    :global(body.printing-deluxe-dossier .content),
    :global(body.printing-deluxe-dossier .detail-page) {
      overflow: visible !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      position: static !important;
      padding: 0 !important;
      margin: 0 !important;
      background: #faf6ed !important;
      transform: none !important;
      border: none !important;
      box-shadow: none !important;
    }

    .no-print {
      display: none !important;
    }

    .dossier-overlay {
      position: static !important;
      inset: auto !important;
      width: 100% !important;
      height: auto !important;
      background: #faf6ed !important;
      backdrop-filter: none !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: visible !important;
      display: block !important;
      z-index: auto !important;
    }

    .dossier-document-scroll {
      position: static !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: visible !important;
      height: auto !important;
      display: block !important;
    }

    .dossier-print-container {
      display: block !important;
      gap: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    /* Hiển thị toàn bộ 19 trang dù đang ở chế độ mode-book hay mode-scroll */
    .dossier-print-container.mode-book .dossier-page,
    .dossier-print-container.mode-book .dossier-page:not(.is-active),
    .dossier-print-container.mode-scroll .dossier-page,
    .dossier-print-container .dossier-page {
      display: flex !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      box-shadow: none !important;
      margin: 0 auto !important;
      width: 210mm !important;
      min-height: 297mm !important;
      height: 297mm !important;
      opacity: 1 !important;
      visibility: visible !important;
      transform: none !important;
      animation: none !important;
      background-color: #faf6ed !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    @page {
      size: A4 portrait;
      margin: 0;
    }
  }
</style>
