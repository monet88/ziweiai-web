<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { Download, Share2, X } from 'lucide-svelte';
  import type { ChartSnapshot } from '@ziweiai/contracts';
  import { buildDossierData, type DossierInterpretationPayload } from '$lib/features/dossier/dossier-interpretations';
  import { formatRoyalSecurityCode } from '$lib/features/dossier/dossier-pdf-exporter';
  import {
    exportPosterToPng,
    triggerDirectDownload,
    sharePosterImage,
    formatPosterFileName,
  } from './royal-poster-exporter';
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

  let posterElement = $state<HTMLDivElement | null>(null);
  let isExporting = $state(false);

  // Bản đồ vị trí 12 cung Tử Vi 4x4 (1-indexed theo địa chi)
  const BRANCH_GRID_STYLE: Record<string, string> = {
    siEarthly: 'grid-row: 1; grid-column: 1;',
    wuEarthly: 'grid-row: 1; grid-column: 2;',
    weiEarthly: 'grid-row: 1; grid-column: 3;',
    shenEarthly: 'grid-row: 1; grid-column: 4;',
    youEarthly: 'grid-row: 2; grid-column: 4;',
    xuEarthly: 'grid-row: 3; grid-column: 4;',
    haiEarthly: 'grid-row: 4; grid-column: 4;',
    ziEarthly: 'grid-row: 4; grid-column: 3;',
    chouEarthly: 'grid-row: 4; grid-column: 2;',
    yinEarthly: 'grid-row: 4; grid-column: 1;',
    maoEarthly: 'grid-row: 3; grid-column: 1;',
    chenEarthly: 'grid-row: 2; grid-column: 1;',
  };

  // Tra cứu cung theo index 0-11
  const palaceByIndex = $derived(
    Object.fromEntries(data.palaces.map((p) => [p.index, p])) as Record<number, typeof data.palaces[number] | undefined>,
  );

  // Khớp branch key sang index
  const BRANCH_KEY_TO_INDEX: Record<string, number> = {
    ziEarthly: 0,
    chouEarthly: 1,
    yinEarthly: 2,
    maoEarthly: 3,
    chenEarthly: 4,
    siEarthly: 5,
    wuEarthly: 6,
    weiEarthly: 7,
    shenEarthly: 8,
    youEarthly: 9,
    xuEarthly: 10,
    haiEarthly: 11,
  };

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
      toast.show('Đang khởi tạo ảnh Poster Hoàng Gia độ phân giải cao...', 'info');
      const blob = await exportPosterToPng(posterElement, { scale: 2 });
      const birthYear = snapshot.birth?.resolvedDateTime?.date?.year ?? null;
      const fileName = formatPosterFileName(data.userName, birthYear);
      triggerDirectDownload(blob, fileName);
      toast.show('Đã tải thành công Poster Hoàng Gia!', 'success');
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
      const blob = await exportPosterToPng(posterElement, { scale: 2 });
      const birthYear = snapshot.birth?.resolvedDateTime?.date?.year ?? null;
      const fileName = formatPosterFileName(data.userName, birthYear);
      const shared = await sharePosterImage(
        blob,
        fileName,
        `Lá Số Tử Vi Hoàng Gia — ${data.userName}`,
        `Bản đồ mệnh lý Tử Vi Đẩu Số hoàng gia của ${data.userName} trên ViOS Tử Vi Toàn Tập.`,
      );
      if (!shared) {
        // Fallback: download file
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

<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="poster-modal-title">
  <!-- Toolbar điều khiển -->
  <header class="poster-modal-toolbar">
    <div class="toolbar-left">
      <span class="toolbar-icon">👑</span>
      <h2 id="poster-modal-title" class="toolbar-title">Xuất Ảnh Lá Số Hoàng Gia</h2>
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

  <!-- Vùng xem trước Poster (Cuộn trên màn hình nhỏ) -->
  <main class="poster-scroll-area">
    <div class="poster-wrapper">
      <div class="royal-poster-canvas" bind:this={posterElement}>
        <!-- Khung viền thếp vàng hoàng gia -->
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
            <h1 class="poster-title">BẢN ĐỒ MỆNH LÝ TỬ VI HOÀNG GIA</h1>
            <p class="poster-subtitle">ViOS Celestial Astrological Codex • Quốc Triều Chiêm Tinh</p>
          </header>

          <!-- Profile Summary Grid -->
          <section class="poster-profile-section">
            <div class="profile-card">
              <div class="profile-row-main">
                <span class="profile-name">{data.userName}</span>
                <span class="profile-gender-tag">{data.destinyYinYangText} {data.genderText}</span>
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
                  <span class="meta-label">Bản Mệnh:</span>
                  <span class="meta-val highlight-amber">{data.destinyElementText}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Cục Số:</span>
                  <span class="meta-val highlight-amber">{data.fiveElementsClassText}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Bát Tự 4 Trụ:</span>
                  <span class="meta-val">{data.baziYear} • {data.baziMonth} • {data.baziDay} • {data.baziHour}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Thân Cư:</span>
                  <span class="meta-val highlight-emerald">{data.bodyPalaceText}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Bàn 12 Cung Hoàng Gia 4x4 -->
          <section class="poster-board-section">
            <div class="palace-grid-4x4">
              {#each Object.entries(BRANCH_GRID_STYLE) as [branchKey, gridStyle] (branchKey)}
                {@const pIdx = BRANCH_KEY_TO_INDEX[branchKey]}
                {@const palace = palaceByIndex[pIdx]}
                <div class="palace-tile" style={gridStyle}>
                  {#if palace}
                    <div class="tile-header">
                      <div class="tile-name-group">
                        <strong class="tile-palace-name">{palace.name}</strong>
                        {#if palace.isBody}
                          <span class="tile-body-badge">Thân</span>
                        {/if}
                      </div>
                      <span class="tile-branch-can">{palace.heavenlyStem} {palace.earthlyBranch}</span>
                    </div>

                    <!-- Chính Tinh -->
                    <div class="tile-major-stars">
                      {#if palace.majorStars.length > 0}
                        {#each palace.majorStars as star (star.name)}
                          <div class="major-star-item">
                            <span class="star-name">{star.name}</span>
                            {#if star.brightness}
                              <span class="star-bright">({star.brightness})</span>
                            {/if}
                            {#if star.mutagen}
                              <span class="star-mutagen">[{star.mutagen}]</span>
                            {/if}
                          </div>
                        {/each}
                      {:else}
                        <span class="no-major">Vô Chính Diệu</span>
                      {/if}
                    </div>

                    <!-- Phụ tinh tóm tắt -->
                    <div class="tile-minor-stars">
                      {#if palace.goodStars.length > 0}
                        <div class="minor-group good-group">
                          {palace.goodStars.slice(0, 5).join(' · ')}
                        </div>
                      {/if}
                      {#if palace.badStars.length > 0}
                        <div class="minor-group bad-group">
                          {palace.badStars.slice(0, 4).join(' · ')}
                        </div>
                      {/if}
                    </div>

                    <!-- Footer ô: Vận hạn -->
                    <div class="tile-footer">
                      <span class="decadal-tag">ĐV: {palace.index * 10 + 2}</span>
                      <span class="branch-index">{palace.earthlyBranch}</span>
                    </div>
                  {/if}
                </div>
              {/each}

              <!-- Trung Cung Hoàng Triều (Hàng 2-3, Cột 2-3) -->
              <div class="center-hall">
                <div class="hall-inner">
                  <div class="hall-crest">✦ 👑 ✦</div>
                  <h3 class="hall-title">KHÂM THIÊN GIÁM</h3>
                  <p class="hall-subtitle">MỆNH CHỦ: <strong>{data.masterStarText}</strong> • THÂN CHỦ: <strong>{data.bodyMasterStarText}</strong></p>

                  <!-- Con dấu Triện Hoàng Gia (Imperial Red Seal) -->
                  <div class="imperial-seal-box">
                    <div class="seal-ring">
                      <span class="seal-char">TỬ</span>
                      <span class="seal-char">VI</span>
                      <span class="seal-char">TOÀN</span>
                      <span class="seal-char">TẬP</span>
                    </div>
                  </div>

                  <p class="hall-motto">« Minh Triết Huyền Cơ • Thuận Thiên Ứng Vận »</p>
                </div>
              </div>
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
    margin: auto;
  }

  /* Canvas Layout */
  .royal-poster-canvas {
    width: 780px;
    background: radial-gradient(circle at 50% 30%, #1f180e 0%, #0c0a09 100%);
    color: #f3f4f6;
    padding: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(212, 175, 55, 0.15);
    border-radius: 8px;
    box-sizing: border-box;
    font-family: var(--font-sans, system-ui, sans-serif);
  }

  .poster-gold-border {
    position: relative;
    border: 2px solid #d4af37;
    outline: 1px solid rgba(212, 175, 55, 0.4);
    outline-offset: 4px;
    border-radius: 6px;
    padding: 20px;
    background: rgba(12, 10, 9, 0.7);
  }

  .corner-ornament {
    position: absolute;
    color: #ffd700;
    font-size: 1rem;
    line-height: 1;
    text-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
  }
  .top-left { top: 6px; left: 8px; }
  .top-right { top: 6px; right: 8px; }
  .bottom-left { bottom: 6px; left: 8px; }
  .bottom-right { bottom: 6px; right: 8px; }

  /* Header */
  .poster-header {
    text-align: center;
    margin-bottom: 16px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.25);
    padding-bottom: 12px;
  }

  .imperial-crest {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .crest-crown {
    font-size: 1rem;
  }

  .crest-label {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: #ffd700;
  }

  .poster-title {
    margin: 4px 0 2px;
    font-size: 1.45rem;
    font-weight: 800;
    color: #fbbf24;
    letter-spacing: 0.05em;
    font-family: var(--font-serif, serif);
    text-shadow: 0 0 12px rgba(212, 175, 55, 0.4);
  }

  .poster-subtitle {
    margin: 0;
    font-size: 0.75rem;
    color: rgba(243, 244, 246, 0.6);
    letter-spacing: 0.08em;
  }

  /* Profile Card */
  .poster-profile-section {
    margin-bottom: 14px;
  }

  .profile-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 6px;
    padding: 10px 14px;
  }

  .profile-row-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
    padding-bottom: 6px;
  }

  .profile-name {
    font-size: 1.15rem;
    font-weight: 700;
    color: #ffd700;
  }

  .profile-gender-tag {
    font-size: 0.8rem;
    font-weight: 600;
    padding: 2px 8px;
    background: rgba(212, 175, 55, 0.15);
    color: #fbbf24;
    border-radius: 4px;
  }

  .profile-meta-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px 12px;
    font-size: 0.78rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .meta-label {
    color: #9ca3af;
  }

  .meta-val {
    color: #e5e7eb;
    font-weight: 500;
  }

  .highlight-amber {
    color: #f59e0b;
    font-weight: 600;
  }

  .highlight-emerald {
    color: #10b981;
    font-weight: 600;
  }

  /* 4x4 Grid Board */
  .poster-board-section {
    margin-bottom: 14px;
  }

  .palace-grid-4x4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(4, 130px);
    gap: 4px;
    background: rgba(212, 175, 55, 0.15);
    padding: 4px;
    border-radius: 6px;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  .palace-tile {
    background: rgba(18, 14, 10, 0.95);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 4px;
    padding: 6px 8px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }

  .tile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 3px;
  }

  .tile-name-group {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .tile-palace-name {
    font-size: 0.82rem;
    font-weight: 700;
    color: #ffd700;
  }

  .tile-body-badge {
    font-size: 0.65rem;
    background: #059669;
    color: #ffffff;
    padding: 0 4px;
    border-radius: 3px;
    font-weight: 600;
  }

  .tile-branch-can {
    font-size: 0.7rem;
    color: #9ca3af;
  }

  .tile-major-stars {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 4px 0;
  }

  .major-star-item {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 0.74rem;
    font-weight: 600;
    color: #fbbf24;
  }

  .star-bright {
    font-size: 0.65rem;
    color: #f87171;
  }

  .star-mutagen {
    font-size: 0.65rem;
    color: #34d399;
    font-weight: 700;
  }

  .no-major {
    font-size: 0.7rem;
    color: #6b7280;
    font-style: italic;
  }

  .tile-minor-stars {
    font-size: 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 1px;
    overflow: hidden;
  }

  .good-group {
    color: #93c5fd;
  }

  .bad-group {
    color: #fca5a5;
  }

  .tile-footer {
    display: flex;
    justify-content: space-between;
    font-size: 0.65rem;
    color: #9ca3af;
    border-top: 1px dashed rgba(255, 255, 255, 0.08);
    padding-top: 2px;
  }

  .decadal-tag {
    color: #d97706;
    font-weight: 600;
  }

  /* Center Hall (Hàng 2-3, Cột 2-3) */
  .center-hall {
    grid-row: 2 / 4;
    grid-column: 2 / 4;
    background: radial-gradient(circle, #22190f 0%, #120e09 100%);
    border: 1px solid rgba(212, 175, 55, 0.4);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    text-align: center;
  }

  .hall-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .hall-crest {
    color: #ffd700;
    font-size: 0.85rem;
    letter-spacing: 0.2em;
  }

  .hall-title {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 800;
    color: #ffd700;
    letter-spacing: 0.1em;
    font-family: var(--font-serif, serif);
  }

  .hall-subtitle {
    margin: 0;
    font-size: 0.72rem;
    color: #e5e7eb;
  }

  /* Imperial Red Seal */
  .imperial-seal-box {
    margin: 6px 0;
    width: 60px;
    height: 60px;
    border: 2px solid #b91c1c;
    background: rgba(185, 28, 28, 0.15);
    box-shadow: inset 0 0 10px rgba(185, 28, 28, 0.3), 0 0 8px rgba(185, 28, 28, 0.3);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .seal-ring {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    font-weight: 900;
    font-size: 0.72rem;
    color: #ef4444;
    text-shadow: 0 0 4px rgba(239, 68, 68, 0.6);
  }

  .hall-motto {
    margin: 0;
    font-size: 0.68rem;
    color: rgba(212, 175, 55, 0.8);
    font-style: italic;
  }

  /* Footer */
  .poster-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.72rem;
    color: #9ca3af;
    border-top: 1px solid rgba(212, 175, 55, 0.2);
    padding-top: 10px;
  }

  .footer-left {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .footer-center {
    color: rgba(212, 175, 55, 0.75);
  }

  .footer-right {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .footer-code {
    color: #fbbf24;
    letter-spacing: 0.05em;
  }

  @media (max-width: 640px) {
    .poster-modal-toolbar {
      padding: 10px 14px;
    }
    .toolbar-title {
      font-size: 0.95rem;
    }
    .btn-text {
      display: none;
    }
    .action-btn {
      padding: 8px 10px;
    }
  }
</style>
