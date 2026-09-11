<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { base } from '$app/paths';
  import { Download, Share2, X, Sparkles } from 'lucide-svelte';
  import type { TarotDraw } from '@ziweiai/contracts';
  import {
    exportPosterToPng,
    triggerDirectDownload,
    sharePosterImage,
    formatDivinationPosterFileName,
  } from './royal-poster-exporter';
  import { toast } from '$lib/stores/toast';

  interface Props {
    draw: TarotDraw;
    userName?: string;
    onClose: () => void;
  }

  let { draw, userName = 'Đương Số', onClose }: Props = $props();

  const royalSecurityCode = $derived(
    `VIOS-TAROT-${draw.seed ? draw.seed.slice(0, 8).toUpperCase() : Math.abs(draw.question.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)).toString(16).toUpperCase().padStart(6, '0')}`,
  );

  let posterElement = $state<HTMLDivElement | null>(null);
  let isExporting = $state(false);

  const spreadLabels: Record<string, string> = {
    single: 'Trải Bài 1 Lá',
    'three-card': 'Trải Bài 3 Lá (Quá Khứ — Hiện Tại — Tương Lai)',
    diamond: 'Trải Bài Kim Cương (4 Lá)',
    moon: 'Trải Bài Trăng Khuyết (5 Lá)',
    horseshoe: 'Trải Bài Móng Ngựa (7 Lá)',
    'celtic-cross': 'Trải Bài Thập Tự Celtic (10 Lá)',
  };

  const spreadLabel = $derived(spreadLabels[draw.spread] ?? 'Trải Bài Tarot');

  function cardImageSrc(cardId: string): string {
    return `${base}/tarot/${cardId}.jpg`;
  }

  function getPositionLabel(position: number, spread: string): string {
    if (spread === 'three-card') {
      const labels = ['Quá Khứ', 'Hiện Tại', 'Tương Lai'];
      return labels[position] ?? `Vị Trí ${position + 1}`;
    }
    if (spread === 'single') {
      return 'Lá Bài Chủ';
    }
    return `Vị Trí ${position + 1}`;
  }

  // Trích đoạn thông điệp vũ trụ (bỏ cú pháp Markdown nặng nếu có)
  const messageSnippet = $derived.by(() => {
    if (!draw.narrative) return 'Vũ trụ gửi đến bạn thông điệp khai mở và chỉ dẫn bình an.';
    const clean = draw.narrative.replace(/[#*`_]/g, '').trim();
    return clean.length > 280 ? `${clean.slice(0, 280)}...` : clean;
  });

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
      toast.show('Đang khởi tạo ảnh Poster Tarot độ phân giải cao...', 'info');
      const blob = await exportPosterToPng(posterElement, { scale: 2 });
      const fileName = formatDivinationPosterFileName('tarot', draw.spread);
      triggerDirectDownload(blob, fileName);
      toast.show('Đã tải thành công Poster Tarot Hoàng Gia!', 'success');
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
      const fileName = formatDivinationPosterFileName('tarot', draw.spread);
      const shared = await sharePosterImage(
        blob,
        fileName,
        `Trải Bài Tarot: ${draw.question} — ViOS`,
        `Thông điệp bài Tarot bảo chứng bởi ViOS (Tử Vi Toàn Tập).`,
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

<div class="poster-modal-backdrop" role="dialog" aria-modal="true" aria-label="Xem trước Poster Tarot">
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

      <!-- Header Hoàng Gia Tarot -->
      <header class="poster-header">
        <div class="header-crest">
          <span class="crest-sparkle"><Sparkles size={16} /></span>
          <span class="crest-label">HUYỀN QUẺ TAROT • THÔNG ĐIỆP VŨ TRỤ</span>
          <span class="crest-sparkle"><Sparkles size={16} /></span>
        </div>
        <h1 class="poster-title">BẢN ĐỒ CHIÊM ĐOÁN NĂNG LƯỢNG TAROT</h1>
        <p class="poster-subtitle">KHẢI THỊ TÂM LINH • THẤU SUỐT THỜI KHẮC HIỆN TẠI VÀ TƯƠNG LAI</p>
      </header>

      <!-- Profile & Question Card -->
      <section class="poster-profile-section">
        <div class="profile-card">
          <div class="profile-row-main">
            <span class="profile-name">Đương Số: {userName}</span>
            <span class="spread-type-badge">{spreadLabel}</span>
          </div>

          <div class="question-row">
            <span class="question-label">Câu hỏi chiêm bái:</span>
            <p class="question-text">"{draw.question}"</p>
          </div>

          <div class="profile-meta-grid">
            <div class="meta-item">
              <span class="meta-label">Mã chứng nhận:</span>
              <span class="meta-val highlight-amber">{royalSecurityCode}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Số lá bài:</span>
              <span class="meta-val highlight-gold">{draw.cards.length} lá bài</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Thời khắc:</span>
              <span class="meta-val">{new Date().toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Cards Grid -->
      <section class="cards-display-section">
        <div class="cards-spread-grid cards-count-{Math.min(draw.cards.length, 6)}">
          {#each draw.cards as card (card.id + card.position)}
            <div class="tarot-card-item">
              <div class="card-position-pill">{getPositionLabel(card.position, draw.spread)}</div>
              <div class="card-art-frame">
                <img
                  class="card-img"
                  class:is-reversed={card.reversed}
                  src={cardImageSrc(card.id)}
                  alt={card.name}
                  crossorigin="anonymous"
                />
              </div>
              <h3 class="card-title">{card.name}</h3>
              <span class="orient-tag" class:reversed-tag={card.reversed}>
                {card.reversed ? 'Chiếu Ngược' : 'Chiếu Xuôi'}
              </span>
            </div>
          {/each}
        </div>
      </section>

      <!-- Message Quote Block -->
      <section class="message-quote-section">
        <div class="quote-card">
          <div class="quote-header">
            <span class="quote-symbol">❝</span>
            <span class="quote-title">Lời Khuyên Vũ Trụ & Năng Lượng Chỉ Dẫn</span>
          </div>
          <p class="quote-body">{messageSnippet}</p>
        </div>
      </section>

      <!-- Footer & Triện Hoàng Cung -->
      <footer class="poster-footer">
        <div class="footer-seal-container">
          <div class="imperial-seal">
            <div class="seal-inner">
              <span class="seal-text-top">TAROT THẦN TOÁN</span>
              <span class="seal-text-mid">✦ KHÂM THIÊN GIÁM ✦</span>
              <span class="seal-text-bot">TỬ VI TOÀN TẬP</span>
            </div>
          </div>
        </div>

        <div class="footer-meta-block">
          <p class="verification-lead">
            BẢO CHỨNG BỞI NỀN TẢNG THUẬT SỐ HOÀNG GIA VIOS
          </p>
          <p class="verification-sub">
            MÃ ĐỘC BẢN: <span class="sec-code">{royalSecurityCode}</span> • BẢO MẬT & CHÂN THẬT
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
    background: #09090e;
    background-image: radial-gradient(circle at 50% 10%, rgba(147, 51, 234, 0.12) 0%, transparent 60%),
      radial-gradient(circle at 80% 80%, rgba(212, 175, 55, 0.08) 0%, transparent 50%);
    border: 2px solid #d4af37;
    box-shadow: 0 0 0 6px #09090e, 0 0 0 8px #581c87, 0 20px 50px rgba(0, 0, 0, 0.9);
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

  .crest-sparkle {
    color: #ffd700;
  }

  .crest-label {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: #c084fc;
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
    margin-bottom: 6px;
  }

  .profile-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: #ffd700;
  }

  .spread-type-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 2px 8px;
    background: rgba(168, 85, 247, 0.2);
    color: #d8b4fe;
    border: 1px solid rgba(168, 85, 247, 0.4);
    border-radius: 4px;
  }

  .question-row {
    margin: 6px 0 8px;
    padding: 6px 10px;
    background: rgba(0, 0, 0, 0.4);
    border-left: 3px solid #d4af37;
    border-radius: 0 4px 4px 0;
  }

  .question-label {
    display: block;
    font-size: 0.7rem;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .question-text {
    margin: 2px 0 0;
    font-size: 0.92rem;
    font-weight: 600;
    color: #fef08a;
    font-style: italic;
  }

  .profile-meta-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px 12px;
    font-size: 0.78rem;
    border-top: 1px dashed rgba(255, 255, 255, 0.1);
    padding-top: 6px;
  }

  .meta-item { display: flex; align-items: center; gap: 6px; }
  .meta-label { color: #9ca3af; }
  .meta-val { color: #e5e7eb; font-weight: 500; }
  .highlight-amber { color: #f59e0b; font-weight: 600; }
  .highlight-gold { color: #ffd700; font-weight: 600; }

  /* Cards Display Grid */
  .cards-display-section {
    margin-bottom: 16px;
  }

  .cards-spread-grid {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 14px;
    flex-wrap: wrap;
  }

  .tarot-card-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 130px;
    background: rgba(20, 16, 28, 0.8);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 6px;
    padding: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }

  .card-position-pill {
    font-size: 0.68rem;
    font-weight: 700;
    color: #fbbf24;
    margin-bottom: 6px;
    text-align: center;
  }

  .card-art-frame {
    width: 100px;
    height: 165px;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid rgba(212, 175, 55, 0.4);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
    background: #111;
  }

  .card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .card-img.is-reversed {
    transform: rotate(180deg);
  }

  .card-title {
    margin: 8px 0 2px;
    font-size: 0.82rem;
    font-weight: 700;
    color: #fff;
    text-align: center;
    line-height: 1.2;
    min-height: 2em;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .orient-tag {
    font-size: 0.65rem;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 3px;
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .orient-tag.reversed-tag {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border-color: rgba(239, 68, 68, 0.3);
  }

  /* Quote Box */
  .message-quote-section {
    margin-bottom: 16px;
  }

  .quote-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(168, 85, 247, 0.3);
    border-radius: 6px;
    padding: 10px 14px;
  }

  .quote-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }

  .quote-symbol {
    font-size: 1.2rem;
    color: #c084fc;
    line-height: 1;
  }

  .quote-title {
    font-size: 0.75rem;
    font-weight: 700;
    color: #c084fc;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .quote-body {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.5;
    color: #e2e8f0;
    font-style: italic;
  }

  /* Footer & Triện Đỏ */
  .poster-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid rgba(212, 175, 55, 0.3);
    padding-top: 14px;
  }

  .footer-seal-container { flex-shrink: 0; }

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

  .footer-meta-block { text-align: right; }

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
