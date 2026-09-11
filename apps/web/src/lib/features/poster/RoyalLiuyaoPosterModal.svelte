<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { Download, Share2, X } from 'lucide-svelte';
  import type { ChartDetailResponse } from '@ziweiai/contracts';
  import {
    translateLiuyaoRoleKey,
    translateLiuyaoSixKinKey,
    translateLiuyaoSixSpiritKey,
    translateLiuyaoMethodKey,
    translateBaziKey,
  } from '@ziweiai/contracts';
  import {
    exportPosterToPng,
    triggerDirectDownload,
    sharePosterImage,
    formatDivinationPosterFileName,
  } from './royal-poster-exporter';
  import { toast } from '$lib/stores/toast';

  interface Props {
    snapshot: ChartDetailResponse['snapshot'];
    chartId: string;
    userName?: string;
    onClose: () => void;
  }

  let { snapshot, chartId, userName = 'Đương Số', onClose }: Props = $props();

  const royalSecurityCode = $derived(`VIOS-LIUYAO-${chartId.slice(0, 8).toUpperCase()}`);
  const liuyao = $derived(snapshot.liuyao);

  let posterElement = $state<HTMLDivElement | null>(null);
  let isExporting = $state(false);

  // Sắp xếp hào từ trên xuống dưới (hào 6 -> hào 1) theo quy ước Dịch học
  const baseLines = $derived(
    liuyao ? [...liuyao.baseHexagram.lines].sort((a, b) => b.position - a.position) : [],
  );
  const changedLines = $derived(
    liuyao ? [...liuyao.changedHexagram.lines].sort((a, b) => b.position - a.position) : [],
  );

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
      toast.show('Đang khởi tạo ảnh Poster Lục Hào độ phân giải cao...', 'info');
      const blob = await exportPosterToPng(posterElement, { scale: 2 });
      const hexName = liuyao?.baseHexagram.name ?? 'Que-Dich';
      const fileName = formatDivinationPosterFileName('liuyao', hexName);
      triggerDirectDownload(blob, fileName);
      toast.show('Đã tải thành công Poster Lục Hào Hoàng Gia!', 'success');
    } catch {
      toast.show('Không thể xuất ảnh poster. Vui lòng thử lại!', 'danger');
    } finally {
      isExporting = false;
    }
  }

  async function handleShareNative() {
    if (!posterElement || isExporting) return;
    isExporting = true;
    try {
      toast.show('Đang chuẩn bị ảnh chia sẻ...', 'info');
      const blob = await exportPosterToPng(posterElement, { scale: 2 });
      const hexName = liuyao?.baseHexagram.name ?? 'Quẻ Dịch';
      const fileName = formatDivinationPosterFileName('liuyao', hexName);
      const shared = await sharePosterImage(
        blob,
        fileName,
        `Quẻ Lục Hào: ${hexName} — ViOS`,
        `Đồ hình Quẻ Lục Hào bảo chứng bởi Khâm Thiên Giám (Tử Vi Toàn Tập).`,
      );
      if (shared) {
        toast.show('Đã mở hộp thoại chia sẻ!', 'success');
      } else {
        toast.show('Đã chuyển sang tải ảnh trực tiếp.', 'info');
        triggerDirectDownload(blob, fileName);
      }
    } catch {
      toast.show('Không thể chia sẻ ảnh poster. Vui lòng thử lại!', 'danger');
    } finally {
      isExporting = false;
    }
  }
</script>

