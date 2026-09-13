<script lang="ts">
  import {
    X,
    Share2,
    Download,
    Copy,
    Check,
    QrCode,
    Sparkles,
    Smartphone,
    Square,
    Layers,
  } from 'lucide-svelte';
  import {
    exportPosterToPng,
    triggerDirectDownload,
    sharePosterImage,
    slugifyVietnamese,
    type PosterAspectRatio,
  } from './royal-poster-exporter';
  import {
    buildShareUrl,
    openFacebookShare,
    openZaloShare,
    openTelegramShare,
    copyToClipboard,
  } from './poster-social-actions';
  import { toast } from '$lib/stores/toast';
  import { getAuthStore } from '$lib/auth/auth-context';

  interface Props {
    title?: string;
    subtitle?: string;
    path: string; // ví dụ "/charts/xxxx" hoặc "/share/xxxx"
    quote?: string;
    onClose: () => void;
  }

  let {
    title = 'Lá Số Tử Vi Hoàng Gia',
    subtitle = 'Khâm Thiên Giám Ngự Bút • Tử Vi Toàn Tập',
    path,
    quote = 'Mời bạn khám phá bản đồ vận mệnh Tử Vi Hoàng Gia cùng ViOS!',
    onClose,
  }: Props = $props();

  const auth = getAuthStore();
  let selectedRatio = $state<PosterAspectRatio>('story');
  let isExporting = $state(false);
  let isCopied = $state(false);
  let posterRef = $state<HTMLDivElement | null>(null);

  const referralCode = $derived(auth.user?.id || '');
  const shareUrl = $derived(buildShareUrl(path, referralCode));

  async function handleCopy() {
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      isCopied = true;
      toast.show('Đã sao chép liên kết chia sẻ kèm mã giới thiệu!', 'success');
      setTimeout(() => {
        isCopied = false;
      }, 2500);
    } else {
      toast.show('Không thể sao chép liên kết.', 'danger');
    }
  }

  function handleShareFacebook() {
    openFacebookShare(shareUrl, quote);
  }

  function handleShareZalo() {
    openZaloShare(shareUrl);
  }

  function handleShareTelegram() {
    openTelegramShare(shareUrl, quote);
  }

  async function handleDownloadImage() {
    if (!posterRef || isExporting) return;
    isExporting = true;
    try {
      toast.show('Đang tạo ảnh chất lượng cao, xin vui lòng đợi...', 'info');
      const blob = await exportPosterToPng(posterRef, {
        scale: 2,
        backgroundColor: '#0c0a09',
        aspectRatio: selectedRatio,
      });
      const fileName = `Chia-Se-Tu-Vi-${slugifyVietnamese(title)}-${selectedRatio}.png`;
      triggerDirectDownload(blob, fileName);
      toast.show('Tải ảnh chia sẻ thành công!', 'success');
    } catch (e: any) {
      toast.show('Lỗi khi xuất ảnh: ' + (e.message || 'Không xác định'), 'danger');
    } finally {
      isExporting = false;
    }
  }

  async function handleNativeShare() {
    if (!posterRef || isExporting) return;
    isExporting = true;
    try {
      const blob = await exportPosterToPng(posterRef, {
        scale: 2,
        backgroundColor: '#0c0a09',
        aspectRatio: selectedRatio,
      });
      const fileName = `Tu-Vi-${selectedRatio}.png`;
      const shared = await sharePosterImage(blob, fileName, title, quote);
      if (shared) {
        toast.show('Đã mở chia sẻ thành công!', 'success');
      } else {
        // Fallback mở Web Share URL nếu thiết bị không hỗ trợ share file
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({
            title,
            text: quote,
            url: shareUrl,
          });
        } else {
          await handleCopy();
        }
      }
    } catch {
      // User cancelled
    } finally {
      isExporting = false;
    }
  }
</script>

