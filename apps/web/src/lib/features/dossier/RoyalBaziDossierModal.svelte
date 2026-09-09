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
    Flame,
    Sparkles,
    Shield,
    Compass,
  } from 'lucide-svelte';
  import type { ChartSnapshot } from '@ziweiai/contracts';
  import { buildBaziDossierData, type BaziDossierPayload } from './bazi-dossier-interpretations';
  import {
    exportDossierToPdf,
    triggerDirectDownload,
    formatRoyalSecurityCode,
    formatBaziDossierFileName,
    DEFAULT_BAZI_DOSSIER_PAGE_TITLES,
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

  const data: BaziDossierPayload = $derived(buildBaziDossierData(snapshot, userName));
  const royalSecurityCode = $derived(formatRoyalSecurityCode(chartId));

  let activePageIndex = $state(0);
  let viewMode = $state<'book' | 'scroll'>('book');
  let copied = $state(false);
  const totalPages = 17;

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
    toast.show('🖨️ Đang mở giao diện in ấn Bát Tự chuẩn A4 Vector...', 'info');
    setTimeout(() => {
      window.print();
    }, 250);
  }

  function scrollToPage(index: number) {
    activePageIndex = Math.max(0, Math.min(totalPages - 1, index));
    if (!browser) return;
    if (viewMode === 'scroll') {
      const el = document.getElementById(`bazi-page-${activePageIndex + 1}`);
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

  const qrVerificationUrl = $derived.by(() => {
    if (!browser) return '';
    return `${window.location.origin}/charts/${chartId}`;
  });

  async function handleCopyShareLink() {
    if (!browser) return;
    try {
      await navigator.clipboard.writeText(qrVerificationUrl);
      copied = true;
      toast.show('✨ Đã sao chép liên kết chứng thực Bát Tự Hoàng Gia!', 'success');
      setTimeout(() => (copied = false), 2500);
    } catch {
      toast.show('Không thể sao chép liên kết.', 'danger');
    }
  }

  async function handleDirectPdfExport() {
    if (!browser) return;
    if (isExportingPdf) return;

    abortController = new AbortController();
    isExportingPdf = true;
    exportProgress = {
      current: 0,
      total: totalPages,
      percent: 0,
      stage: 'Đang khởi tạo Engine xuất bản PDF Bát Tự Vector...',
    };

    try {
      const pageElements = Array.from(
        document.querySelectorAll<HTMLElement>('.dossier-document-scroll .dossier-page')
      );

      if (pageElements.length === 0) {
        throw new Error('Không tìm thấy các trang hồ sơ để xuất PDF.');
      }

      const result = await exportDossierToPdf({
        pages: pageElements,
        userName: data.userName,
        chartId,
        onProgress: (p) => {
          exportProgress = p;
        },
        signal: abortController.signal,
        pageTitles: [...DEFAULT_BAZI_DOSSIER_PAGE_TITLES],
      });

      const fileName = formatBaziDossierFileName(data.userName, chartId);
      triggerDirectDownload(result.blob, fileName);
      toast.show(`👑 Đã xuất thành công tệp ${fileName}!`, 'success');
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.message?.includes('hủy')) {
        toast.show('Đã dừng tác vụ xuất tệp PDF.', 'info');
      } else {
        toast.show(err?.message || 'Có lỗi xảy ra khi xuất PDF.', 'danger');
      }
    } finally {
      isExportingPdf = false;
      abortController = null;
    }
  }

  function handleCancelPdfExport() {
    if (abortController) {
      abortController.abort();
    }
  }

  const readPercent = $derived(Math.round(((activePageIndex + 1) / totalPages) * 100));
</script>

{#snippet securityWatermark()}
  <div class="royal-watermark">
    <div class="wm-line-1">BẢO CHỨNG HOÀNG GIA · {data.userName}</div>
    <div class="wm-line-2">{royalSecurityCode} · KHÂM THIÊN GIÁM</div>
  </div>
{/snippet}

<div class="dossier-modal-overlay">
  <!-- Top Navigation & Action Toolbar -->
  <header class="dossier-navbar">
    <div class="nav-left">
      <div class="crown-emblem">
        <Award size={20} class="text-gold" />
      </div>
      <div class="nav-title-block">
        <div class="nav-badge">KHÂM THIÊN GIÁM NGỰ PHÊ</div>
        <h1 class="nav-main-title">Hồ Sơ Mệnh Lý Bát Tự Hoàng Gia</h1>
      </div>
    </div>

    <!-- View Mode Selector -->
    <div class="nav-center">
      <div class="view-mode-toggle">
        <button
          type="button"
          class="mode-btn"
          class:is-active={viewMode === 'book'}
          onclick={() => (viewMode = 'book')}
          title="Chế độ Sách: Lật từng trang sang trọng"
        >
          <BookOpen size={16} />
          <span>Sách</span>
        </button>
        <button
          type="button"
          class="mode-btn"
          class:is-active={viewMode === 'scroll'}
          onclick={() => (viewMode = 'scroll')}
          title="Chế độ Cuộn: Xem liền mạch toàn bộ 17 trang"
        >
          <ScrollText size={16} />
          <span>Cuộn</span>
        </button>
      </div>

      {#if viewMode === 'book'}
        <div class="book-pager-control">
          <button
            type="button"
            class="pager-arrow"
            disabled={activePageIndex === 0}
            onclick={() => scrollToPage(activePageIndex - 1)}
            aria-label="Trang trước"
          >
            <ChevronLeft size={16} />
          </button>

          <select
            class="page-dropdown"
            value={activePageIndex}
            onchange={(e) => scrollToPage(Number(e.currentTarget.value))}
            aria-label="Chọn trang"
          >
            {#each DEFAULT_BAZI_DOSSIER_PAGE_TITLES as title, idx (title)}
              <option value={idx}>Trang {idx + 1}: {title}</option>
            {/each}
          </select>

          <button
            type="button"
            class="pager-arrow"
            disabled={activePageIndex === totalPages - 1}
            onclick={() => scrollToPage(activePageIndex + 1)}
            aria-label="Trang tiếp"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      {/if}

      <div class="progress-pill">
        <span>{readPercent}%</span>
      </div>
    </div>

    <div class="nav-right">
      <button
        type="button"
        class="nav-btn btn-share"
        onclick={handleCopyShareLink}
        title="Sao chép link xác thực số hóa"
      >
        {#if copied}
          <Check size={16} class="text-gold" />
          <span>Đã chép</span>
        {:else}
          <Share2 size={16} />
          <span>Chia sẻ</span>
        {/if}
      </button>

      <button
        type="button"
        class="nav-btn btn-download-pdf"
        disabled={isExportingPdf}
        onclick={handleDirectPdfExport}
        title="Tải tệp PDF Vector 17 trang trực tiếp về máy"
      >
        <Download size={16} />
        <span>Tải PDF (.pdf)</span>
      </button>

      <button
        type="button"
        class="nav-btn btn-print"
        onclick={handlePrint}
        title="Mở hộp thoại in ấn chuẩn A4"
      >
        <Printer size={16} />
        <span>In Ngay</span>
      </button>

      <button
        type="button"
        class="nav-btn btn-close"
        onclick={onClose}
        title="Đóng hồ sơ (Esc)"
        aria-label="Đóng"
      >
        <X size={18} />
      </button>
    </div>
  </header>

  <!-- Golden Reading Progress Track -->
  <div class="reading-progress-track">
    <div class="reading-progress-bar" style="width: {readPercent}%"></div>
  </div>

  <!-- Main Scrollable Stage -->
  <main class="dossier-stage">
    <div
      class="dossier-document-scroll"
      class:view-book={viewMode === 'book'}
      class:is-exporting-pdf={isExportingPdf}
    >
      <!-- ================================================================= -->
      <!-- TRANG 1: BÌA MỘC SON HOÀNG GIA TIÊN THIÊN BÁT TỰ BẢO ĐIỂN -->
      <!-- ================================================================= -->
      <section id="bazi-page-1" class="dossier-page page-cover" class:is-active={activePageIndex === 0}>
        <div class="page-border-ornament cover-border">
          <div class="inner-frame cover-frame">
            {@render securityWatermark()}

            <div class="cover-dynasty-seal">
              <span class="seal-character">NGỰ</span>
              <span class="seal-character">PHÊ</span>
            </div>

            <div class="cover-top-emblem">
              <div class="emblem-lines-left"></div>
              <div class="cover-sub-badge">VIOS KHÂM THIÊN GIÁM · TRIỀU ĐÌNH ĐẠI VIỆT</div>
              <div class="emblem-lines-right"></div>
            </div>

            <h1 class="cover-main-title">
              <span class="title-line-1">TIÊN THIÊN BÁT TỰ</span>
              <span class="title-line-2">BẢO ĐIỂN</span>
            </h1>

            <div class="cover-subtitle">
              ĐẠI LUẬN TỨ TRỤ · THẬP THẦN · DỤNG THẦN & VẬN HẠN 2026 BÍNH NGỌ
            </div>

            <div class="cover-royal-crest">
              <svg class="crest-svg" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="46" stroke="#d4af37" stroke-width="1.5" stroke-dasharray="3 3" />
                <circle cx="50" cy="50" r="38" stroke="#d4af37" stroke-width="1" />
                <path d="M50 16 L56 38 L78 38 L60 52 L67 74 L50 60 L33 74 L40 52 L22 38 L44 38 Z" fill="url(#coverGoldGradient)" />
                <defs>
                  <linearGradient id="coverGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#fff2b2" />
                    <stop offset="50%" stop-color="#d4af37" />
                    <stop offset="100%" stop-color="#9a7b1c" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div class="cover-destiny-box">
              <div class="destiny-row">
                <span class="destiny-label">KÍNH TRAO THÂN CHỦ:</span>
                <span class="destiny-value highlight-name">{data.userName}</span>
              </div>
              <div class="destiny-grid">
                <div class="destiny-item">
                  <span class="item-label">Bản Mệnh:</span>
                  <span class="item-val">{data.genderText}</span>
                </div>
                <div class="destiny-item">
                  <span class="item-label">Dương Lịch:</span>
                  <span class="item-val">{data.solarDateText}</span>
                </div>
                <div class="destiny-item">
                  <span class="item-label">Âm Lịch:</span>
                  <span class="item-val">{data.lunarDateText}</span>
                </div>
                <div class="destiny-item">
                  <span class="item-label">Giờ Sinh:</span>
                  <span class="item-val">{data.birthHourText}</span>
                </div>
              </div>
            </div>

            <div class="cover-footer-meta">
              <div class="security-stamp">
                <div class="stamp-code">MÃ BẢO CHỨNG SỐ HÓA: {royalSecurityCode}</div>
                <div class="stamp-note">Bản dịch thuật & nghị định vận số độc quyền ViOS Khâm Thiên Giám</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 2: ĐỒ HÌNH TỨ TRỤ BÁT TỰ & TỨ PHỤ CUNG -->
      <!-- ================================================================= -->
      <section id="bazi-page-2" class="dossier-page" class:is-active={activePageIndex === 1}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG I</span>
              <h2 class="page-title">ĐỒ HÌNH BÁT TỰ TỨ TRỤ & TỨ PHỤ CUNG</h2>
              <div class="header-divider"></div>
            </header>

            <div class="prose-intro">
              <p>
                Bát Tự (Tứ Trụ Mệnh Lý) là đỉnh cao của thuật số phương Đông, lấy 4 cột mốc thời gian: 
                <strong>Năm, Tháng, Ngày, Giờ</strong> làm tọa độ tiên thiên. Từ Nhật Chủ (Thiên can ngày sinh) 
                chiếu rọi tương quan sinh khắc với lệnh tháng và thập thần, ta thấu triệt toàn bộ quy luật thịnh suy 
                của đời người.
              </p>
            </div>

            <!-- Bảng Tứ Trụ Hoàng Gia Tuyệt Đẹp -->
            <div class="four-pillars-board">
              <div class="pillars-table-header">
                <div class="col-head">Mục Tra Cứu</div>
                <div class="col-head">Trụ Năm (Tổ Tiên)</div>
                <div class="col-head">Trụ Tháng (Phụ Mẫu)</div>
                <div class="col-head active-pillar">Trụ Ngày (Bản Thân)</div>
                <div class="col-head">Trụ Giờ (Hậu Vận)</div>
              </div>

              <div class="pillar-row">
                <div class="row-label">Can Chi Tứ Trụ</div>
                {#each data.pillars as p (p.slot + '-sb')}
                  <div class="row-cell stem-branch-cell" class:highlight-cell={p.slot === 'day'}>
                    <span class="sb-label">{p.stemBranchLabel}</span>
                  </div>
                {/each}
              </div>

              <div class="pillar-row">
                <div class="row-label">Thiên Can & Ngũ Hành</div>
                {#each data.pillars as p (p.slot + '-se')}
                  <div class="row-cell">
                    <span class="elem-badge">{p.stem} ({p.stemElement})</span>
                  </div>
                {/each}
              </div>

              <div class="pillar-row">
                <div class="row-label">Thập Thần Can Lộ</div>
                {#each data.pillars as p (p.slot + '-stg')}
                  <div class="row-cell">
                    <span class="tengod-badge">{p.stemTenGod}</span>
                  </div>
                {/each}
              </div>

              <div class="pillar-row">
                <div class="row-label">Địa Chi & Ngũ Hành</div>
                {#each data.pillars as p (p.slot + '-be')}
                  <div class="row-cell">
                    <span class="elem-badge branch-badge">{p.branch} ({p.branchElement})</span>
                  </div>
                {/each}
              </div>

              <div class="pillar-row">
                <div class="row-label">Tàng Can & Thập Thần Ẩn</div>
                {#each data.pillars as p (p.slot + '-hs')}
                  <div class="row-cell hidden-stems-cell">
                    <span>{p.hiddenStemsText}</span>
                  </div>
                {/each}
              </div>

              <div class="pillar-row">
                <div class="row-label">Vòng Trường Sinh</div>
                {#each data.pillars as p (p.slot + '-ls')}
                  <div class="row-cell">
                    <span class="life-stage-badge">{p.lifeStage}</span>
                  </div>
                {/each}
              </div>

              <div class="pillar-row">
                <div class="row-label">Nạp Âm Ngũ Hành</div>
                {#each data.pillars as p (p.slot + '-ny')}
                  <div class="row-cell nayin-cell">
                    <span>{p.naYin}</span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Tứ Phụ Cung -->
            <div class="extra-pillars-card">
              <h3 class="card-subtitle">TỨ PHỤ CUNG TIÊN THIÊN (HỖN NGUYÊN BỔ TRỢ)</h3>
              <div class="extra-pillars-grid">
                <div class="extra-item">
                  <span class="ext-name">Thai Nguyên:</span>
                  <span class="ext-val">{data.extraPillars.taiYuan}</span>
                  <span class="ext-desc">Khí chất thụ bẩm thụ thai</span>
                </div>
                <div class="extra-item">
                  <span class="ext-name">Thai Tức:</span>
                  <span class="ext-val">{data.extraPillars.taiXi}</span>
                  <span class="ext-desc">Khí huyết phụ trợ sinh dưỡng</span>
                </div>
                <div class="extra-item">
                  <span class="ext-name">Mệnh Cung:</span>
                  <span class="ext-val">{data.extraPillars.mingGong}</span>
                  <span class="ext-desc">Chỗ dựa tinh thần và chí hướng</span>
                </div>
                <div class="extra-item">
                  <span class="ext-name">Thân Cung:</span>
                  <span class="ext-val">{data.extraPillars.shenGong}</span>
                  <span class="ext-desc">Nơi nương tựa nửa đời sau</span>
                </div>
              </div>
            </div>

            <footer class="page-footer">
              <span>Bát Tự Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 2 / 17</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 3: CÂN BẰNG NGŨ HÀNH & CHÂN DỤNG THẦN - HỶ THẦN -->
      <!-- ================================================================= -->
      <section id="bazi-page-3" class="dossier-page" class:is-active={activePageIndex === 2}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG II</span>
              <h2 class="page-title">CÂN BẰNG NGŨ HÀNH & CHÂN DỤNG THẦN</h2>
              <div class="header-divider"></div>
            </header>

            <!-- Trọng tâm Nhật Chủ -->
            <div class="daymaster-summary-banner">
              <div class="dm-core">
                <span class="dm-title">NHẬT CHỦ BẢN MỆNH</span>
                <div class="dm-highlight">
                  <span class="dm-can">{data.dayMasterText}</span>
                  <span class="dm-elem">{data.dayMasterElement}</span>
                  <span class="dm-polarity">({data.dayMasterPolarity})</span>
                </div>
              </div>
              <div class="dm-divider"></div>
              <div class="dm-evaluation">
                <div class="eval-badge">TRẠNG THÁI: {data.dayMasterStrength}</div>
                <p class="eval-detail">
                  {data.dayMasterStrength === 'Thân Vượng' || data.dayMasterStrength === 'Vượng Cực'
                    ? 'Khí thế Nhật Chủ dồi dào, tự lập kiên cường, gánh vác được tài quan lớn. Cần Thực Thương tiết khí phát tiết hoa hoa, hoặc Tài Quan khắc hao để thành đại khí.'
                    : 'Nhật Chủ tính tình ôn hòa nhân hậu, ứng biến linh hoạt. Cần Ấn Tinh bồi dưỡng sinh lực hoặc Tỷ Kiếp kề vai sát cánh để gia tăng uy thế.'}
                </p>
              </div>
            </div>

            <!-- Biểu đồ phân bổ Ngũ Hành -->
            <div class="five-elements-section">
              <h3 class="card-subtitle">TỶ LỆ PHÂN PHỐI NGŨ HÀNH TOÀN BÀN</h3>
              <div class="elements-bar-chart">
                <div class="bar-group">
                  <div class="bar-label">Kim ({data.fiveElements.percentages.metal}%)</div>
                  <div class="bar-container">
                    <div class="bar-fill bar-metal" style="width: {data.fiveElements.percentages.metal}%"></div>
                  </div>
                </div>
                <div class="bar-group">
                  <div class="bar-label">Mộc ({data.fiveElements.percentages.wood}%)</div>
                  <div class="bar-container">
                    <div class="bar-fill bar-wood" style="width: {data.fiveElements.percentages.wood}%"></div>
                  </div>
                </div>
                <div class="bar-group">
                  <div class="bar-label">Thủy ({data.fiveElements.percentages.water}%)</div>
                  <div class="bar-container">
                    <div class="bar-fill bar-water" style="width: {data.fiveElements.percentages.water}%"></div>
                  </div>
                </div>
                <div class="bar-group">
                  <div class="bar-label">Hỏa ({data.fiveElements.percentages.fire}%)</div>
                  <div class="bar-container">
                    <div class="bar-fill bar-fire" style="width: {data.fiveElements.percentages.fire}%"></div>
                  </div>
                </div>
                <div class="bar-group">
                  <div class="bar-label">Thổ ({data.fiveElements.percentages.earth}%)</div>
                  <div class="bar-container">
                    <div class="bar-fill bar-earth" style="width: {data.fiveElements.percentages.earth}%"></div>
                  </div>
                </div>
              </div>
              <p class="chart-summary">{data.fiveElements.summaryText}</p>
            </div>

            <!-- Bộ Thần Quyết Định Vận Trình -->
            <div class="useful-gods-grid">
              <div class="god-card god-yong">
                <div class="god-header">
                  <span class="god-badge">ĐỆ NHẤT THẦN</span>
                  <span class="god-name">CHÂN DỤNG THẦN: {data.usefulGods.yongShen.name}</span>
                </div>
                <div class="god-role">{data.usefulGods.yongShen.role}</div>
                <p class="god-desc">{data.usefulGods.yongShen.desc}</p>
              </div>

              <div class="god-card god-xi">
                <div class="god-header">
                  <span class="god-badge">TƯƠNG TRỢ THẦN</span>
                  <span class="god-name">HỶ THẦN: {data.usefulGods.xiShen.name}</span>
                </div>
                <p class="god-desc">{data.usefulGods.xiShen.desc}</p>
              </div>

              <div class="god-card god-ji">
                <div class="god-header">
                  <span class="god-badge badge-warning">CẢNH BÁO THẦN</span>
                  <span class="god-name">KỴ THẦN: {data.usefulGods.jiShen.name}</span>
                </div>
                <p class="god-desc">{data.usefulGods.jiShen.desc}</p>
              </div>

              <div class="god-card god-diaohou">
                <div class="god-header">
                  <span class="god-badge badge-info">ĐIỀU HẬU MÙA SINH</span>
                  <span class="god-name">ĐIỀU HẬU THẦN: {data.usefulGods.diaoHou.name}</span>
                </div>
                <p class="god-desc">{data.usefulGods.diaoHou.reason}</p>
              </div>
            </div>

            <footer class="page-footer">
              <span>Bát Tự Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 3 / 17</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 4: TRỤ NĂM (TỔ TIÊN & NIÊN THIẾU 1 - 16 TUỔI) -->
      <!-- ================================================================= -->
      <section id="bazi-page-4" class="dossier-page" class:is-active={activePageIndex === 3}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG III · TRỤ THỨ NHẤT</span>
              <h2 class="page-title">TRỤ NĂM: CỘI NGUỒN TIÊN TỔ & NIÊN THIẾU</h2>
              <div class="header-divider"></div>
            </header>

            <div class="pillar-focus-card">
              <div class="focus-head">
                <span class="pillar-label">{data.pillars[0]?.slotName}</span>
                <span class="pillar-tag">{data.pillars[0]?.ageRange}</span>
              </div>
              <div class="focus-main">
                <div class="can-chi-huge">{data.pillars[0]?.stemBranchLabel}</div>
                <div class="focus-badges">
                  <span class="badge">Nạp Âm: {data.pillars[0]?.naYin}</span>
                  <span class="badge">Can Lộ: {data.pillars[0]?.stemTenGod}</span>
                  <span class="badge">Trường Sinh: {data.pillars[0]?.lifeStage}</span>
                </div>
              </div>
            </div>

            <div class="reading-body">
              <h3 class="reading-sub">Ý NGHĨA PHONG THỦY & DÒNG DÕI GIA PHONG</h3>
              <p class="reading-text">{data.pillars[0]?.deepReading}</p>

              <h3 class="reading-sub">TƯƠNG TÁC THẬP THẦN & ẨN KHÍ TRỤ NĂM</h3>
              <p class="reading-text">
                Thiên can trụ Năm thấu lộ {data.pillars[0]?.stemTenGod} biểu trưng cho cách thức đương số tiếp nhận 
                tinh hoa từ ông bà tổ tiên. Chi trụ Năm chứa tàng can ({data.pillars[0]?.hiddenStemsText}), 
                là cái nôi nuôi dưỡng tâm hồn thuở ấu thơ. Dù trải qua thăng trầm, phúc ấm cội nguồn luôn là lá chắn 
                vững vàng giúp đương số vượt qua nghịch cảnh niên thiếu để vững vàng bước vào tuổi trưởng thành.
              </p>

              <div class="quote-box">
                <span class="quote-symbol">❝</span>
                <p>
                  "Cây có gốc mới nở ngành xanh ngọn, nước có nguồn mới biển rộng sông sâu. 
                  Người giữ trọn đạo hiếu nghĩa với tổ tiên thì phúc trạch đời đời chẳng dứt."
                </p>
              </div>
            </div>

            <footer class="page-footer">
              <span>Bát Tự Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 4 / 17</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 5: TRỤ THÁNG (PHỤ MẪU & LẬP NGHIỆP 17 - 32 TUỔI) -->
      <!-- ================================================================= -->
      <section id="bazi-page-5" class="dossier-page" class:is-active={activePageIndex === 4}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG III · TRỤ THỨ HAI</span>
              <h2 class="page-title">TRỤ THÁNG: PHỤ MẪU SONG THÂN & KHỞI NGHIỆP</h2>
              <div class="header-divider"></div>
            </header>

            <div class="pillar-focus-card">
              <div class="focus-head">
                <span class="pillar-label">{data.pillars[1]?.slotName}</span>
                <span class="pillar-tag">{data.pillars[1]?.ageRange}</span>
              </div>
              <div class="focus-main">
                <div class="can-chi-huge">{data.pillars[1]?.stemBranchLabel}</div>
                <div class="focus-badges">
                  <span class="badge">Nguyệt Lệnh Nắm Quyền</span>
                  <span class="badge">Can Lộ: {data.pillars[1]?.stemTenGod}</span>
                  <span class="badge">Nạp Âm: {data.pillars[1]?.naYin}</span>
                </div>
              </div>
            </div>

            <div class="reading-body">
              <h3 class="reading-sub">NGUYỆT LỆNH THỐNG SOÁI VẬN SỐ</h3>
              <p class="reading-text">{data.pillars[1]?.deepReading}</p>

              <h3 class="reading-sub">BƯỚC ĐẦU LẬP THÂN (17 - 32 TUỔI)</h3>
              <p class="reading-text">
                Giai đoạn thanh xuân từ 17 đến 32 tuổi là thời khắc chuyển hóa quan trọng nhất. Dưới sự chi phối của 
                Trụ Tháng, đương số bước ra khỏi sự bao bọc của gia đình để thử sức với thương trường và xã hội. 
                Sự phối hợp giữa {data.pillars[1]?.stemTenGod} và các tàng can ({data.pillars[1]?.hiddenStemsText}) 
                tôi rèn tính tự lập, giúp đương số tìm ra sở trường cá nhân và xác lập vị trí vững chắc trong nghề nghiệp.
              </p>

              <div class="highlight-advice-card">
                <Compass size={20} class="text-gold" />
                <div class="advice-content">
                  <strong>Lời khuyên Khâm Thiên Giám:</strong> Giai đoạn này nên coi trọng việc học hỏi kinh nghiệm 
                  hơn lợi nhuận trước mắt. Tìm kiếm ân sư dẫn đường và kết giao cùng những người bạn đồng chí hướng.
                </div>
              </div>
            </div>

            <footer class="page-footer">
              <span>Bát Tự Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 5 / 17</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 6: TRỤ NGÀY (BẢN THÂN & HÔN NHÂN 33 - 48 TUỔI) -->
      <!-- ================================================================= -->
      <section id="bazi-page-6" class="dossier-page" class:is-active={activePageIndex === 5}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG III · TRỤ THỨ BA</span>
              <h2 class="page-title">TRỤ NGÀY: TỌA ĐỘ BẢN THÂN & CUNG HÔN NHÂN</h2>
              <div class="header-divider"></div>
            </header>

            <div class="pillar-focus-card day-pillar-highlight">
              <div class="focus-head">
                <span class="pillar-label">{data.pillars[2]?.slotName}</span>
                <span class="pillar-tag">{data.pillars[2]?.ageRange}</span>
              </div>
              <div class="focus-main">
                <div class="can-chi-huge">{data.pillars[2]?.stemBranchLabel}</div>
                <div class="focus-badges">
                  <span class="badge gold-badge">Nhật Can: {data.dayMasterText} ({data.dayMasterElement})</span>
                  <span class="badge">Cung Phối Ngẫu: {data.pillars[2]?.branch}</span>
                  <span class="badge">Nạp Âm: {data.pillars[2]?.naYin}</span>
                </div>
              </div>
            </div>

            <div class="reading-body">
              <h3 class="reading-sub">KHÍ CHẤT CỐT CÁCH & TRUNG NIÊN HOÀNG KIM</h3>
              <p class="reading-text">{data.pillars[2]?.deepReading}</p>

              <h3 class="reading-sub">NHÂN DUYÊN PHỐI NGẪU & GIA ĐẠO SẮT SON</h3>
              <p class="reading-text">
                Chi ngày đóng vai trò là Cung Phu Thê (Cung Hôn Nhân). Địa chi {data.pillars[2]?.branch} mang bản khí 
                {data.pillars[2]?.branchElement} kết hợp cùng vòng Trường Sinh ({data.pillars[2]?.lifeStage}) 
                phản ánh mẫu hình bạn đời có trí tuệ, biết lắng nghe và đồng cam cộng khổ. Giai đoạn từ 33 đến 48 tuổi 
                là lúc gia đạo ổn định nhất, sự đồng thuận của phu thê chính là đòn bẩy vĩ đại giúp sự nghiệp thăng hoa.
              </p>

              <div class="royal-seal-card">
                <div class="seal-mark">HÒA</div>
                <p>
                  "Gia hòa vạn sự hưng. Thuận vợ thuận chồng tát biển Đông cũng cạn. 
                  Biết tôn trọng và sẻ chia cùng bạn đời là bí quyết dưỡng mệnh tối thượng."
                </p>
              </div>
            </div>

            <footer class="page-footer">
              <span>Bát Tự Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 6 / 17</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 7: TRỤ GIỜ (HẬU VẬN & CON CÁI 49+ TUỔI) -->
      <!-- ================================================================= -->
      <section id="bazi-page-7" class="dossier-page" class:is-active={activePageIndex === 6}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG III · TRỤ THỨ TƯ</span>
              <h2 class="page-title">TRỤ GIỜ: CƠ ĐỒ HẬU VẬN & HẬU DUỆ CON CÁI</h2>
              <div class="header-divider"></div>
            </header>

            <div class="pillar-focus-card">
              <div class="focus-head">
                <span class="pillar-label">{data.pillars[3]?.slotName}</span>
                <span class="pillar-tag">{data.pillars[3]?.ageRange}</span>
              </div>
              <div class="focus-main">
                <div class="can-chi-huge">{data.pillars[3]?.stemBranchLabel}</div>
                <div class="focus-badges">
                  <span class="badge">Cung Tử Tức & Hậu Vận</span>
                  <span class="badge">Can Lộ: {data.pillars[3]?.stemTenGod}</span>
                  <span class="badge">Trường Sinh: {data.pillars[3]?.lifeStage}</span>
                </div>
              </div>
            </div>

            <div class="reading-body">
              <h3 class="reading-sub">CƠ ĐỒ TÍCH LŨY & PHÚC LỘC TUỔI GIÀ</h3>
              <p class="reading-text">{data.pillars[3]?.deepReading}</p>

              <h3 class="reading-sub">TRUYỀN THỪA CHO HẬU DUỆ CON CHÁU</h3>
              <p class="reading-text">
                Trụ Giờ là nơi quy tụ kết quả của cả một đời phấn đấu. Với nạp âm {data.pillars[3]?.naYin} và 
                thập thần {data.pillars[3]?.stemTenGod}, đương số có xu hướng gây dựng tài sản vững bền để lại cho con cháu. 
                Thế hệ tương lai thừa hưởng sự thông tuệ và nề nếp gia giáo, con cái hiếu thảo thành đạt, là niềm tự hào 
                sâu sắc của đương số khi bước vào tuổi xế chiều an khang.
              </p>

              <div class="quote-box">
                <span class="quote-symbol">❝</span>
                <p>
                  "Tích kim tích ngọc chẳng bằng tích đức. 
                  Để lại cho con cháu nhân nghĩa lễ trí tín mới là kho tàng vĩnh cửu chẳng bao giờ vơi cạn."
                </p>
              </div>
            </div>

            <footer class="page-footer">
              <span>Bát Tự Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 7 / 17</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 8: ĐẠI LUẬN THẬP THẦN I (ẤN TINH & QUAN SÁT) -->
      <!-- ================================================================= -->
      <section id="bazi-page-8" class="dossier-page" class:is-active={activePageIndex === 7}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG IV · ĐẠI LUẬN THẬP THẦN (PHẦN I)</span>
              <h2 class="page-title">ẤN TINH (TRÍ TUỆ) & QUAN SÁT (UY QUYỀN)</h2>
              <div class="header-divider"></div>
            </header>

            <div class="ten-gods-block">
              <!-- Nhóm 1: Ấn Tinh -->
              <div class="god-category-card">
                <div class="cat-head">
                  <span class="cat-icon">📜</span>
                  <h3 class="cat-title">{data.tenGodsAnalysis.anTinh.title}</h3>
                </div>
                <div class="cat-body">
                  <p class="cat-eval">{data.tenGodsAnalysis.anTinh.evaluation}</p>
                  <div class="cat-guidance">
                    <strong>Định Hướng Hành Động:</strong> {data.tenGodsAnalysis.anTinh.guidance}
                  </div>
                </div>
              </div>

              <!-- Nhóm 2: Quan Sát -->
              <div class="god-category-card">
                <div class="cat-head">
                  <span class="cat-icon">⚔️</span>
                  <h3 class="cat-title">{data.tenGodsAnalysis.quanSat.title}</h3>
                </div>
                <div class="cat-body">
                  <p class="cat-eval">{data.tenGodsAnalysis.quanSat.evaluation}</p>
                  <div class="cat-guidance">
                    <strong>Định Hướng Hành Động:</strong> {data.tenGodsAnalysis.quanSat.guidance}
                  </div>
                </div>
              </div>
            </div>

            <div class="prose-footnote">
              <p>
                <strong>Quy luật phối hợp Quan - Ấn tương sinh:</strong> Khi Quan Sát có Ấn Tinh thông quan, 
                áp lực trách nhiệm biến thành quyền lực thực thụ và địa vị vững bền. Người đắc cách Quan Ấn 
                dễ trở thành rường cột của tổ chức, lời nói có trọng lượng và được muôn người kính nể.
              </p>
            </div>

            <footer class="page-footer">
              <span>Bát Tự Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 8 / 17</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 9: ĐẠI LUẬN THẬP THẦN II (TÀI TINH, THỰC THƯƠNG, TỶ KIẾP) -->
      <!-- ================================================================= -->
      <section id="bazi-page-9" class="dossier-page" class:is-active={activePageIndex === 8}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG IV · ĐẠI LUẬN THẬP THẦN (PHẦN II)</span>
              <h2 class="page-title">TÀI TINH, THỰC THƯƠNG & TỶ KIẾP</h2>
              <div class="header-divider"></div>
            </header>

            <div class="ten-gods-block-3">
              <!-- Tài Tinh -->
              <div class="god-category-card mini-card">
                <div class="cat-head">
                  <span class="cat-icon">💰</span>
                  <h3 class="cat-title">{data.tenGodsAnalysis.taiTinh.title}</h3>
                </div>
                <div class="cat-body">
                  <p class="cat-eval">{data.tenGodsAnalysis.taiTinh.evaluation}</p>
                  <div class="cat-guidance">
                    <strong>Định hướng:</strong> {data.tenGodsAnalysis.taiTinh.guidance}
                  </div>
                </div>
              </div>

              <!-- Thực Thương -->
              <div class="god-category-card mini-card">
                <div class="cat-head">
                  <span class="cat-icon">🎨</span>
                  <h3 class="cat-title">{data.tenGodsAnalysis.thucThuong.title}</h3>
                </div>
                <div class="cat-body">
                  <p class="cat-eval">{data.tenGodsAnalysis.thucThuong.evaluation}</p>
                  <div class="cat-guidance">
                    <strong>Định hướng:</strong> {data.tenGodsAnalysis.thucThuong.guidance}
                  </div>
                </div>
              </div>

              <!-- Tỷ Kiếp -->
              <div class="god-category-card mini-card">
                <div class="cat-head">
                  <span class="cat-icon">🤝</span>
                  <h3 class="cat-title">{data.tenGodsAnalysis.tyKiep.title}</h3>
                </div>
                <div class="cat-body">
                  <p class="cat-eval">{data.tenGodsAnalysis.tyKiep.evaluation}</p>
                  <div class="cat-guidance">
                    <strong>Định hướng:</strong> {data.tenGodsAnalysis.tyKiep.guidance}
                  </div>
                </div>
              </div>
            </div>

            <footer class="page-footer">
              <span>Bát Tự Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 9 / 17</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 10: THẦN SÁT TOÀN CẢNH (CÁT TINH & HUNG SÁT) -->
      <!-- ================================================================= -->
      <section id="bazi-page-10" class="dossier-page" class:is-active={activePageIndex === 9}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG V</span>
              <h2 class="page-title">THẦN SÁT TOÀN CẢNH: CÁT THẦN & HUNG SÁT</h2>
              <div class="header-divider"></div>
            </header>

            <div class="prose-intro">
              <p>
                Thần Sát là những tinh hoa hội tụ từ tương tác đặc biệt giữa Can và Chi. 
                Cát Thần phù trợ tài lộc, bình an, trí tuệ; Hung Sát cảnh báo thử thách, trắc trở để đương số 
                chủ động phòng ngừa và tu thân hóa giải.
              </p>
            </div>

            <div class="shensha-grid">
              {#each data.shenShaList as ss, sIdx (ss.name + ss.pillar + sIdx)}
                <div class="shensha-card" class:is-auspicious={ss.type === 'cát'} class:is-inauspicious={ss.type === 'hung'}>
                  <div class="ss-head">
                    <span class="ss-name">{ss.name}</span>
                    <span class="ss-badge" class:badge-good={ss.type === 'cát'} class:badge-danger={ss.type === 'hung'}>
                      {ss.type === 'cát' ? 'Cát Tinh' : 'Hung Sát'} · {ss.pillar}
                    </span>
                  </div>
                  <p class="ss-desc">{ss.description}</p>
                </div>
              {/each}

              {#if data.shenShaList.length === 0}
                <div class="empty-shensha">
                  Mệnh bàn thuần khí ngũ hành, ít gặp xung khắc thần sát cực đoan, vận trình phát triển theo nhịp độ tự nhiên bền vững.
                </div>
              {/if}
            </div>

            <div class="shensha-remedy-note">
              <Shield size={18} class="text-gold" />
              <span>
                <strong>Phương châm Khâm Thiên Giám:</strong> Có Cát Thần chớ kiêu căng lơ là; gặp Hung Sát hãy lấy 
                tâm thiện và kỷ luật làm giáp trụ. Đức năng thắng số, lòng nhân hậu hóa giải vạn điều hung.
              </span>
            </div>

            <footer class="page-footer">
              <span>Bát Tự Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 10 / 17</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 11: BẢN ĐỒ THẬP NIÊN ĐẠI VẬN (PHẦN I: ĐẠI VẬN 1 - 4) -->
      <!-- ================================================================= -->
      <section id="bazi-page-11" class="dossier-page" class:is-active={activePageIndex === 10}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG VI · THẬP NIÊN ĐẠI VẬN (PHẦN I)</span>
              <h2 class="page-title">BẢN ĐỒ ĐẠI VẬN: TIỂU THỜI ĐẾN TRƯỞNG THÀNH</h2>
              <div class="header-divider"></div>
            </header>

            <div class="prose-intro">
              <p>
                "Mệnh tốt không bằng Vận tốt". Đại Vận là chu kỳ 10 năm chuyển dời khí trường thiên nhiên. 
                Dưới đây là 4 thập niên đầu tiên định hình toàn bộ nhân sinh quan và đặt nền móng cơ nghiệp.
              </p>
            </div>

            <div class="decadals-list">
              {#each data.decadals.slice(0, 4) as dec (dec.step)}
                <div class="decadal-item-card">
                  <div class="dec-side">
                    <span class="dec-step">VẬN {dec.step}</span>
                    <span class="dec-age">{dec.ageRange}</span>
                  </div>
                  <div class="dec-main">
                    <div class="dec-header">
                      <span class="dec-can-chi">{dec.stemBranch}</span>
                      <span class="dec-meta">{dec.tenGod} · Hành {dec.element}</span>
                      <span class="dec-stage badge">{dec.lifeStage}</span>
                    </div>
                    <p class="dec-summary">{dec.summary}</p>
                  </div>
                </div>
              {/each}
            </div>

            <footer class="page-footer">
              <span>Bát Tự Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 11 / 17</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 12: BẢN ĐỒ THẬP NIÊN ĐẠI VẬN (PHẦN II: ĐẠI VẬN 5 - 8) -->
      <!-- ================================================================= -->
      <section id="bazi-page-12" class="dossier-page" class:is-active={activePageIndex === 11}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG VI · THẬP NIÊN ĐẠI VẬN (PHẦN II)</span>
              <h2 class="page-title">BẢN ĐỒ ĐẠI VẬN: TRUNG NIÊN ĐẾN HẬU VẬN</h2>
              <div class="header-divider"></div>
            </header>

            <div class="prose-intro">
              <p>
                Giai đoạn từ Đại Vận 5 đến Đại Vận 8 là thời khắc thu hoạch thành quả, bảo tồn sản nghiệp và an hưởng phúc trạch. 
                Thấu hiểu nhịp độ thịnh suy giúp đương số biết tiến thoái nhịp nhàng, gìn giữ vinh quang trọn vẹn.
              </p>
            </div>

            <div class="decadals-list">
              {#each data.decadals.slice(4, 8) as dec (dec.step)}
                <div class="decadal-item-card">
                  <div class="dec-side">
                    <span class="dec-step">VẬN {dec.step}</span>
                    <span class="dec-age">{dec.ageRange}</span>
                  </div>
                  <div class="dec-main">
                    <div class="dec-header">
                      <span class="dec-can-chi">{dec.stemBranch}</span>
                      <span class="dec-meta">{dec.tenGod} · Hành {dec.element}</span>
                      <span class="dec-stage badge">{dec.lifeStage}</span>
                    </div>
                    <p class="dec-summary">{dec.summary}</p>
                  </div>
                </div>
              {/each}
            </div>

            <footer class="page-footer">
              <span>Bát Tự Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 12 / 17</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 13: ĐẠI LUẬN LƯU NIÊN 2026 BÍNH NGỌ -->
      <!-- ================================================================= -->
      <section id="bazi-page-13" class="dossier-page" class:is-active={activePageIndex === 12}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG VII · TRỌNG TÂM NIÊN VẬN</span>
              <h2 class="page-title">ĐẠI VẬN VẬN HẠN NĂM 2026 BÍNH NGỌ</h2>
              <div class="header-divider"></div>
            </header>

            <div class="year-2026-hero-banner">
              <div class="hero-left">
                <Flame size={28} class="text-gold" />
                <div>
                  <div class="hero-year-title">{data.yearly2026.yearCanChi}</div>
                  <div class="hero-year-nayin">Nạp Âm: {data.yearly2026.yearNaYin}</div>
                </div>
              </div>
              <div class="hero-right">
                <div class="year-rating-badge">ĐÁNH GIÁ: {data.yearly2026.rating}</div>
                <div class="year-tengod">Thập Thần Chiếu: {data.yearly2026.tenGod}</div>
              </div>
            </div>

            <!-- Tương tác Can Chi 2026 -->
            <div class="year-interactions-box">
              <h3 class="card-subtitle">TƯƠNG TÁC THIÊN CAN & ĐỊA CHI VỚI BÁT TỰ</h3>
              <p class="interaction-lead">{data.yearly2026.dayMasterRelation}</p>

              <div class="branch-interactions-grid">
                {#each data.yearly2026.branchInteractions as bi, bIdx (bi.type + bi.pillar + bIdx)}
                  <div class="branch-int-item">
                    <span class="bi-type badge" class:badge-good={bi.type === 'Tam Hợp' || bi.type === 'Lục Hợp'} class:badge-danger={bi.type === 'Tương Xung' || bi.type === 'Tự Hình'}>
                      {bi.type} ({bi.pillar})
                    </span>
                    <span class="bi-desc">{bi.desc}</span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- 4 Trụ cột Vận Trình -->
            <div class="four-pillars-forecast-grid">
              <div class="forecast-pillar-card">
                <div class="f-head">💼 CÔNG DANH & SỰ NGHIỆP</div>
                <p class="f-text">{data.yearly2026.career}</p>
              </div>
              <div class="forecast-pillar-card">
                <div class="f-head">💎 TÀI CHÍNH & TIỀN BẠC</div>
                <p class="f-text">{data.yearly2026.wealth}</p>
              </div>
              <div class="forecast-pillar-card">
                <div class="f-head">❤️ NHÂN DUYÊN & GIA ĐẠO</div>
                <p class="f-text">{data.yearly2026.love}</p>
              </div>
              <div class="forecast-pillar-card">
                <div class="f-head">🌿 SỨC KHỎE & BÌNH AN</div>
                <p class="f-text">{data.yearly2026.health}</p>
              </div>
            </div>

            <footer class="page-footer">
              <span>Bát Tự Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 13 / 17</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 14: VẬN TRÌNH 12 THÁNG NĂM 2026 (THÁNG 1 - 6) -->
      <!-- ================================================================= -->
      <section id="bazi-page-14" class="dossier-page" class:is-active={activePageIndex === 13}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG VIII · NGUYỆT LỆNH 2026 (PHẦN I)</span>
              <h2 class="page-title">VẬN TRÌNH 12 THÁNG NĂM 2026: THÁNG 1 - 6</h2>
              <div class="header-divider"></div>
            </header>

            <div class="months-grid">
              {#each data.yearly2026.months.slice(0, 6) as m (m.month)}
                <div class="month-card">
                  <div class="month-head">
                    <span class="m-title">Tháng {m.month} ({m.canChi})</span>
                    <span class="m-stars">{'★'.repeat(m.ratingScore)}{'☆'.repeat(5 - m.ratingScore)}</span>
                  </div>
                  <div class="m-headline">{m.headline}</div>
                  <p class="m-guidance"><strong>Lời khuyên:</strong> {m.guidance}</p>
                </div>
              {/each}
            </div>

            <footer class="page-footer">
              <span>Bát Tự Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 14 / 17</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 15: VẬN TRÌNH 12 THÁNG NĂM 2026 (THÁNG 7 - 12) -->
      <!-- ================================================================= -->
      <section id="bazi-page-15" class="dossier-page" class:is-active={activePageIndex === 14}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG VIII · NGUYỆT LỆNH 2026 (PHẦN II)</span>
              <h2 class="page-title">VẬN TRÌNH 12 THÁNG NĂM 2026: THÁNG 7 - 12</h2>
              <div class="header-divider"></div>
            </header>

            <div class="months-grid">
              {#each data.yearly2026.months.slice(6, 12) as m (m.month)}
                <div class="month-card">
                  <div class="month-head">
                    <span class="m-title">Tháng {m.month} ({m.canChi})</span>
                    <span class="m-stars">{'★'.repeat(m.ratingScore)}{'☆'.repeat(5 - m.ratingScore)}</span>
                  </div>
                  <div class="m-headline">{m.headline}</div>
                  <p class="m-guidance"><strong>Lời khuyên:</strong> {m.guidance}</p>
                </div>
              {/each}
            </div>

            <footer class="page-footer">
              <span>Bát Tự Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 15 / 17</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 16: CHIẾN LƯỢC CẢI VẬN & PHONG THỦY DỤNG THẦN -->
      <!-- ================================================================= -->
      <section id="bazi-page-16" class="dossier-page" class:is-active={activePageIndex === 15}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG IX</span>
              <h2 class="page-title">CHIẾN LƯỢC CẢI VẬN & PHONG THỦY DỤNG THẦN</h2>
              <div class="header-divider"></div>
            </header>

            <div class="prose-intro">
              <p>
                "Số mệnh tại thiên, cải biến tại nhân". Phong thủy Bát Tự không mang màu sắc thần bí, 
                mà là khoa học điều chỉnh từ trường sống, màu sắc, phương vị và hành vi để bổ khuyết Dụng Thần, 
                tiêu trừ sát khí và đưa vận trình đạt đến sự quân bình tuyệt đối.
              </p>
            </div>

            <div class="remedies-grid">
              <div class="remedy-card">
                <div class="rc-title">🎨 MÀU SẮC BẢN MỆNH VƯỢNG KHÍ</div>
                <div class="rc-badges">
                  {#each data.remedies.luckyColors as color (color)}
                    <span class="r-badge">{color}</span>
                  {/each}
                </div>
                <p class="rc-desc">Ưu tiên sử dụng trong trang phục hàng ngày, phụ kiện, màu sơn phòng làm việc và nội thất ô tô.</p>
              </div>

              <div class="remedy-card">
                <div class="rc-title">🧭 PHƯƠNG VỊ SINH TÀI HƯNG VƯỢNG</div>
                <div class="rc-badges">
                  {#each data.remedies.luckyDirections as dir (dir)}
                    <span class="r-badge">{dir}</span>
                  {/each}
                </div>
                <p class="rc-desc">Thích hợp làm hướng bàn làm việc, hướng cửa chính hoặc hướng xuất hành đầu năm đón may mắn.</p>
              </div>

              <div class="remedy-card">
                <div class="rc-title">🔢 CON SỐ KÍCH HOẠT QUÝ NHÂN</div>
                <div class="rc-badges">
                  {#each data.remedies.luckyNumbers as num (num)}
                    <span class="r-badge">{num}</span>
                  {/each}
                </div>
                <p class="rc-desc">Thích hợp ứng dụng chọn số đuôi điện thoại, số tầng nhà, biển số xe hoặc số tài khoản ngân hàng.</p>
              </div>

              <div class="remedy-card">
                <div class="rc-title">💼 LĨNH VỰC NGHỀ NGHIỆP TƯƠNG HỢP</div>
                <div class="rc-badges">
                  {#each data.remedies.careerSectors as sector (sector)}
                    <span class="r-badge">{sector}</span>
                  {/each}
                </div>
                <p class="rc-desc">Các ngành nghề bổ trợ đắc lực cho Dụng Thần, giúp đương số phát huy tối đa tiềm năng và dễ gặt hái thành công vượt trội.</p>
              </div>
            </div>

            <!-- Tâm pháp tu dưỡng -->
            <div class="mindset-remedy-card">
              <Sparkles size={22} class="text-gold" />
              <div class="mindset-body">
                <div class="mindset-title">TÂM PHÁP TU DƯỠNG CẢI TẠO VẬN MỆNH</div>
                <p class="mindset-text">{data.remedies.mindsetAdvice}</p>
              </div>
            </div>

            <footer class="page-footer">
              <span>Bát Tự Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 16 / 17</span>
            </footer>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- TRANG 17: SẮC CHỈ KHÂM THIÊN GIÁM & BẢO CHỨNG SỐ HÓA -->
      <!-- ================================================================= -->
      <section id="bazi-page-17" class="dossier-page page-seal" class:is-active={activePageIndex === 16}>
        <div class="page-border-ornament">
          <div class="inner-frame page-content">
            {@render securityWatermark()}
            <header class="page-header">
              <span class="chapter-num">CHƯƠNG X</span>
              <h2 class="page-title">SẮC CHỈ KHÂM THIÊN GIÁM & BẢO CHỨNG SỐ HÓA</h2>
              <div class="header-divider"></div>
            </header>

            <div class="imperial-decree-box">
              <div class="decree-header">
                <div class="decree-title">SẮC LỆNH KHÂM THIÊN GIÁM TRIỀU ĐÌNH</div>
                <div class="decree-sub">NGỰ PHÊ CHỨNG ĐỊNH THIÊN THỜI ĐỊA LỢI NHÂN HÒA</div>
              </div>

              <div class="decree-body">
                <p>
                  Khâm Thiên Giám phụng mệnh trời đất, khảo sát tinh tú can chi, nay chuẩn định: 
                  Bản mệnh đương số <strong>{data.userName}</strong> thụ bẩm tinh hoa Tứ Trụ Bát Tự, 
                  hội đủ âm dương ngũ hành, khí chất thanh tú kiên cường.
                </p>
                <p>
                  Năm Bính Ngọ 2026 khí tượng quang minh rực rỡ, mở ra thiên thời thuận lợi. 
                  Nguyện chúc đương số vững bước đường đời, tâm sáng như trăng rằm, ý chí vững như núi Thái Sơn, 
                  công thành danh toại, gia đạo hưng long, phước thọ miên trường.
                </p>
              </div>

              <div class="decree-signatures">
                <div class="sig-col">
                  <div class="sig-role">KHÂM THIÊN GIÁM ĐẠI THẦN</div>
                  <div class="seal-visual">
                    <div class="royal-red-seal">
                      <span>KHÂM</span>
                      <span>THIÊN</span>
                      <span>GIÁM</span>
                      <span>ẤN</span>
                    </div>
                  </div>
                  <div class="sig-name">ViOS Quốc Triều Ngự Phê</div>
                </div>

                <div class="sig-col qr-col">
                  <div class="sig-role">XÁC THỰC SỐ HÓA VECTOR</div>
                  <div class="qr-code-box">
                    <svg class="qr-svg" viewBox="0 0 100 100">
                      <rect width="100" height="100" fill="#fcf9f2" />
                      <!-- Pattern giả lập QR vector -->
                      <rect x="10" y="10" width="25" height="25" fill="#2b1f0c" />
                      <rect x="15" y="15" width="15" height="15" fill="#fcf9f2" />
                      <rect x="18" y="18" width="9" height="9" fill="#2b1f0c" />
                      <rect x="65" y="10" width="25" height="25" fill="#2b1f0c" />
                      <rect x="70" y="15" width="15" height="15" fill="#fcf9f2" />
                      <rect x="73" y="18" width="9" height="9" fill="#2b1f0c" />
                      <rect x="10" y="65" width="25" height="25" fill="#2b1f0c" />
                      <rect x="15" y="70" width="15" height="15" fill="#fcf9f2" />
                      <rect x="18" y="73" width="9" height="9" fill="#2b1f0c" />
                      <rect x="45" y="15" width="8" height="8" fill="#2b1f0c" />
                      <rect x="45" y="35" width="18" height="8" fill="#2b1f0c" />
                      <rect x="70" y="45" width="8" height="18" fill="#2b1f0c" />
                      <rect x="45" y="65" width="12" height="12" fill="#2b1f0c" />
                      <rect x="70" y="75" width="15" height="15" fill="#2b1f0c" />
                    </svg>
                  </div>
                  <div class="qr-label">Quét mã tra cứu hồ sơ trực tuyến</div>
                  <div class="qr-sec-code">{royalSecurityCode}</div>
                </div>
              </div>
            </div>

            <footer class="page-footer">
              <span>Bát Tự Toàn Tập · Khâm Thiên Bảo Giám</span>
              <span>Trang 17 / 17</span>
            </footer>
          </div>
        </div>
      </section>
    </div>
  </main>
</div>

<!-- Modal hiển thị tiến trình xuất PDF -->
{#if isExportingPdf}
  <DossierExportProgressModal
    progress={exportProgress}
    onCancel={handleCancelPdfExport}
  />
{/if}

<style>
  /* ========================================================================= */
  /* MODAL OVERLAY & TOOLBAR */
  /* ========================================================================= */
  .dossier-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: #080604;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .dossier-navbar {
    height: 60px;
    background: linear-gradient(180deg, #1b1307 0%, #100b03 100%);
    border-bottom: 1px solid #3d2b0e;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    gap: 12px;
    flex-shrink: 0;
  }

  .nav-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .crown-emblem {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #2b1f0c;
    border: 1px solid #d4af37;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-badge {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: #d4af37;
  }

  .nav-main-title {
    font-size: 15px;
    font-weight: 600;
    color: #f6e6b8;
    margin: 0;
    font-family: Georgia, 'Times New Roman', serif;
  }

  .nav-center {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .view-mode-toggle {
    display: flex;
    background: #0d0903;
    border: 1px solid #3d2b0e;
    border-radius: 6px;
    padding: 2px;
  }

  .mode-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border: none;
    background: transparent;
    color: #a89470;
    font-size: 12px;
    font-weight: 500;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .mode-btn.is-active {
    background: #2b1f0c;
    color: #f6e6b8;
    border: 1px solid #d4af37;
  }

  .book-pager-control {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .pager-arrow {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1e1509;
    border: 1px solid #3d2b0e;
    color: #e5cf96;
    border-radius: 4px;
    cursor: pointer;
  }

  .pager-arrow:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .page-dropdown {
    height: 28px;
    background: #1e1509;
    border: 1px solid #3d2b0e;
    color: #e5cf96;
    font-size: 12px;
    border-radius: 4px;
    padding: 0 8px;
    outline: none;
    cursor: pointer;
  }

  .progress-pill {
    padding: 3px 8px;
    background: #2b1f0c;
    border: 1px solid #d4af37;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    color: #f6e6b8;
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .nav-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-share {
    background: #1e1509;
    border: 1px solid #3d2b0e;
    color: #e5cf96;
  }

  .btn-download-pdf {
    background: linear-gradient(135deg, #2b1f0c 0%, #1a1205 100%);
    border: 1px solid #d4af37;
    color: #f6e6b8;
  }

  .btn-print {
    background: #d4af37;
    border: 1px solid #d4af37;
    color: #1a1205;
    font-weight: 700;
  }

  .btn-close {
    background: transparent;
    border: 1px solid #3d2b0e;
    color: #a89470;
    padding: 6px 8px;
  }

  .btn-close:hover {
    color: #fff;
    border-color: #666;
  }

  .reading-progress-track {
    height: 3px;
    background: #1e1509;
    width: 100%;
    flex-shrink: 0;
  }

  .reading-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #d4af37 0%, #fff2b2 100%);
    transition: width 0.2s ease;
  }

  /* ========================================================================= */
  /* STAGE & DOCUMENT SCROLL */
  /* ========================================================================= */
  .dossier-stage {
    flex: 1;
    overflow: hidden;
    position: relative;
    background: #0d0a06;
  }

  .dossier-document-scroll {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 24px 16px 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    scroll-behavior: smooth;
  }

  /* In book view, only active page shows unless exporting PDF */
  .dossier-document-scroll.view-book:not(.is-exporting-pdf) .dossier-page {
    display: none;
  }

  .dossier-document-scroll.view-book:not(.is-exporting-pdf) .dossier-page.is-active {
    display: block;
  }

  /* ========================================================================= */
  /* A4 PAGE SPECIFICATIONS (210mm x 297mm) */
  /* ========================================================================= */
  .dossier-page {
    width: 210mm;
    min-height: 297mm;
    height: 297mm;
    background: #fcf9f2;
    color: #2b1f0c;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
    box-sizing: border-box;
    padding: 10mm;
    position: relative;
    overflow: hidden;
    font-family: Georgia, 'Times New Roman', serif;
  }

  .page-border-ornament {
    width: 100%;
    height: 100%;
    border: 2px solid #8b2500;
    box-sizing: border-box;
    padding: 2.5mm;
    position: relative;
  }

  .page-border-ornament::before,
  .page-border-ornament::after {
    content: '❖';
    position: absolute;
    font-size: 14px;
    color: #d4af37;
  }
  .page-border-ornament::before {
    top: 2px;
    left: 2px;
  }
  .page-border-ornament::after {
    bottom: 2px;
    right: 2px;
  }

  .inner-frame {
    width: 100%;
    height: 100%;
    border: 1px solid #d4af37;
    box-sizing: border-box;
    padding: 6mm 8mm;
    display: flex;
    flex-direction: column;
    position: relative;
    background: #fffdf9;
  }

  /* Watermark Bảo Mật Cá Nhân Hóa */
  .royal-watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-25deg);
    pointer-events: none;
    user-select: none;
    z-index: 10;
    text-align: center;
    opacity: 0.055;
    white-space: nowrap;
  }

  .wm-line-1 {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: 6px;
    color: #8b2500;
  }

  .wm-line-2 {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 4px;
    color: #2b1f0c;
    margin-top: 4px;
  }

  /* Page Headers & Footers */
  .page-header {
    text-align: center;
    margin-bottom: 4mm;
    position: relative;
    z-index: 2;
  }

  .chapter-num {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #8b2500;
    display: block;
    margin-bottom: 2px;
  }

  .page-title {
    font-size: 16px;
    font-weight: 700;
    color: #2b1f0c;
    margin: 0;
    letter-spacing: 0.5px;
  }

  .header-divider {
    width: 60px;
    height: 2px;
    background: linear-gradient(90deg, transparent, #d4af37, transparent);
    margin: 4px auto 0;
  }

  .page-footer {
    margin-top: auto;
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: #8c7355;
    border-top: 1px solid #ebdcc5;
    padding-top: 2mm;
    position: relative;
    z-index: 2;
  }

  .prose-intro {
    font-size: 11px;
    line-height: 1.5;
    color: #4a3821;
    margin-bottom: 4mm;
    text-align: justify;
  }

  /* ========================================================================= */
  /* TRANG BÌA (COVER PAGE) */
  /* ========================================================================= */
  .page-cover {
    background: #140d04 !important;
    color: #fbf5e5 !important;
  }

  .cover-border {
    border-color: #d4af37 !important;
  }

  .cover-frame {
    background: radial-gradient(circle at center, #261807 0%, #120c03 100%) !important;
    border-color: #d4af37 !important;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 12mm 8mm !important;
  }

  .cover-dynasty-seal {
    width: 38px;
    height: 38px;
    border: 2px solid #e63946;
    color: #e63946;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 900;
    line-height: 1;
    border-radius: 4px;
    margin-bottom: 5mm;
  }

  .cover-top-emblem {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4mm;
  }

  .emblem-lines-left,
  .emblem-lines-right {
    width: 30px;
    height: 1px;
    background: #d4af37;
  }

  .cover-sub-badge {
    font-size: 9px;
    letter-spacing: 2px;
    color: #d4af37;
    font-weight: 700;
  }

  .cover-main-title {
    margin: 2mm 0 3mm;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .title-line-1 {
    font-size: 26px;
    font-weight: 800;
    color: #fff2b2;
    letter-spacing: 3px;
  }

  .title-line-2 {
    font-size: 32px;
    font-weight: 900;
    color: #d4af37;
    letter-spacing: 6px;
  }

  .cover-subtitle {
    font-size: 10px;
    letter-spacing: 1.5px;
    color: #d8c195;
    max-width: 480px;
    margin-bottom: 6mm;
  }

  .cover-royal-crest {
    width: 80px;
    height: 80px;
    margin-bottom: 6mm;
  }

  .crest-svg {
    width: 100%;
    height: 100%;
  }

  .cover-destiny-box {
    width: 90%;
    background: rgba(43, 31, 12, 0.65);
    border: 1px solid #d4af37;
    padding: 4mm 6mm;
    border-radius: 6px;
    margin-bottom: 6mm;
  }

  .destiny-row {
    font-size: 12px;
    margin-bottom: 3mm;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .destiny-label {
    color: #d4af37;
    font-size: 10px;
    letter-spacing: 1px;
    font-weight: 700;
  }

  .highlight-name {
    font-size: 16px;
    font-weight: 800;
    color: #fff2b2;
  }

  .destiny-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4px 12px;
    text-align: left;
  }

  .destiny-item {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    border-bottom: 1px dashed rgba(212, 175, 55, 0.2);
    padding: 2px 0;
  }

  .item-label {
    color: #b09c7a;
  }

  .item-val {
    color: #f6e6b8;
    font-weight: 600;
  }

  .cover-footer-meta {
    margin-top: auto;
  }

  .stamp-code {
    font-size: 10px;
    font-weight: 700;
    color: #d4af37;
    letter-spacing: 1px;
  }

  .stamp-note {
    font-size: 8px;
    color: #8c7a60;
    margin-top: 2px;
  }

  /* ========================================================================= */
  /* BẢNG TỨ TRỤ (FOUR PILLARS TABLE) */
  /* ========================================================================= */
  .four-pillars-board {
    border: 1px solid #d4af37;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 4mm;
    font-size: 10px;
  }

  .pillars-table-header {
    display: grid;
    grid-template-columns: 100px repeat(4, 1fr);
    background: #2b1f0c;
    color: #f6e6b8;
    font-weight: 700;
    text-align: center;
    padding: 4px 0;
  }

  .pillar-row {
    display: grid;
    grid-template-columns: 100px repeat(4, 1fr);
    border-top: 1px solid #ebdcc5;
    text-align: center;
    align-items: center;
  }

  .row-label {
    background: #f3ede2;
    font-weight: 700;
    color: #634b2f;
    padding: 4px 6px;
    text-align: left;
    font-size: 9px;
  }

  .row-cell {
    padding: 4px 4px;
  }

  .stem-branch-cell {
    font-size: 13px;
    font-weight: 800;
    color: #8b2500;
  }

  .highlight-cell {
    background: rgba(212, 175, 55, 0.12);
  }

  .elem-badge {
    background: #f0eae1;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 9px;
    font-weight: 600;
  }

  .tengod-badge {
    color: #8b2500;
    font-weight: 700;
  }

  .hidden-stems-cell {
    font-size: 8.5px;
    color: #555;
  }

  .life-stage-badge {
    font-weight: 700;
    color: #1a535c;
  }

  .nayin-cell {
    font-size: 8.5px;
    font-weight: 600;
    color: #4a3821;
  }

  /* Tứ Phụ Cung */
  .extra-pillars-card {
    background: #f9f5ed;
    border: 1px solid #e1d3bc;
    border-radius: 4px;
    padding: 3mm 4mm;
  }

  .card-subtitle {
    font-size: 11px;
    font-weight: 700;
    color: #8b2500;
    margin: 0 0 2mm;
    letter-spacing: 0.5px;
  }

  .extra-pillars-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    text-align: center;
  }

  .extra-item {
    background: #fff;
    border: 1px solid #e8dfcf;
    border-radius: 3px;
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .ext-name {
    font-size: 9px;
    font-weight: 700;
    color: #8b2500;
  }

  .ext-val {
    font-size: 10px;
    font-weight: 700;
    color: #2b1f0c;
  }

  .ext-desc {
    font-size: 7.5px;
    color: #777;
  }

  /* ========================================================================= */
  /* TRANG 3: NGŨ HÀNH & DỤNG THẦN */
  /* ========================================================================= */
  .daymaster-summary-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #2b1f0c;
    color: #f6e6b8;
    border-radius: 4px;
    padding: 3mm 5mm;
    margin-bottom: 4mm;
  }

  .dm-core {
    text-align: center;
    flex-shrink: 0;
  }

  .dm-title {
    font-size: 8.5px;
    color: #d4af37;
    font-weight: 700;
    letter-spacing: 1px;
  }

  .dm-highlight {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-top: 2px;
  }

  .dm-can {
    font-size: 22px;
    font-weight: 900;
    color: #fff2b2;
  }

  .dm-elem {
    font-size: 14px;
    font-weight: 700;
    color: #d4af37;
  }

  .dm-polarity {
    font-size: 10px;
    color: #c9b38c;
  }

  .dm-divider {
    width: 1px;
    height: 40px;
    background: #4a3821;
  }

  .eval-badge {
    display: inline-block;
    background: #8b2500;
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 3px;
    margin-bottom: 2px;
  }

  .eval-detail {
    font-size: 9.5px;
    line-height: 1.4;
    color: #e8dcc4;
    margin: 0;
  }

  /* Elements Chart */
  .five-elements-section {
    background: #f9f5ed;
    border: 1px solid #e1d3bc;
    border-radius: 4px;
    padding: 3mm 4mm;
    margin-bottom: 4mm;
  }

  .elements-bar-chart {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin: 2mm 0;
  }

  .bar-group {
    display: grid;
    grid-template-columns: 80px 1fr;
    align-items: center;
    gap: 8px;
    font-size: 9px;
    font-weight: 600;
  }

  .bar-container {
    height: 10px;
    background: #e5dfd3;
    border-radius: 5px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 5px;
  }
  .bar-metal {
    background: #b0c4de;
  }
  .bar-wood {
    background: #2e8b57;
  }
  .bar-water {
    background: #1e90ff;
  }
  .bar-fire {
    background: #e63946;
  }
  .bar-earth {
    background: #cd853f;
  }

  .chart-summary {
    font-size: 9.5px;
    line-height: 1.4;
    color: #555;
    margin: 2mm 0 0;
  }

  /* Useful Gods Grid */
  .useful-gods-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 3mm;
  }

  .god-card {
    background: #fff;
    border: 1px solid #e1d3bc;
    border-radius: 4px;
    padding: 3mm 4mm;
  }

  .god-yong {
    border-color: #d4af37;
    background: #fffdf5;
  }

  .god-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 2px;
  }

  .god-badge {
    background: #d4af37;
    color: #1a1205;
    font-size: 8px;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 2px;
  }

  .badge-warning {
    background: #8b2500;
    color: #fff;
  }
  .badge-info {
    background: #1a535c;
    color: #fff;
  }

  .god-name {
    font-size: 11px;
    font-weight: 800;
    color: #2b1f0c;
  }

  .god-role {
    font-size: 9px;
    font-weight: 700;
    color: #8b2500;
    margin-bottom: 2px;
  }

  .god-desc {
    font-size: 9px;
    line-height: 1.4;
    color: #444;
    margin: 0;
  }

  /* ========================================================================= */
  /* TRANG 4 -> 7: TỪNG TRỤ A4 */
  /* ========================================================================= */
  .pillar-focus-card {
    background: #2b1f0c;
    color: #f6e6b8;
    border-radius: 4px;
    padding: 4mm 6mm;
    margin-bottom: 4mm;
  }

  .day-pillar-highlight {
    border: 2px solid #d4af37;
  }

  .focus-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2mm;
  }

  .pillar-label {
    font-size: 11px;
    font-weight: 700;
    color: #d4af37;
  }

  .pillar-tag {
    background: rgba(212, 175, 55, 0.2);
    font-size: 9px;
    padding: 1px 6px;
    border-radius: 3px;
    color: #fff2b2;
  }

  .focus-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .can-chi-huge {
    font-size: 24px;
    font-weight: 900;
    color: #fff2b2;
    letter-spacing: 2px;
  }

  .focus-badges {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .focus-badges .badge {
    background: #1a1205;
    border: 1px solid #4a3821;
    font-size: 8.5px;
    color: #e5cf96;
    padding: 2px 6px;
    border-radius: 3px;
  }

  .gold-badge {
    border-color: #d4af37 !important;
    color: #fff2b2 !important;
  }

  .reading-body {
    font-size: 11px;
    line-height: 1.6;
    color: #332616;
  }

  .reading-sub {
    font-size: 11px;
    font-weight: 700;
    color: #8b2500;
    margin: 3mm 0 1.5mm;
  }

  .reading-text {
    margin: 0 0 3mm;
    text-align: justify;
  }

  .quote-box {
    margin-top: 4mm;
    background: #fbf8f0;
    border-left: 3px solid #d4af37;
    padding: 3mm 4mm;
    font-style: italic;
    color: #5a4427;
    position: relative;
  }

  .quote-symbol {
    font-size: 20px;
    color: #d4af37;
    line-height: 0;
    vertical-align: -4px;
    margin-right: 4px;
  }

  .highlight-advice-card {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: #fbf7ee;
    border: 1px solid #ebd8b6;
    border-radius: 4px;
    padding: 3mm 4mm;
    margin-top: 3mm;
    font-size: 10px;
  }

  .royal-seal-card {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fdf5ea;
    border: 1px solid #ecc995;
    border-radius: 4px;
    padding: 3mm 4mm;
    margin-top: 3mm;
    font-size: 10px;
  }

  .seal-mark {
    width: 30px;
    height: 30px;
    border: 2px solid #8b2500;
    color: #8b2500;
    font-size: 14px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    flex-shrink: 0;
  }

  /* ========================================================================= */
  /* TRANG 8 & 9: THẬP THẦN */
  /* ========================================================================= */
  .ten-gods-block,
  .ten-gods-block-3 {
    display: flex;
    flex-direction: column;
    gap: 4mm;
  }

  .god-category-card {
    background: #fffdf9;
    border: 1px solid #e1d3bc;
    border-radius: 4px;
    padding: 4mm 5mm;
  }

  .mini-card {
    padding: 3mm 4mm;
  }

  .cat-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 2mm;
  }

  .cat-icon {
    font-size: 18px;
  }

  .cat-title {
    font-size: 12px;
    font-weight: 800;
    color: #8b2500;
    margin: 0;
  }

  .cat-eval {
    font-size: 10.5px;
    line-height: 1.5;
    color: #3a2b19;
    margin: 0 0 2mm;
    text-align: justify;
  }

  .cat-guidance {
    font-size: 9.5px;
    background: #fbf7ee;
    padding: 2mm 3mm;
    border-radius: 3px;
    border-left: 2px solid #d4af37;
    color: #4a3821;
  }

  .prose-footnote {
    margin-top: auto;
    font-size: 9.5px;
    background: #f9f5ed;
    border: 1px solid #ebdcc5;
    padding: 2.5mm 4mm;
    border-radius: 3px;
    color: #555;
  }

  /* ========================================================================= */
  /* TRANG 10: THẦN SÁT */
  /* ========================================================================= */
  .shensha-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 3mm;
    margin-bottom: 4mm;
  }

  .shensha-card {
    background: #fff;
    border: 1px solid #e1d3bc;
    border-radius: 4px;
    padding: 3mm 4mm;
  }

  .is-auspicious {
    border-left: 3px solid #2e8b57;
  }
  .is-inauspicious {
    border-left: 3px solid #e63946;
  }

  .ss-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
  }

  .ss-name {
    font-size: 11px;
    font-weight: 800;
    color: #2b1f0c;
  }

  .ss-badge {
    font-size: 8px;
    padding: 1px 4px;
    border-radius: 2px;
    font-weight: 700;
  }

  .badge-good {
    background: #e8f5e9;
    color: #2e7d32;
  }
  .badge-danger {
    background: #ffebee;
    color: #c62828;
  }

  .ss-desc {
    font-size: 9px;
    line-height: 1.4;
    color: #555;
    margin: 0;
  }

  .shensha-remedy-note {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: #fbf7ee;
    border: 1px solid #ebd8b6;
    border-radius: 4px;
    padding: 3mm 4mm;
    font-size: 9.5px;
    line-height: 1.4;
    margin-top: auto;
  }

  /* ========================================================================= */
  /* TRANG 11 & 12: ĐẠI VẬN */
  /* ========================================================================= */
  .decadals-list {
    display: flex;
    flex-direction: column;
    gap: 3mm;
  }

  .decadal-item-card {
    display: grid;
    grid-template-columns: 80px 1fr;
    background: #fff;
    border: 1px solid #e1d3bc;
    border-radius: 4px;
    overflow: hidden;
  }

  .dec-side {
    background: #2b1f0c;
    color: #f6e6b8;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3mm;
  }

  .dec-step {
    font-size: 9px;
    font-weight: 700;
    color: #d4af37;
  }

  .dec-age {
    font-size: 11px;
    font-weight: 800;
  }

  .dec-main {
    padding: 3mm 4mm;
  }

  .dec-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 2px;
  }

  .dec-can-chi {
    font-size: 13px;
    font-weight: 900;
    color: #8b2500;
  }

  .dec-meta {
    font-size: 9.5px;
    font-weight: 600;
    color: #4a3821;
  }

  .dec-stage {
    font-size: 8px;
    background: #f0eae1;
    color: #1a535c;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 2px;
  }

  .dec-summary {
    font-size: 9.5px;
    line-height: 1.4;
    color: #555;
    margin: 0;
  }

  /* ========================================================================= */
  /* TRANG 13: 2026 BÍNH NGỌ */
  /* ========================================================================= */
  .year-2026-hero-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #2b1f0c;
    color: #f6e6b8;
    border: 1px solid #d4af37;
    border-radius: 4px;
    padding: 3mm 5mm;
    margin-bottom: 3.5mm;
  }

  .hero-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .hero-year-title {
    font-size: 18px;
    font-weight: 900;
    color: #fff2b2;
    letter-spacing: 1px;
  }

  .hero-year-nayin {
    font-size: 9.5px;
    color: #d4af37;
  }

  .hero-right {
    text-align: right;
  }

  .year-rating-badge {
    background: #e63946;
    color: #fff;
    font-size: 9px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 3px;
    display: inline-block;
  }

  .year-tengod {
    font-size: 9.5px;
    color: #e8dcc4;
    margin-top: 2px;
  }

  .year-interactions-box {
    background: #f9f5ed;
    border: 1px solid #e1d3bc;
    border-radius: 4px;
    padding: 3mm 4mm;
    margin-bottom: 3.5mm;
  }

  .interaction-lead {
    font-size: 10px;
    line-height: 1.4;
    color: #332616;
    margin: 0 0 2.5mm;
  }

  .branch-interactions-grid {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .branch-int-item {
    font-size: 9px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .bi-type {
    font-size: 8px;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .bi-desc {
    color: #555;
  }

  .four-pillars-forecast-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 3mm;
  }

  .forecast-pillar-card {
    background: #fff;
    border: 1px solid #e1d3bc;
    border-radius: 4px;
    padding: 3mm 4mm;
  }

  .f-head {
    font-size: 10px;
    font-weight: 800;
    color: #8b2500;
    margin-bottom: 2px;
  }

  .f-text {
    font-size: 9px;
    line-height: 1.4;
    color: #444;
    margin: 0;
    text-align: justify;
  }

  /* ========================================================================= */
  /* TRANG 14 & 15: 12 THÁNG 2026 */
  /* ========================================================================= */
  .months-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 3.5mm;
  }

  .month-card {
    background: #fff;
    border: 1px solid #e1d3bc;
    border-radius: 4px;
    padding: 3mm 4mm;
    display: flex;
    flex-direction: column;
  }

  .month-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px dashed #ebdcc5;
    padding-bottom: 2px;
    margin-bottom: 2px;
  }

  .m-title {
    font-size: 11px;
    font-weight: 800;
    color: #8b2500;
  }

  .m-stars {
    color: #d4af37;
    font-size: 11px;
    letter-spacing: 1px;
  }

  .m-headline {
    font-size: 9.5px;
    font-weight: 700;
    color: #2b1f0c;
    margin-bottom: 2px;
  }

  .m-guidance {
    font-size: 8.5px;
    line-height: 1.35;
    color: #555;
    margin: 0;
  }

  /* ========================================================================= */
  /* TRANG 16: PHONG THỦY CẢI VẬN */
  /* ========================================================================= */
  .remedies-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 3.5mm;
    margin-bottom: 4mm;
  }

  .remedy-card {
    background: #fff;
    border: 1px solid #e1d3bc;
    border-radius: 4px;
    padding: 3.5mm 4mm;
  }

  .rc-title {
    font-size: 10px;
    font-weight: 800;
    color: #8b2500;
    margin-bottom: 2mm;
  }

  .rc-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    margin-bottom: 2mm;
  }

  .r-badge {
    background: #fbf7ee;
    border: 1px solid #e8decb;
    color: #2b1f0c;
    font-size: 8.5px;
    font-weight: 600;
    padding: 1px 5px;
    border-radius: 3px;
  }

  .rc-desc {
    font-size: 8.5px;
    line-height: 1.35;
    color: #666;
    margin: 0;
  }

  .mindset-remedy-card {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: #2b1f0c;
    color: #f6e6b8;
    border: 1px solid #d4af37;
    border-radius: 4px;
    padding: 4mm 5mm;
    margin-top: auto;
  }

  .mindset-title {
    font-size: 10.5px;
    font-weight: 800;
    color: #fff2b2;
    margin-bottom: 2px;
  }

  .mindset-text {
    font-size: 9.5px;
    line-height: 1.45;
    color: #e8dcc4;
    margin: 0;
    text-align: justify;
  }

  /* ========================================================================= */
  /* TRANG 17: SẮC CHỈ KHÂM THIÊN GIÁM */
  /* ========================================================================= */
  .imperial-decree-box {
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: space-between;
  }

  .decree-header {
    text-align: center;
    margin-bottom: 4mm;
  }

  .decree-title {
    font-size: 14px;
    font-weight: 900;
    color: #8b2500;
    letter-spacing: 1.5px;
  }

  .decree-sub {
    font-size: 9px;
    letter-spacing: 1px;
    color: #d4af37;
    font-weight: 700;
    margin-top: 2px;
  }

  .decree-body {
    background: #fdfbf7;
    border: 1px solid #e8decb;
    border-radius: 4px;
    padding: 5mm 6mm;
    font-size: 11px;
    line-height: 1.7;
    color: #2b1f0c;
    text-align: justify;
  }

  .decree-body p {
    margin: 0 0 3mm;
  }
  .decree-body p:last-child {
    margin: 0;
  }

  .decree-signatures {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8mm;
    text-align: center;
    margin-top: 6mm;
    align-items: center;
  }

  .sig-col {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .sig-role {
    font-size: 9.5px;
    font-weight: 800;
    color: #8b2500;
    letter-spacing: 1px;
    margin-bottom: 2mm;
  }

  .seal-visual {
    margin: 2mm 0;
  }

  .royal-red-seal {
    width: 60px;
    height: 60px;
    border: 2px solid #c92a2a;
    color: #c92a2a;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    align-items: center;
    justify-items: center;
    font-size: 10px;
    font-weight: 900;
    box-shadow: 0 0 4px rgba(201, 42, 42, 0.4);
  }

  .sig-name {
    font-size: 10px;
    font-weight: 700;
    color: #2b1f0c;
  }

  .qr-code-box {
    width: 60px;
    height: 60px;
    border: 1px solid #d4af37;
    padding: 2px;
    background: #fff;
    margin: 2mm 0;
  }

  .qr-svg {
    width: 100%;
    height: 100%;
  }

  .qr-label {
    font-size: 8px;
    color: #777;
  }

  .qr-sec-code {
    font-size: 9px;
    font-weight: 800;
    color: #8b2500;
    margin-top: 2px;
  }

  /* ========================================================================= */
  /* PRINT STYLESHEET (NO BLANK PAGES, PERFECT A4 VECTOR) */
  /* ========================================================================= */
  @media print {
    :global(body) {
      overflow: visible !important;
      background: #fff !important;
    }

    :global(body > *:not(.dossier-modal-overlay)) {
      display: none !important;
    }

    .dossier-modal-overlay {
      position: static !important;
      width: 100% !important;
      height: auto !important;
      background: #fff !important;
      display: block !important;
    }

    .dossier-navbar,
    .reading-progress-track {
      display: none !important;
    }

    .dossier-stage {
      overflow: visible !important;
      background: transparent !important;
    }

    .dossier-document-scroll {
      overflow: visible !important;
      padding: 0 !important;
      gap: 0 !important;
      display: block !important;
    }

    .dossier-page {
      display: block !important;
      width: 210mm !important;
      height: 297mm !important;
      min-height: 297mm !important;
      max-height: 297mm !important;
      margin: 0 !important;
      padding: 10mm !important;
      box-shadow: none !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: always !important;
      break-after: page !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .dossier-page:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }
  }

  /* ========================================================================= */
  /* RESPONSIVE SCALING */
  /* ========================================================================= */
  @media (max-width: 900px) {
    .dossier-page {
      width: 100%;
      height: auto;
      min-height: auto;
      padding: 5mm;
    }

    .four-pillars-board,
    .pillars-table-header,
    .pillar-row {
      grid-template-columns: 80px repeat(4, 1fr);
    }
  }
</style>
