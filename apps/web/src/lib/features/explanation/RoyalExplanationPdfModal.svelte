<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import {
    Printer,
    Download,
    X,
    ChevronLeft,
    ChevronRight,
    ScrollText,
    Share2,
    Check,
    Award,
  } from 'lucide-svelte';
  import MarkdownView from './MarkdownView.svelte';
  import {
    splitMarkdownIntoRoyalPages,
    exportExplanationToPdf,
    triggerDirectDownload,
    formatRoyalSecurityCode,
    type ExplanationExportProgress,
  } from './explanation-pdf-exporter';
  import DossierExportProgressModal from '../dossier/DossierExportProgressModal.svelte';
  import { toast } from '$lib/stores/toast';

  interface Props {
    markdown: string;
    chartTitle?: string;
    birthInfo?: string;
    chartId: string;
    userName?: string;
    onClose: () => void;
  }

  let {
    markdown,
    chartTitle = 'Lá Số Tử Vi',
    birthInfo = '',
    chartId,
    userName = 'Đương Số',
    onClose,
  }: Props = $props();

  const contentPages = $derived(splitMarkdownIntoRoyalPages(markdown));
  const totalPages = $derived(contentPages.length + 2); // 1 Cover + Content Pages + 1 Seal/Decree Page
  const royalSecurityCode = $derived(formatRoyalSecurityCode(chartId));

  let activePageIndex = $state(0);
  let viewMode = $state<'book' | 'scroll'>('book');
  let copied = $state(false);

  let isExportingPdf = $state(false);
  let exportProgress = $state<ExplanationExportProgress>({
    current: 0,
    total: 0,
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
      document.body.classList.add('printing-explanation-scroll');
    }

    function handleAfterPrint() {
      document.body.classList.remove('printing-explanation-scroll');
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove('printing-explanation-scroll');
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  });

  function handlePrint() {
    if (!browser) return;
    document.body.classList.add('printing-explanation-scroll');
    toast.show('🖨️ Đang chuẩn bị giao diện in Bản Sớ Hoàng Gia...', 'info');
    setTimeout(() => {
      window.print();
    }, 250);
  }

  function scrollToPage(index: number) {
    activePageIndex = Math.max(0, Math.min(totalPages - 1, index));
    if (!browser) return;
    if (viewMode === 'scroll') {
      const el = document.getElementById(`explanation-pdf-page-${activePageIndex + 1}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      const scrollContainer = document.querySelector('.explanation-document-scroll');
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }
    }
  }

  const qrVerificationUrl = $derived.by(() => {
    if (!browser) return '';
    return `${window.location.origin}/charts/${chartId}`;
  });

  async function handleShare() {
    if (!browser) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bản Sớ Luận Giải Hoàng Gia - ${userName}`,
          text: `Tra cứu Bản Sớ Luận Giải Khâm Thiên Giám của ${userName} trên ViOS`,
          url: qrVerificationUrl,
        });
        toast.show('✨ Đã mở chia sẻ thành công!', 'success');
        return;
      } catch {
        // User dismissed
      }
    }

    try {
      await navigator.clipboard.writeText(qrVerificationUrl);
      copied = true;
      toast.show('✨ Đã sao chép liên kết bảo chứng vào bộ nhớ tạm!', 'success');
      setTimeout(() => {
        copied = false;
      }, 3000);
    } catch {
      toast.show('Không thể sao chép liên kết, vui lòng thử lại.', 'warning');
    }
  }

  async function handleDownloadPdf() {
    if (!browser || isExportingPdf) return;

    try {
      isExportingPdf = true;
      abortController = new AbortController();

      const pageElements: HTMLElement[] = [];
      for (let i = 1; i <= totalPages; i++) {
        const el = document.getElementById(`explanation-pdf-page-${i}`);
        if (el) pageElements.push(el);
      }

      if (pageElements.length === 0) {
        throw new Error('Không tìm thấy nội dung các trang sớ để xuất PDF.');
      }

      const titles = [
        'Bìa Ngự Bút Sơn Son',
        ...contentPages.map((_, idx) => `Chương ${idx + 1}: Luận Giải Chi Tiết`),
        'Sắc Chỉ & Triện Ấn Khâm Định',
      ];

      const result = await exportExplanationToPdf({
        pages: pageElements,
        userName,
        chartId,
        pageTitles: titles,
        signal: abortController.signal,
        onProgress: (p) => {
          exportProgress = p;
        },
      });

      triggerDirectDownload(result.blob, result.fileName);
      toast.show('👑 Đã tải thành công Bản Sớ Luận Giải PDF Hoàng Gia!', 'success');
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        toast.show('Đã hủy tác vụ xuất PDF.', 'info');
      } else {
        console.error('Lỗi xuất bản PDF:', err);
        toast.show('Không thể xuất tệp PDF lúc này, vui lòng thử lại.', 'danger');
      }
    } finally {
      isExportingPdf = false;
      abortController = null;
    }
  }

  function handleCancelExport() {
    abortController?.abort();
    isExportingPdf = false;
  }