<div
  class="share-modal-backdrop"
  role="dialog"
  aria-modal="true"
  aria-labelledby="social-share-title"
  tabindex="-1"
  onkeydown={(e) => {
    if (e.key === 'Escape') onClose();
  }}
>
  <!-- Card Modal -->
  <div class="share-modal-card">
    <!-- Header -->
    <div class="share-modal-header">
      <div class="header-brand">
        <div class="header-icon-box">
          <Sparkles size={18} />
        </div>
        <div>
          <h3 id="social-share-title" class="header-title">
            Chia Sẻ Hoàng Triều • Lan Tỏa Vận Số
          </h3>
          <p class="header-subtitle">Tự động gắn mã giới thiệu nhận hoa hồng XU</p>
        </div>
      </div>
      <button
        onclick={onClose}
        class="btn-close-modal"
        aria-label="Đóng modal"
      >
        <X size={20} />
      </button>
    </div>

    <!-- Body cuộn -->
    <div class="share-modal-body">
      <!-- Selector chọn tỉ lệ -->
      <div class="ratio-section">
        <div class="section-label">
          <Layers size={14} class="accent-icon" /> Chọn Định Dạng Kích Thước:
        </div>
        <div class="ratio-grid">
          <button
            class="ratio-btn"
            class:active={selectedRatio === 'story'}
            onclick={() => (selectedRatio = 'story')}
          >
            <Smartphone size={15} /> Story (9:16)
          </button>
          <button
            class="ratio-btn"
            class:active={selectedRatio === 'square'}
            onclick={() => (selectedRatio = 'square')}
          >
            <Square size={15} /> Vuông (1:1)
          </button>
          <button
            class="ratio-btn"
            class:active={selectedRatio === 'portrait'}
            onclick={() => (selectedRatio = 'portrait')}
          >
            <Layers size={15} /> Cổ Điển (3:4)
          </button>
        </div>
      </div>

      <!-- Preview Poster Container -->
      <div class="poster-preview-stage">
        <div
          bind:this={posterRef}
          class="share-poster-box"
          style="
            width: {selectedRatio === 'story' ? '280px' : selectedRatio === 'square' ? '300px' : '300px'};
            height: {selectedRatio === 'story' ? '497px' : selectedRatio === 'square' ? '300px' : '400px'};
          "
        >
          <!-- Họa tiết góc hoàng cung -->
          <div class="corner-ornament top-left">✦</div>
          <div class="corner-ornament top-right">✦</div>
          <div class="corner-ornament bottom-left">✦</div>
          <div class="corner-ornament bottom-right">✦</div>

          <!-- Poster Header -->
          <div class="card-header-inner">
            <span class="card-crest-tag">
              Khâm Thiên Giám Ngự Chế
            </span>
            <h4 class="card-title">
              {title}
            </h4>
            <p class="card-subtitle">{subtitle}</p>
          </div>

          <!-- Poster Body Center (Ấn triện hoặc câu đối) -->
          <div class="card-quote-box">
            <p class="card-quote-text">
              "{quote}"
            </p>
          </div>

          <!-- Poster Footer & QR -->
          <div class="card-footer-inner">
            <div class="card-footer-brand">
              <p class="brand-line-1">👑 ViOS • Tử Vi Toàn Tập</p>
              <p class="brand-line-2">🌐 tuvitoantap.online</p>
            </div>
            <!-- Mock QR Hoàng gia -->
            <div class="qr-box">
              <QrCode size={24} />
            </div>
          </div>
        </div>
      </div>

      <!-- Khối Chia Sẻ Nhanh Mạng Xã Hội -->
      <div class="social-actions-section">
        <div class="section-label">
          <Share2 size={14} class="accent-icon" /> Chia Sẻ Trực Tiếp 1-Chạm:
        </div>
        <div class="social-btn-grid">
          <button
            onclick={handleShareFacebook}
            aria-label="Chia sẻ lên Facebook"
            class="social-btn btn-fb"
          >
            <span class="btn-brand-icon">f</span> Facebook
          </button>
          <button
            onclick={handleShareZalo}
            aria-label="Chia sẻ lên Zalo"
            class="social-btn btn-zalo"
          >
            <span class="btn-brand-icon">Z</span> Zalo
          </button>
          <button
            onclick={handleShareTelegram}
            aria-label="Chia sẻ lên Telegram"
            class="social-btn btn-tele"
          >
            <span class="btn-brand-icon">✈</span> Telegram
          </button>
          <button
            onclick={handleNativeShare}
            aria-label="Mở tùy chọn chia sẻ khác hoặc Web Share"
            class="social-btn btn-other"
          >
            <Share2 size={14} /> Khác
          </button>
        </div>
      </div>

      <!-- Input copy đường link có referral -->
      <div class="referral-input-section">
        <label for="share-link-input" class="referral-label">Liên kết kèm mã giới thiệu của bạn:</label>
        <div class="referral-input-box">
          <input
            id="share-link-input"
            readonly
            value={shareUrl}
            class="referral-input"
          />
          <button
            onclick={handleCopy}
            class="btn-copy-link"
          >
            {#if isCopied}
              <Check size={14} /> Đã chép
            {:else}
              <Copy size={14} /> Sao chép
            {/if}
          </button>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="share-modal-footer">
      <p class="reward-tip">
        <Sparkles size={12} /> Nhận ngay +5 XU khi người quen tạo tài khoản qua link của bạn
      </p>
      <button
        onclick={handleDownloadImage}
        disabled={isExporting}
        class="btn-download-poster"
      >
        <Download size={14} />
        {isExporting ? 'Đang xuất ảnh...' : 'Tải Ảnh Poster'}
      </button>
    </div>
  </div>
</div>

<style>
  .share-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(4, 3, 2, 0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: #f3f4f6;
  }

  .share-modal-card {
    position: relative;
    width: 100%;
    max-width: 620px;
    max-height: 92vh;
    display: flex;
    flex-direction: column;
    background: #0d0a07;
    border: 1px solid rgba(212, 175, 55, 0.35);
    border-radius: 16px;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(212, 175, 55, 0.15);
    overflow: hidden;
  }

  .share-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
    background: linear-gradient(90deg, #1f180e 0%, #0d0a07 100%);
  }

  .header-brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-icon-box {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffd700;
  }

  .header-title {
    margin: 0;
    font-family: var(--font-serif, serif);
    font-size: 1.05rem;
    font-weight: 700;
    color: #ffd700;
  }

  .header-subtitle {
    margin: 0;
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .btn-close-modal {
    background: transparent;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .btn-close-modal:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
  }

  .share-modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .section-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #d1d5db;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }

  :global(.accent-icon) {
    color: #ffd700;
  }

  .ratio-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .ratio-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px 12px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    color: #9ca3af;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ratio-btn.active {
    background: rgba(212, 175, 55, 0.18);
    border-color: #ffd700;
    color: #ffd700;
    box-shadow: 0 0 12px rgba(212, 175, 55, 0.2);
  }

  .poster-preview-stage {
    display: flex;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 16px;
    overflow: hidden;
  }

  .share-poster-box {
    position: relative;
    background: radial-gradient(circle at 50% 20%, #221a10 0%, #0c0906 100%);
    border: 1px solid rgba(212, 175, 55, 0.4);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    box-sizing: border-box;
  }

  .corner-ornament {
    position: absolute;
    color: #ffd700;
    font-size: 0.85rem;
    opacity: 0.8;
  }
  .top-left { top: 6px; left: 8px; }
  .top-right { top: 6px; right: 8px; }
  .bottom-left { bottom: 6px; left: 8px; }
  .bottom-right { bottom: 6px; right: 8px; }

  .card-crest-tag {
    display: inline-block;
    padding: 2px 8px;
    font-size: 0.62rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    background: rgba(212, 175, 55, 0.15);
    color: #ffd700;
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 999px;
    margin-bottom: 6px;
  }

  .card-title {
    margin: 0;
    font-family: var(--font-serif, serif);
    font-size: 0.95rem;
    font-weight: 700;
    color: #fef3c7;
    line-height: 1.3;
  }

  .card-subtitle {
    margin: 4px 0 0;
    font-size: 0.68rem;
    color: #9ca3af;
  }

  .card-quote-box {
    margin: auto 0;
    padding: 8px 12px;
    border: 1px solid rgba(212, 175, 55, 0.2);
    background: rgba(212, 175, 55, 0.05);
    border-radius: 8px;
    max-width: 90%;
  }

  .card-quote-text {
    margin: 0;
    font-family: var(--font-serif, serif);
    font-size: 0.78rem;
    font-style: italic;
    color: #fef08a;
    line-height: 1.5;
  }

  .card-footer-inner {
    width: 100%;
    padding-top: 10px;
    border-top: 1px solid rgba(212, 175, 55, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-footer-brand {
    text-align: left;
  }

  .brand-line-1 {
    margin: 0;
    font-size: 0.68rem;
    font-weight: 700;
    color: #ffd700;
  }

  .brand-line-2 {
    margin: 0;
    font-size: 0.6rem;
    color: #9ca3af;
  }

  .qr-box {
    width: 36px;
    height: 36px;
    background: #18120a;
    border: 1px solid rgba(212, 175, 55, 0.4);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffd700;
  }

  .social-btn-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .social-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px;
    border-radius: 10px;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-brand-icon {
    font-weight: 900;
    font-size: 0.85rem;
  }

  .btn-fb {
    background: rgba(24, 119, 242, 0.15);
    border: 1px solid rgba(24, 119, 242, 0.4);
    color: #60a5fa;
  }
  .btn-fb:hover { background: rgba(24, 119, 242, 0.25); }

  .btn-zalo {
    background: rgba(0, 104, 255, 0.15);
    border: 1px solid rgba(0, 104, 255, 0.4);
    color: #38bdf8;
  }
  .btn-zalo:hover { background: rgba(0, 104, 255, 0.25); }

  .btn-tele {
    background: rgba(34, 158, 217, 0.15);
    border: 1px solid rgba(34, 158, 217, 0.4);
    color: #7dd3fc;
  }
  .btn-tele:hover { background: rgba(34, 158, 217, 0.25); }

  .btn-other {
    background: rgba(168, 85, 247, 0.15);
    border: 1px solid rgba(168, 85, 247, 0.4);
    color: #c084fc;
  }
  .btn-other:hover { background: rgba(168, 85, 247, 0.25); }

  .referral-label {
    display: block;
    font-size: 0.72rem;
    color: #9ca3af;
    margin-bottom: 4px;
  }

  .referral-input-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 6px 6px 6px 12px;
  }

  .referral-input {
    flex: 1;
    background: transparent;
    border: none;
    font-family: monospace;
    font-size: 0.75rem;
    color: #e5e7eb;
    outline: none;
  }

  .btn-copy-link {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #d4af37;
    color: #17120a;
    border: none;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    transition: filter 0.2s;
  }

  .btn-copy-link:hover { filter: brightness(1.1); }

  .share-modal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-top: 1px solid rgba(212, 175, 55, 0.2);
    background: #090705;
    flex-wrap: wrap;
    gap: 10px;
  }

  .reward-tip {
    margin: 0;
    font-size: 0.72rem;
    color: #fef08a;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .btn-download-poster {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 10px;
    background: linear-gradient(135deg, #d4af37, #b45309);
    border: 1px solid #ffd700;
    color: #17120a;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 0 12px rgba(212, 175, 55, 0.3);
    transition: filter 0.2s;
    margin-left: auto;
  }

  .btn-download-poster:hover:not(:disabled) { filter: brightness(1.1); }

  @media (max-width: 500px) {
    .social-btn-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
