<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { Download, Share2, X, Compass } from 'lucide-svelte';
  import type { NumerologyResult } from '$lib/features/numerology/numerology-calculator';
  import { reduceToSingleDigit } from '$lib/features/numerology/numerology-calculator';
  import {
    exportPosterToPng,
    triggerDirectDownload,
    sharePosterImage,
    formatDivinationPosterFileName,
  } from './royal-poster-exporter';
  import { toast } from '$lib/stores/toast';

  interface Props {
    fullName: string;
    birthDateString: string;
    result: NumerologyResult;
    aiNarrative?: string | null;
    onClose: () => void;
  }

  let { fullName, birthDateString, result, aiNarrative = null, onClose }: Props = $props();

  const royalSecurityCode = $derived(
    `VIOS-NUMERO-${Date.now().toString(36).toUpperCase().slice(-6)}`,
  );

  let posterElement = $state<HTMLDivElement | null>(null);
  let isExporting = $state(false);

  // Tính 4 đỉnh cao Kim Tự Tháp Pythagoras
  const pyramidPeaks = $derived.by(() => {
    if (!birthDateString) return null;
    const parts = birthDateString.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const [year, month, day] = parts;

    const daySum = reduceToSingleDigit(day);
    const monthSum = reduceToSingleDigit(month);
    const yearSum = reduceToSingleDigit(year);

    const peak1 = reduceToSingleDigit(monthSum + daySum);
    const peak2 = reduceToSingleDigit(daySum + yearSum);
    const peak3 = reduceToSingleDigit(peak1 + peak2);
    const peak4 = reduceToSingleDigit(monthSum + yearSum);

    const age1 = 36 - result.lifePath;
    const age2 = age1 + 9;
    const age3 = age2 + 9;
    const age4 = age3 + 9;

    return [
      { peak: 1, value: peak1, age: age1 },
      { peak: 2, value: peak2, age: age2 },
      { peak: 3, value: peak3, age: age3 },
      { peak: 4, value: peak4, age: age4 },
    ];
  });

  const narrativeSnippet = $derived.by(() => {
    if (!aiNarrative) {
      return 'Con số chủ đạo của bạn mang năng lượng khai sáng, tiềm năng vượt trội và dẫn lối tới những thành tựu rực rỡ khi thấu suốt bản thân.';
    }
    const clean = aiNarrative.replace(/[#*`_]/g, '').trim();
    return clean.length > 250 ? `${clean.slice(0, 250)}...` : clean;
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
      toast.show('Đang khởi tạo ảnh Poster Thần Số Học độ phân giải cao...', 'info');
      const blob = await exportPosterToPng(posterElement, { scale: 2 });
      const fileName = formatDivinationPosterFileName('numerology', fullName);
      triggerDirectDownload(blob, fileName);
      toast.show('Đã tải thành công Poster Thần Số Học Hoàng Gia!', 'success');
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
      const fileName = formatDivinationPosterFileName('numerology', fullName);
      const shared = await sharePosterImage(
        blob,
        fileName,
        `Bản Đồ Thần Số Học: ${fullName} — ViOS`,
        `Hồ sơ 4 chỉ số cốt lõi Pythagoras bảo chứng bởi ViOS (Tử Vi Toàn Tập).`,
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

<div class="poster-modal-backdrop" role="dialog" aria-modal="true" aria-label="Xem trước Poster Thần Số Học">
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

      <!-- Header Hoàng Gia Pythagoras -->
      <header class="poster-header">
        <div class="header-crest">
          <span class="crest-icon"><Compass size={16} /></span>
          <span class="crest-label">ĐỒ HÌNH PYTHAGORAS • MẬT MÃ HOÀNG KIM</span>
          <span class="crest-icon"><Compass size={16} /></span>
        </div>
        <h1 class="poster-title">BẢN ĐỒ THẦN SỐ HỌC TOÀN NIÊN</h1>
        <p class="poster-subtitle">KHÁM PHÁ MẬT MÃ LINH HỒN • ĐỊNH HƯỚNG SỨ MỆNH CUỘC ĐỜI</p>
      </header>

      <!-- Profile Section -->
      <section class="poster-profile-section">
        <div class="profile-card">
          <div class="profile-row-main">
            <span class="profile-name">Đương Số: {fullName}</span>
            {#if birthDateString}
              <span class="profile-dob-badge">Ngày sinh: {birthDateString}</span>
            {/if}
          </div>

          <div class="profile-meta-grid">
            <div class="meta-item">
              <span class="meta-label">Mã chứng nhận:</span>
              <span class="meta-val highlight-amber">{royalSecurityCode}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Trường năng lượng:</span>
              <span class="meta-val highlight-gold">Số {result.lifePath} (Chủ Đạo)</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Ngày trích xuất:</span>
              <span class="meta-val">{new Date().toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 4 Core Numbers Section -->
      <section class="core-numbers-section">
        <h2 class="section-title">BỐN CHỈ SỐ CỐT LÕI PYTHAGORAS</h2>
        <div class="numbers-grid">
          <!-- 1. Life Path -->
          <div class="number-card card-lifepath">
            <div class="num-badge">Đường Đời</div>
            <div class="num-digit gold-digit">{result.lifePath}</div>
            <h3 class="num-title">Số Chủ Đạo</h3>
            <p class="num-desc">Bài học, tài năng cốt lõi và con đường vận mệnh chính</p>
          </div>

          <!-- 2. Destiny -->
          <div class="number-card card-destiny">
            <div class="num-badge">Sứ Mệnh</div>
            <div class="num-digit purple-digit">{result.destiny}</div>
            <h3 class="num-title">Số Vận Mệnh</h3>
            <p class="num-desc">Mục tiêu phát triển cao nhất và tiềm năng gặt hái thành công</p>
          </div>

          <!-- 3. Soul Urge -->
          <div class="number-card card-soul">
            <div class="num-badge">Nội Tâm</div>
            <div class="num-digit cyan-digit">{result.soulUrge}</div>
            <h3 class="num-title">Số Linh Hồn</h3>
            <p class="num-desc">Khát khao chân thật, bình an sâu thẳm và động lực nội tại</p>
          </div>

          <!-- 4. Personality -->
          <div class="number-card card-personality">
            <div class="num-badge">Ngoại Thể</div>
            <div class="num-digit emerald-digit">{result.personality}</div>
            <h3 class="num-title">Số Nhân Cách</h3>
            <p class="num-desc">Ấn tượng, phong thái và hình mẫu tỏa sáng với thế giới bên ngoài</p>
          </div>
        </div>
      </section>

      <!-- Kim Tự Tháp 4 Đỉnh Cao Cuộc Đời -->
      {#if pyramidPeaks}
        <section class="pyramid-section">
          <h2 class="section-title">BỐN ĐỈNH CAO KIM TỰ THÁP VẬN MỆNH</h2>
          <div class="pyramid-peaks-row">
            {#each pyramidPeaks as p (p.peak)}
              <div class="pyramid-peak-box">
                <div class="peak-header">Đỉnh {p.peak}</div>
                <div class="peak-value">{p.value}</div>
                <div class="peak-age">{p.age} tuổi</div>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <!-- AI / Narrative Quote Section -->
      <section class="narrative-quote-section">
        <div class="quote-box">
          <div class="quote-header">
            <span class="quote-icon">✦</span>
            <span class="quote-title">Thông Điệp Định Hướng Cuộc Sống</span>
          </div>
          <p class="quote-content">{narrativeSnippet}</p>
        </div>
      </section>

      <!-- Footer & Triện Hoàng Cung -->
      <footer class="poster-footer">
        <div class="footer-seal-container">
          <div class="imperial-seal">
            <div class="seal-inner">
              <span class="seal-text-top">THẦN SỐ TOÀN TẬP</span>
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
            MÃ ĐỘC BẢN: <span class="sec-code">{royalSecurityCode}</span> • BẢO MẬT DỮ LIỆU
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
    background: #0a0a0c;
    background-image: radial-gradient(circle at 50% 15%, rgba(212, 175, 55, 0.1) 0%, transparent 65%),
      radial-gradient(circle at 80% 80%, rgba(56, 189, 248, 0.06) 0%, transparent 50%);
    border: 2px solid #d4af37;
    box-shadow: 0 0 0 6px #0a0a0c, 0 0 0 8px #78350f, 0 20px 50px rgba(0, 0, 0, 0.9);
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

  .crest-icon { color: #ffd700; }
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

  .profile-dob-badge {
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

  .meta-item { display: flex; align-items: center; gap: 6px; }
  .meta-label { color: #9ca3af; }
  .meta-val { color: #e5e7eb; font-weight: 500; }
  .highlight-amber { color: #f59e0b; font-weight: 600; }
  .highlight-gold { color: #ffd700; font-weight: 600; }

  .section-title {
    margin: 0 0 10px;
    font-size: 0.82rem;
    font-weight: 700;
    color: #ffd700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-align: center;
  }

  /* Core Numbers Grid */
  .core-numbers-section {
    margin-bottom: 16px;
  }

  .numbers-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .number-card {
    background: rgba(20, 18, 16, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 10px 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .card-lifepath { border-color: rgba(212, 175, 55, 0.4); }
  .card-destiny { border-color: rgba(168, 85, 247, 0.4); }
  .card-soul { border-color: rgba(56, 189, 248, 0.4); }
  .card-personality { border-color: rgba(52, 211, 153, 0.4); }

  .num-badge {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #9ca3af;
    margin-bottom: 4px;
  }

  .num-digit {
    font-size: 2.2rem;
    font-weight: 900;
    line-height: 1.1;
    font-family: var(--font-serif, serif);
  }

  .gold-digit { color: #ffd700; text-shadow: 0 0 12px rgba(212, 175, 55, 0.5); }
  .purple-digit { color: #c084fc; text-shadow: 0 0 12px rgba(168, 85, 247, 0.5); }
  .cyan-digit { color: #38bdf8; text-shadow: 0 0 12px rgba(56, 189, 248, 0.5); }
  .emerald-digit { color: #34d399; text-shadow: 0 0 12px rgba(52, 211, 153, 0.5); }

  .num-title {
    margin: 4px 0 2px;
    font-size: 0.8rem;
    font-weight: 700;
    color: #fff;
  }

  .num-desc {
    margin: 0;
    font-size: 0.68rem;
    color: #9ca3af;
    line-height: 1.3;
  }

  /* Pyramid Section */
  .pyramid-section {
    margin-bottom: 16px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 6px;
    padding: 10px 14px;
  }

  .pyramid-peaks-row {
    display: flex;
    justify-content: space-around;
    gap: 8px;
  }

  .pyramid-peak-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 4px;
    padding: 6px 14px;
    min-width: 90px;
  }

  .peak-header {
    font-size: 0.68rem;
    font-weight: 700;
    color: #fbbf24;
    text-transform: uppercase;
  }

  .peak-value {
    font-size: 1.4rem;
    font-weight: 800;
    color: #fff;
    margin: 2px 0;
  }

  .peak-age {
    font-size: 0.68rem;
    color: #9ca3af;
  }

  /* Narrative Quote */
  .narrative-quote-section {
    margin-bottom: 16px;
  }

  .quote-box {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 6px;
    padding: 10px 14px;
  }

  .quote-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }

  .quote-icon { color: #ffd700; font-size: 0.8rem; }
  .quote-title {
    font-size: 0.72rem;
    font-weight: 700;
    color: #ffd700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .quote-content {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.5;
    color: #e5e7eb;
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