<div class="poster-modal-backdrop" role="dialog" aria-modal="true" aria-label="Xem trước Poster Lục Hào">
  <div class="modal-control-bar">
    <div class="control-actions">
      <button
        type="button"
        class="btn-action btn-download"
        onclick={handleDownloadPng}
        disabled={isExporting}
      >
        <Download size={16} />
        <span>{isExporting ? 'Đang xuất ảnh...' : 'Tải Ảnh Poster (2x HD)'}</span>
      </button>

      <button
        type="button"
        class="btn-action btn-share"
        onclick={handleShareNative}
        disabled={isExporting}
      >
        <Share2 size={16} />
        <span>Chia Sẻ Native</span>
      </button>
    </div>

    <button type="button" class="btn-close" onclick={onClose} aria-label="Đóng cửa sổ">
      <X size={20} />
    </button>
  </div>

  <div class="poster-scroll-container">
    <div class="poster-canvas-wrapper" bind:this={posterElement}>
      <div class="royal-corner corner-tl">✦</div>
      <div class="royal-corner corner-tr">✦</div>
      <div class="royal-corner corner-bl">✦</div>
      <div class="royal-corner corner-br">✦</div>

      <!-- Header Hoàng Gia -->
      <header class="poster-header">
        <div class="header-crest">
          <span class="crest-crown">👑</span>
          <span class="crest-label">KHÂM THIÊN GIÁM • THẦN QUẺ BẢO CHỨNG</span>
        </div>
        <h1 class="poster-title">ĐỒ HÌNH QUẺ DỊCH LỤC HÀO HOÀNG GIA</h1>
        <p class="poster-subtitle">KINH DỊCH DIỄN TOÁN • DỤNG THẦN BIẾN HÓA CƠ VI</p>
      </header>

      <!-- Profile Section -->
      {#if snapshot}
        <section class="poster-profile-section">
          <div class="profile-card">
            <div class="profile-row-main">
              <span class="profile-name">Đương Số: {userName}</span>
              {#if liuyao}
                <span class="profile-method-tag">
                  {translateLiuyaoMethodKey(liuyao.method)}
                </span>
              {/if}
            </div>

            <div class="profile-meta-grid">
              <div class="meta-item">
                <span class="meta-label">Mã tra cứu:</span>
                <span class="meta-val highlight-amber">{royalSecurityCode}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Hào động:</span>
                <span class="meta-val highlight-gold">
                  {liuyao?.movingLinePositions.map((p) => `Hào ${p}`).join(', ') || 'Không có'}
                </span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Ngày lập:</span>
                <span class="meta-val">{new Date().toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>
        </section>
      {/if}

      <!-- Hexagram Comparison Section -->
      {#if liuyao}
        <section class="hexagram-section">
          <div class="hexagrams-dual-grid">
            <!-- Quẻ Chủ -->
            <div class="hex-card base-hex">
              <div class="hex-header">
                <div class="hex-symbol">{liuyao.baseHexagram.symbol}</div>
                <div class="hex-title-group">
                  <span class="hex-badge">Quẻ Chủ (Bản Quái)</span>
                  <h2 class="hex-name">{liuyao.baseHexagram.name}</h2>
                </div>
              </div>

              <div class="lines-diagram">
                {#each baseLines as line (line.position)}
                  <div class="line-row" class:is-moving={line.isMoving}>
                    <div class="line-position">Hào {line.position}</div>

                    <!-- Vạch Hào: Dương liền, Âm đứt -->
                    <div class="line-visual">
                      {#if line.value === 'yang'}
                        <div class="yin-yang-bar yang-bar"></div>
                      {:else}
                        <div class="yin-yang-bar yin-bar">
                          <span class="yin-segment"></span>
                          <span class="yin-gap"></span>
                          <span class="yin-segment"></span>
                        </div>
                      {/if}
                      {#if line.isMoving}
                        <span class="moving-indicator">● Động</span>
                      {/if}
                    </div>

                    <div class="line-meta">
                      <span class="six-kin">{translateLiuyaoSixKinKey(line.sixKinKey)}</span>
                      <span class="branch-stem">{translateBaziKey(line.earthlyBranchKey)}</span>
                      {#if line.roleKey !== 'none'}
                        <span class="role-badge role-{line.roleKey}">{translateLiuyaoRoleKey(line.roleKey)}</span>
                      {/if}
                      <span class="spirit-badge">{translateLiuyaoSixSpiritKey(line.sixSpiritKey)}</span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Quẻ Biến -->
            <div class="hex-card changed-hex">
              <div class="hex-header">
                <div class="hex-symbol">{liuyao.changedHexagram.symbol}</div>
                <div class="hex-title-group">
                  <span class="hex-badge changed-badge">Quẻ Biến (Chi Quái)</span>
                  <h2 class="hex-name">{liuyao.changedHexagram.name}</h2>
                </div>
              </div>

              <div class="lines-diagram">
                {#each changedLines as line (line.position)}
                  <div class="line-row">
                    <div class="line-position">Hào {line.position}</div>

                    <!-- Vạch Hào Biến -->
                    <div class="line-visual">
                      {#if line.value === 'yang'}
                        <div class="yin-yang-bar yang-bar changed-bar"></div>
                      {:else}
                        <div class="yin-yang-bar yin-bar changed-bar">
                          <span class="yin-segment"></span>
                          <span class="yin-gap"></span>
                          <span class="yin-segment"></span>
                        </div>
                      {/if}
                    </div>

                    <div class="line-meta">
                      <span class="six-kin">{translateLiuyaoSixKinKey(line.sixKinKey)}</span>
                      <span class="branch-stem">{translateBaziKey(line.earthlyBranchKey)}</span>
                      {#if line.roleKey !== 'none'}
                        <span class="role-badge role-{line.roleKey}">{translateLiuyaoRoleKey(line.roleKey)}</span>
                      {/if}
                      <span class="spirit-badge">{translateLiuyaoSixSpiritKey(line.sixSpiritKey)}</span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </section>
      {/if}

      <!-- Footer & Triện Đỏ Hoàng Cung -->
      <footer class="poster-footer">
        <div class="footer-seal-container">
          <div class="imperial-seal">
            <div class="seal-inner">
              <span class="seal-text-top">LỤC HÀO THẦN QUẺ</span>
              <span class="seal-text-mid">✦ KHÂM THIÊN GIÁM ✦</span>
              <span class="seal-text-bot">TỬ VI TOÀN TẬP</span>
            </div>
          </div>
        </div>

        <div class="footer-meta-block">
          <p class="verification-lead">
            BẢO CHỨNG BỞI HỆ THỐNG THUẬT SỐ HOÀNG GIA VIOS — KHÂM THIÊN GIÁM
          </p>
          <p class="verification-sub">
            MÃ ĐỘC BẢN: <span class="sec-code">{royalSecurityCode}</span> • BẢO MẬT TOÀN VẸN DỮ LIỆU
          </p>
        </div>
      </footer>
    </div>
  </div>
</div>

<style>
  .poster-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.88);
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 16px;
    overflow-y: auto;
  }

  .modal-control-bar {
    width: 100%;
    max-width: 820px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    z-index: 1010;
  }

  .control-actions {
    display: flex;
    gap: 10px;
  }

  .btn-action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    font-size: 0.88rem;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-download {
    background: linear-gradient(135deg, #d4af37, #f59e0b);
    color: #1a1500;
    border: 1px solid #ffd700;
  }

  .btn-download:hover:not(:disabled) {
    background: linear-gradient(135deg, #ffd700, #fbbf24);
    box-shadow: 0 0 14px rgba(212, 175, 55, 0.5);
  }

  .btn-share {
    background: rgba(255, 255, 255, 0.08);
    color: #ffd700;
    border: 1px solid rgba(212, 175, 55, 0.4);
  }

  .btn-share:hover:not(:disabled) {
    background: rgba(212, 175, 55, 0.15);
  }

  .btn-close {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .poster-scroll-container {
    width: 100%;
    display: flex;
    justify-content: center;
    overflow-x: auto;
    padding-bottom: 24px;
  }

  .poster-canvas-wrapper {
    position: relative;
    width: 780px;
    min-width: 780px;
    background: #0d0b08;
    background-image: radial-gradient(circle at 50% 20%, rgba(212, 175, 55, 0.08) 0%, transparent 60%),
      radial-gradient(circle at 80% 80%, rgba(180, 83, 9, 0.06) 0%, transparent 50%);
    border: 2px solid #d4af37;
    box-shadow: 0 0 0 6px #0d0b08, 0 0 0 8px #92400e, 0 20px 50px rgba(0, 0, 0, 0.9);
    padding: 24px;
    color: #f3f4f6;
    border-radius: 4px;
  }

  .royal-corner {
    position: absolute;
    color: #ffd700;
    font-size: 1.1rem;
  }
  .corner-tl { top: 6px; left: 8px; }
  .corner-tr { top: 6px; right: 8px; }
  .corner-bl { bottom: 6px; left: 8px; }
  .corner-br { bottom: 6px; right: 8px; }

  .poster-header {
    text-align: center;
    border-bottom: 1px solid rgba(212, 175, 55, 0.3);
    padding-bottom: 12px;
    margin-bottom: 16px;
  }

  .header-crest {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .crest-crown { font-size: 1rem; }
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
    font-family: var(--font-serif, serif);
    text-shadow: 0 0 12px rgba(212, 175, 55, 0.4);
  }

  .poster-subtitle {
    margin: 0;
    font-size: 0.75rem;
    color: rgba(243, 244, 246, 0.6);
    letter-spacing: 0.08em;
  }

  .profile-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 16px;
  }

  .profile-row-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
    padding-bottom: 6px;
  }

  .profile-name {
    font-size: 1.15rem;
    font-weight: 700;
    color: #ffd700;
  }

  .profile-method-tag {
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

  .meta-label { color: #9ca3af; }
  .meta-val { color: #e5e7eb; font-weight: 500; }
  .highlight-amber { color: #f59e0b; font-weight: 600; }
  .highlight-gold { color: #ffd700; font-weight: 600; }

  /* Hexagram Dual Grid */
  .hexagrams-dual-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .hex-card {
    background: rgba(20, 16, 12, 0.9);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 6px;
    padding: 14px;
  }

  .hex-header {
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
    padding-bottom: 10px;
    margin-bottom: 12px;
  }

  .hex-symbol {
    font-size: 2.2rem;
    color: #ffd700;
    line-height: 1;
  }

  .hex-badge {
    font-size: 0.7rem;
    font-weight: 700;
    color: #f59e0b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .changed-badge {
    color: #38bdf8;
  }

  .hex-name {
    margin: 2px 0 0;
    font-size: 1.15rem;
    font-weight: 800;
    color: #fff;
    font-family: var(--font-serif, serif);
  }

  /* Lines Diagram */
  .lines-diagram {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .line-row {
    display: grid;
    grid-template-columns: 55px 120px 1fr;
    align-items: center;
    gap: 8px;
    padding: 4px 6px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.04);
  }

  .line-row.is-moving {
    background: rgba(220, 38, 38, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
  }

  .line-position {
    font-size: 0.72rem;
    font-weight: 600;
    color: #9ca3af;
  }

  .line-visual {
    position: relative;
    display: flex;
    align-items: center;
  }

  .yin-yang-bar {
    width: 110px;
    height: 12px;
    border-radius: 2px;
  }

  .yang-bar {
    background: linear-gradient(90deg, #d4af37, #f59e0b);
  }

  .yang-bar.changed-bar {
    background: linear-gradient(90deg, #38bdf8, #818cf8);
  }

  .yin-bar {
    display: flex;
    justify-content: space-between;
  }

  .yin-segment {
    width: 46px;
    height: 12px;
    background: linear-gradient(90deg, #d4af37, #f59e0b);
    border-radius: 2px;
  }

  .yin-bar.changed-bar .yin-segment {
    background: linear-gradient(90deg, #38bdf8, #818cf8);
  }

  .yin-gap {
    width: 18px;
  }

  .moving-indicator {
    position: absolute;
    right: -24px;
    font-size: 0.65rem;
    font-weight: 700;
    color: #ef4444;
  }

  .line-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    flex-wrap: wrap;
  }

  .six-kin {
    color: #ffd700;
    font-weight: 600;
  }

  .branch-stem {
    color: #e5e7eb;
  }

  .role-badge {
    font-size: 0.65rem;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 2px;
  }

  .role-shi {
    background: #dc2626;
    color: #fff;
  }

  .role-ying {
    background: #2563eb;
    color: #fff;
  }

  .spirit-badge {
    color: #9ca3af;
    font-size: 0.68rem;
  }

  /* Footer & Triện Đỏ */
  .poster-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid rgba(212, 175, 55, 0.3);
    padding-top: 14px;
    margin-top: 8px;
  }

  .footer-seal-container {
    flex-shrink: 0;
  }

  .imperial-seal {
    width: 95px;
    height: 95px;
    border: 3px solid #b91c1c;
    box-shadow: 0 0 10px rgba(185, 28, 28, 0.4);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(185, 28, 28, 0.08);
  }

  .seal-inner {
    width: 83px;
    height: 83px;
    border: 1px dashed #b91c1c;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    text-align: center;
  }

  .seal-text-top,
  .seal-text-mid,
  .seal-text-bot {
    color: #dc2626;
    font-weight: 900;
    font-size: 0.58rem;
    letter-spacing: 0.05em;
    font-family: var(--font-serif, serif);
  }

  .footer-meta-block {
    text-align: right;
  }

  .verification-lead {
    margin: 0 0 4px;
    font-size: 0.72rem;
    font-weight: 700;
    color: #ffd700;
    letter-spacing: 0.05em;
  }

  .verification-sub {
    margin: 0;
    font-size: 0.68rem;
    color: #9ca3af;
  }

  .sec-code {
    color: #f59e0b;
    font-weight: 600;
  }
</style>