</script>

<!-- Backdrop Modal -->
<div class="royal-dossier-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-dossier-title">
  <!-- Header Bar -->
  <header class="dossier-header-bar no-print">
    <div class="header-left">
      <div class="dossier-emblem">📜</div>
      <div class="dossier-titles">
        <h2 id="modal-dossier-title" class="title-text">BẢN SỚ LUẬN GIẢI HOÀNG GIA</h2>
        <span class="subtitle-text">
          Đặc bản A4 Đa Trang Ngự Bút • Bảo chứng số {royalSecurityCode}
        </span>
      </div>
    </div>

    <!-- Controls -->
    <div class="header-controls">
      <!-- Pagination Controls (Book Mode) -->
      {#if viewMode === 'book'}
        <div class="pagination-pill">
          <button
            type="button"
            class="page-nav-btn"
            disabled={activePageIndex === 0}
            onclick={() => scrollToPage(activePageIndex - 1)}
            title="Trang trước"
          >
            <ChevronLeft size={16} />
          </button>
          <span class="page-indicator">
            Trang {activePageIndex + 1} / {totalPages}
          </span>
          <button
            type="button"
            class="page-nav-btn"
            disabled={activePageIndex >= totalPages - 1}
            onclick={() => scrollToPage(activePageIndex + 1)}
            title="Trang tiếp theo"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      {/if}

      <!-- View Mode Toggle -->
      <div class="mode-switch">
        <button
          type="button"
          class="mode-btn"
          class:active={viewMode === 'book'}
          onclick={() => (viewMode = 'book')}
          title="Xem từng trang (Chế độ ngự lãm)"
        >
          Từng trang
        </button>
        <button
          type="button"
          class="mode-btn"
          class:active={viewMode === 'scroll'}
          onclick={() => (viewMode = 'scroll')}
          title="Cuộn liên tục (Xem toàn cảnh)"
        >
          Cuộn dọc
        </button>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons-group">
        <button
          type="button"
          class="btn-dossier-action download-btn"
          onclick={handleDownloadPdf}
          disabled={isExportingPdf}
          title="Tải toàn bộ Bản Sớ thành tệp PDF A4 sắc nét"
        >
          <Download size={15} />
          <span>Tải PDF Hoàng Gia</span>
        </button>

        <button
          type="button"
          class="btn-dossier-action print-btn"
          onclick={handlePrint}
          title="In ấn trực tiếp (Print)"
        >
          <Printer size={15} />
          <span>In Sớ</span>
        </button>

        <button
          type="button"
          class="btn-dossier-action share-btn"
          onclick={handleShare}
          title="Chia sẻ liên kết số hóa"
        >
          {#if copied}
            <Check size={15} />
            <span>Đã sao chép</span>
          {:else}
            <Share2 size={15} />
            <span>Chia sẻ</span>
          {/if}
        </button>

        <button
          type="button"
          class="btn-close-dossier"
          onclick={onClose}
          title="Đóng (Escape)"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  </header>

  <!-- Document View Container -->
  <main class="explanation-document-scroll" class:view-scroll={viewMode === 'scroll'}>
    <!-- TRANG 1: BÌA NGỰ BÚT SƠN SON THẾP VÀNG -->
    <div
      id="explanation-pdf-page-1"
      class="royal-pdf-page cover-page"
      class:hidden-in-book={viewMode === 'book' && activePageIndex !== 0}
    >
      <div class="royal-border-outer">
        <div class="royal-border-inner">
          <div class="corner-ornament top-left">❖</div>
          <div class="corner-ornament top-right">❖</div>
          <div class="corner-ornament bottom-left">❖</div>
          <div class="corner-ornament bottom-right">❖</div>

          <div class="cover-content">
            <div class="cover-dynasty-badge">✦ KHÂM THIÊN GIÁM VIOS ✦</div>
            <div class="cover-emblem-ring">
              <Award size={48} class="cover-gold-seal" />
            </div>

            <h1 class="cover-main-title">BẢN SỚ TỬ VI ĐẠI THÀNH LUẬN GIẢI</h1>
            <div class="cover-gold-divider">✦ ✦ ✦</div>
            <div class="cover-chart-name">{chartTitle.toUpperCase()}</div>

            <div class="cover-querent-box">
              <span class="querent-label">PHỤNG CHỈ KHÂM ĐỊNH CHO ĐƯƠNG SỐ</span>
              <span class="querent-name">{userName}</span>
            </div>

            {#if birthInfo}
              <div class="cover-meta-card">
                <span class="meta-label">THÔNG TIN BẢN MỆNH TIÊN THIÊN:</span>
                <p class="meta-content">{birthInfo}</p>
              </div>
            {/if}

            <div class="cover-seal-box">
              <div class="imperial-red-seal">
                <div class="seal-inner-text">
                  <span>KHÂM THIÊN</span>
                  <span>GIÁM</span>
                  <span>NGỰ BẢO</span>
                </div>
              </div>
              <div class="seal-caption">
                <span>PHỤNG CHỈ LẬP SỚ • THỜI VẬN 2026 BÍNH NGỌ</span>
                <span class="seal-code">{royalSecurityCode}</span>
              </div>
            </div>

            <footer class="cover-footer-text">
              <span>ĐẶC BẢN HOÀNG GIA VIOS • TOÀN VĂN LUẬN GIẢI CHUYÊN SÂU TỬ VI ĐẨU SỐ</span>
            </footer>
          </div>
        </div>
      </div>
    </div>

    <!-- CÁC TRANG 2+: NỘI DUNG LUẬN GIẢI CHI TIẾT -->
    {#each contentPages as pageMarkdown, idx (idx)}
      <div
        id="explanation-pdf-page-{idx + 2}"
        class="royal-pdf-page content-page"
        class:hidden-in-book={viewMode === 'book' && activePageIndex !== idx + 1}
      >
        <div class="royal-border-outer">
          <div class="royal-border-inner">
            <!-- Header Trang A4 -->
            <header class="page-top-header">
              <span class="top-emblem">✦ KHÂM THIÊN BẢO GIÁM ✦</span>
              <span class="top-title">BẢN SỚ LUẬN GIẢI — {userName}</span>
              <span class="top-code">{royalSecurityCode}</span>
            </header>

            <!-- Nội dung bài luận -->
            <div class="page-body-content">
              <div class="page-markdown-wrap">
                <MarkdownView markdown={pageMarkdown} />
              </div>
            </div>

            <!-- Footer Trang A4 -->
            <footer class="page-bottom-footer">
              <span class="footer-guarantee">Bảo chứng số hóa bởi Tử Vi Toàn Tập Engine</span>
              <span class="footer-page-num">Trang {idx + 2} / {totalPages}</span>
            </footer>
          </div>
        </div>
      </div>
    {/each}

    <!-- TRANG CUỐI: SẮC CHỈ KHÂM ĐỊNH & BẢO CHỨNG SỐ HÓA -->
    <div
      id="explanation-pdf-page-{totalPages}"
      class="royal-pdf-page decree-page"
      class:hidden-in-book={viewMode === 'book' && activePageIndex !== totalPages - 1}
    >
      <div class="royal-border-outer">
        <div class="royal-border-inner">
          <div class="corner-ornament top-left">❖</div>
          <div class="corner-ornament top-right">❖</div>
          <div class="corner-ornament bottom-left">❖</div>
          <div class="corner-ornament bottom-right">❖</div>

          <header class="page-top-header">
            <span class="top-emblem">✦ KHÂM THIÊN BẢO GIÁM ✦</span>
            <span class="top-title">SẮC CHỈ KHÂM ĐỊNH & TU THÂN CẢI VẬN</span>
            <span class="top-code">{royalSecurityCode}</span>
          </header>

          <div class="decree-body">
            <div class="decree-title-box">
              <h2 class="decree-heading">SẮC CHỈ CẢI TẠO VẬN MỆNH</h2>
              <span class="decree-sub">Đức Năng Thắng Số • Hóa Giải Hung Sát 2026 Bính Ngọ</span>
            </div>

            <div class="decree-card">
              <h3 class="decree-card-title">✦ 4 NGUYÊN TẮC HÓA GIẢI TIÊN THIÊN ✦</h3>
              <ul class="decree-rules">
                <li><strong>1. Tụ Phúc Tu Đức:</strong> Tinh bàn chỉ rõ đường hướng nhưng hành vi đương số là then chốt. Cát tinh cần lòng chân thành nuôi dưỡng, hung tinh sợ tâm tính thuần hậu.</li>
                <li><strong>2. Thuận Thời Ứng Vận:</strong> Gặp vận hạn xung sát năm 2026 Bính Ngọ, nên dưỡng sức chờ thời, tránh manh động đầu tư mạo hiểm hay tranh chấp phù hoa.</li>
                <li><strong>3. Kích Hoạt Cát Cung:</strong> Tận dụng các cung vượng khí (Tài Bạch, Quan Lộc, Phúc Đức) để nâng đỡ và chở che cho các cung suy yếu.</li>
                <li><strong>4. An Định Tâm Trí:</strong> Đọc kỹ các phần luận giải để hiểu rõ chân tướng, không hoang mang trước sao xấu, không kiêu căng khi đắc cách.</li>
              </ul>
            </div>

            <!-- Đại Triện & QR Code -->
            <div class="decree-seal-section">
              <div class="seal-col">
                <div class="imperial-red-seal big-seal">
                  <div class="seal-inner-text">
                    <span>KHÂM THIÊN</span>
                    <span>GIÁM</span>
                    <span>NGỰ BẢO</span>
                  </div>
                </div>
                <span class="seal-verdict">KHÂM ĐỊNH BẢO CHỨNG</span>
              </div>

              <div class="qr-col">
                <div class="qr-box">
                  <div class="qr-frame">
                    <ScrollText size={32} class="text-gold" />
                  </div>
                  <span class="qr-hint">Quét mã hoặc mở link tra cứu:</span>
                  <span class="qr-url">{qrVerificationUrl || 'tuvitoantap.vercel.app'}</span>
                </div>
              </div>
            </div>

            <div class="decree-time-text">
              Phụng chỉ biên soạn ngày {new Date().toLocaleDateString('vi-VN')} • Bản quyền số hóa ViOS
            </div>
          </div>

          <footer class="page-bottom-footer">
            <span class="footer-guarantee">Bản Sớ Hoàn Tất • Niêm Phong Khâm Thiên Giám</span>
            <span class="footer-page-num">Trang {totalPages} / {totalPages}</span>
          </footer>
        </div>
      </div>
    </div>
  </main>
</div>

<!-- Progress Modal -->
{#if isExportingPdf}
  <DossierExportProgressModal progress={exportProgress} onCancel={handleCancelExport} />
{/if}

<style>
  .royal-dossier-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(10, 11, 16, 0.96);
    backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: #f5f6fa;
  }

  /* Header Bar */
  .dossier-header-bar {
    height: 64px;
    background: rgba(18, 20, 30, 0.95);
    border-bottom: 1px solid rgba(212, 175, 55, 0.35);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    gap: 16px;
    z-index: 10;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .dossier-emblem {
    font-size: 24px;
  }

  .dossier-titles {
    display: flex;
    flex-direction: column;
  }

  .title-text {
    font-size: 15px;
    font-weight: 700;
    color: #ffd700;
    margin: 0;
    letter-spacing: 0.5px;
  }

  .subtitle-text {
    font-size: 11.5px;
    color: rgba(245, 246, 250, 0.7);
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .pagination-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    padding: 3px 8px;
  }

  .page-nav-btn {
    background: none;
    border: none;
    color: #f5f6fa;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: 50%;
  }

  .page-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .page-indicator {
    font-size: 12px;
    font-weight: 600;
    color: #ffd700;
    min-width: 80px;
    text-align: center;
  }

  .mode-switch {
    display: flex;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 2px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .mode-btn {
    background: none;
    border: none;
    font-size: 12px;
    color: rgba(245, 246, 250, 0.7);
    padding: 5px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .mode-btn.active {
    background: rgba(212, 175, 55, 0.25);
    color: #ffd700;
    font-weight: 600;
  }

  .action-buttons-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-dossier-action {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .download-btn {
    background: linear-gradient(135deg, #d4af37 0%, #aa8010 100%);
    color: #0b0c10;
    border: none;
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
  }

  .download-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #ffd700 0%, #b88a14 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.45);
  }

  .print-btn,
  .share-btn {
    background: rgba(255, 255, 255, 0.08);
    color: #f5f6fa;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .print-btn:hover,
  .share-btn:hover {
    background: rgba(212, 175, 55, 0.15);
    border-color: rgba(212, 175, 55, 0.4);
    color: #ffd700;
  }

  .btn-close-dossier {
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(245, 246, 250, 0.8);
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-close-dossier:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: #ef4444;
    color: #ffffff;
  }

  /* Document Scroll Area */
  .explanation-document-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 30px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
  }

  .hidden-in-book {
    display: none !important;
  }

  /* Chuẩn A4 Page Dimensions (794px x 1123px ở 96DPI) */
  .royal-pdf-page {
    width: 794px;
    height: 1123px;
    min-height: 1123px;
    max-height: 1123px;
    background: #faf6ed;
    color: #1f2024;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
    box-sizing: border-box;
    padding: 24px;
    position: relative;
    overflow: hidden;
    page-break-after: always;
  }

  .royal-border-outer {
    width: 100%;
    height: 100%;
    border: 3px double #b45309;
    padding: 8px;
    box-sizing: border-box;
  }

  .royal-border-inner {
    width: 100%;
    height: 100%;
    border: 1px solid #d97706;
    padding: 24px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    background: radial-gradient(circle at center, #fffdf8 0%, #faf6ed 100%);
  }

  .corner-ornament {
    position: absolute;
    font-size: 16px;
    color: #b45309;
    line-height: 1;
  }
  .corner-ornament.top-left { top: 6px; left: 6px; }
  .corner-ornament.top-right { top: 6px; right: 6px; }
  .corner-ornament.bottom-left { bottom: 6px; left: 6px; }
  .corner-ornament.bottom-right { bottom: 6px; right: 6px; }

  /* Bìa Ngự Bút */
  .cover-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 16px;
  }

  .cover-dynasty-badge {
    font-size: 13px;
    font-weight: 700;
    color: #b45309;
    letter-spacing: 2px;
  }

  .cover-emblem-ring {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 2px solid #d4af37;
    background: radial-gradient(circle, #fef3c7 0%, #fae8b0 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 14px rgba(212, 175, 55, 0.35);
  }

  :global(.cover-gold-seal) {
    color: #b45309;
  }

  .cover-main-title {
    font-size: 26px;
    font-weight: 800;
    color: #7c2d12;
    letter-spacing: 1px;
    margin: 0;
  }

  .cover-gold-divider {
    font-size: 14px;
    color: #b45309;
    letter-spacing: 6px;
  }

  .cover-chart-name {
    font-size: 18px;
    font-weight: 700;
    color: #9a3412;
  }

  .cover-querent-box {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .querent-label {
    font-size: 11px;
    letter-spacing: 1px;
    color: #78716c;
    font-weight: 600;
  }

  .querent-name {
    font-size: 24px;
    font-weight: 800;
    color: #1c1917;
  }

  .cover-meta-card {
    background: rgba(254, 243, 199, 0.5);
    border: 1px dashed #d97706;
    border-radius: 8px;
    padding: 12px 20px;
    max-width: 520px;
  }

  .meta-label {
    font-size: 11px;
    font-weight: 700;
    color: #b45309;
    display: block;
    margin-bottom: 4px;
  }

  .meta-content {
    font-size: 12.5px;
    color: #44403c;
    line-height: 1.5;
    margin: 0;
  }

  /* Triện Son Đỏ */
  .cover-seal-box {
    margin-top: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .imperial-red-seal {
    width: 82px;
    height: 82px;
    border: 3.5px solid #dc2626;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(239, 68, 68, 0.08);
    box-shadow: 0 0 10px rgba(220, 38, 38, 0.25);
  }

  .imperial-red-seal.big-seal {
    width: 96px;
    height: 96px;
  }

  .seal-inner-text {
    font-size: 11px;
    font-weight: 800;
    color: #dc2626;
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.25;
    letter-spacing: 1px;
  }

  .seal-caption {
    font-size: 10.5px;
    color: #78716c;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .seal-code {
    font-weight: 700;
    color: #b45309;
    letter-spacing: 1px;
  }

  .cover-footer-text {
    margin-top: auto;
    font-size: 10px;
    letter-spacing: 1px;
    color: #a8a29e;
  }

  /* Header & Footer Trong Trang Nội Dung */
  .page-top-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #d97706;
    padding-bottom: 8px;
    font-size: 11px;
    color: #78716c;
    font-weight: 600;
  }

  .top-emblem {
    color: #b45309;
    letter-spacing: 1px;
  }

  .top-title {
    color: #1c1917;
    font-weight: 700;
  }

  .page-bottom-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #d97706;
    padding-top: 8px;
    font-size: 10.5px;
    color: #78716c;
  }

  .footer-page-num {
    font-weight: 700;
    color: #b45309;
  }

  .page-body-content {
    flex: 1;
    overflow: hidden;
    padding: 16px 0;
  }

  .page-markdown-wrap {
    font-size: 13.5px;
    line-height: 1.65;
    color: #1c1917;
  }

  /* Điều chỉnh markdown hiển thị trên giấy A4 */
  .page-markdown-wrap :global(h1),
  .page-markdown-wrap :global(h2) {
    color: #7c2d12 !important;
    font-size: 16px !important;
    border-bottom: 1px solid rgba(180, 83, 9, 0.3);
    padding-bottom: 4px;
    margin-top: 12px;
    margin-bottom: 8px;
  }

  .page-markdown-wrap :global(h3) {
    color: #b45309 !important;
    font-size: 14.5px !important;
    margin-top: 8px;
    margin-bottom: 4px;
  }

  .page-markdown-wrap :global(p),
  .page-markdown-wrap :global(li) {
    color: #292524 !important;
    font-size: 12.5px !important;
    line-height: 1.6 !important;
  }

  .page-markdown-wrap :global(strong) {
    color: #7c2d12 !important;
  }

  /* Trang Sắc Chỉ Cuối */
  .decree-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 16px 8px;
    text-align: center;
  }

  .decree-title-box {
    margin-bottom: 12px;
  }

  .decree-heading {
    font-size: 22px;
    font-weight: 800;
    color: #7c2d12;
    margin: 0 0 4px;
    letter-spacing: 0.5px;
  }

  .decree-sub {
    font-size: 13px;
    color: #b45309;
    font-weight: 600;
  }

  .decree-card {
    background: #fffdf8;
    border: 1px solid #d97706;
    border-radius: 8px;
    padding: 16px 20px;
    text-align: left;
    margin-bottom: 16px;
  }

  .decree-card-title {
    font-size: 13.5px;
    font-weight: 700;
    color: #b45309;
    margin: 0 0 10px;
    text-align: center;
  }

  .decree-rules {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 12.5px;
    color: #44403c;
    line-height: 1.55;
  }

  .decree-rules strong {
    color: #7c2d12;
  }

  .decree-seal-section {
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin: 16px 0;
    gap: 20px;
  }

  .seal-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .seal-verdict {
    font-size: 11px;
    font-weight: 700;
    color: #dc2626;
    letter-spacing: 1px;
  }

  .qr-col {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .qr-box {
    border: 1px dashed #d97706;
    border-radius: 8px;
    padding: 12px 18px;
    background: #fffdf8;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .qr-hint {
    font-size: 11px;
    color: #78716c;
  }

  .qr-url {
    font-size: 11.5px;
    font-weight: 700;
    color: #b45309;
  }

  .decree-time-text {
    font-size: 11px;
    color: #78716c;
    font-style: italic;
  }

  @media (max-width: 840px) {
    .royal-pdf-page {
      width: 95vw;
      height: auto;
      min-height: auto;
      max-height: none;
      padding: 12px;
    }
    .royal-border-inner {
      padding: 14px;
    }
    .dossier-header-bar {
      flex-direction: column;
      height: auto;
      padding: 12px;
      gap: 10px;
    }
    .header-controls {
      flex-wrap: wrap;
      justify-content: center;
    }
  }

  /* In ấn A4 trực tiếp */
  @media print {
    :global(body) {
      background: #faf6ed !important;
    }
    .no-print {
      display: none !important;
    }
    .royal-dossier-overlay {
      position: static !important;
      background: none !important;
      padding: 0 !important;
      overflow: visible !important;
    }
    .explanation-document-scroll {
      padding: 0 !important;
      gap: 0 !important;
      overflow: visible !important;
    }
    .royal-pdf-page {
      box-shadow: none !important;
      margin: 0 !important;
      page-break-after: always !important;
      break-after: page !important;
    }
    .hidden-in-book {
      display: block !important;
    }
  }
</style>
