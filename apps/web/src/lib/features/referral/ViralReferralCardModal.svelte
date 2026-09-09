<script lang="ts">
  import { browser } from '$app/environment';
  import { generateQrMatrix } from './qr-matrix';
  import { toast } from '$lib/stores/toast';
  import {
    X,
    Download,
    Copy,
    Share2,
    Sparkles,
    Check
  } from 'lucide-svelte';

  interface Props {
    isOpen: boolean;
    referralCode: string;
    onClose: () => void;
  }

  let { isOpen, referralCode, onClose }: Props = $props();

  let canvasRef: HTMLCanvasElement | null = $state(null);
  let isCopied = $state(false);
  let isRendering = $state(false);

  let shareUrl = $derived(`https://tuvitoantap.vercel.app/share/ref/${referralCode}`);

  $effect(() => {
    if (isOpen && browser && canvasRef) {
      renderCardToCanvas(canvasRef, false);
    }
  });

  /**
   * Render thiệp mời lên canvas (hỗ trợ scale 2x Retina cho file download sắc nét)
   */
  function renderCardToCanvas(canvas: HTMLCanvasElement, highRes: boolean = false) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = highRes ? 800 : 400;
    const height = highRes ? 1120 : 560;
    const scale = highRes ? 2 : 1;

    canvas.width = width;
    canvas.height = height;

    // 1. Background: Deep Cosmic Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#070b14');
    bgGrad.addColorStop(0.35, '#130d2e');
    bgGrad.addColorStop(0.7, '#1b1238');
    bgGrad.addColorStop(1, '#091024');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Cosmic Ambient Light Glows
    const glow1 = ctx.createRadialGradient(width * 0.5, height * 0.25, 10, width * 0.5, height * 0.25, width * 0.6);
    glow1.addColorStop(0, 'rgba(212, 175, 55, 0.15)'); // Gold glow
    glow1.addColorStop(0.6, 'rgba(124, 58, 237, 0.1)'); // Purple glow
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, width, height);

    // 3. Double Royal Golden Borders
    const padding = 20 * scale;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(padding, padding, width - padding * 2, height - padding * 2);

    const innerPad = 26 * scale;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
    ctx.lineWidth = 1 * scale;
    ctx.strokeRect(innerPad, innerPad, width - innerPad * 2, height - innerPad * 2);

    // Corner Accents (Họa tiết góc hoàng gia)
    const cornerSize = 14 * scale;
    const drawCorner = (x: number, y: number, dx: number, dy: number) => {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5 * scale;
      ctx.beginPath();
      ctx.moveTo(x + dx * cornerSize, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy * cornerSize);
      ctx.stroke();
    };
    drawCorner(innerPad, innerPad, 1, 1);
    drawCorner(width - innerPad, innerPad, -1, 1);
    drawCorner(innerPad, height - innerPad, 1, -1);
    drawCorner(width - innerPad, height - innerPad, -1, -1);

    // 4. Header: Celestial Luxury Title & ViOS Brand
    ctx.textAlign = 'center';

    // Sub-title
    ctx.font = `600 ${10 * scale}px "Space Grotesk", sans-serif`;
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('✦  LỜI MỜI THƯỢNG KHÁCH  ✦', width / 2, 60 * scale);

    // Main Logo / Header
    ctx.font = `bold ${22 * scale}px "Playfair Display", serif`;
    const goldTextGrad = ctx.createLinearGradient(width * 0.2, 0, width * 0.8, 0);
    goldTextGrad.addColorStop(0, '#fef08a');
    goldTextGrad.addColorStop(0.5, '#f59e0b');
    goldTextGrad.addColorStop(1, '#eab308');
    ctx.fillStyle = goldTextGrad;
    ctx.fillText('ViOS • TỬ VI TOÀN TẬP', width / 2, 95 * scale);

    ctx.font = `400 ${10.5 * scale}px "Inter", sans-serif`;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Hệ Thống Trí Tuệ Nhân Tạo Luận Giải Đa Thuật Số', width / 2, 118 * scale);

    // Decorative divider line
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 80 * scale, 134 * scale);
    ctx.lineTo(width / 2 + 80 * scale, 134 * scale);
    ctx.stroke();

    // 5. Special Gift Box (+10 XU)
    const boxY = 152 * scale;
    const boxW = width - 70 * scale;
    const boxH = 76 * scale;
    const boxX = (width - boxW) / 2;

    const boxGrad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY + boxH);
    boxGrad.addColorStop(0, 'rgba(245, 158, 11, 0.12)');
    boxGrad.addColorStop(1, 'rgba(124, 58, 237, 0.15)');
    ctx.fillStyle = boxGrad;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 10 * scale);
    ctx.fill();

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 10 * scale);
    ctx.stroke();

    ctx.font = `bold ${12 * scale}px "Space Grotesk", sans-serif`;
    ctx.fillStyle = '#fef08a';
    ctx.fillText('🎁  QUÀ TẶNG KHAI VẬN BẠN HỮU', width / 2, boxY + 24 * scale);

    ctx.font = `bold ${17 * scale}px "Space Grotesk", sans-serif`;
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('+10 XU TRẢI NGHIỆM MIỄN PHÍ', width / 2, boxY + 47 * scale);

    ctx.font = `400 ${9.5 * scale}px "Inter", sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Mở khoá 10 Hệ Thuật Số: Tử Vi, Bát Tự, Kỳ Môn, Tướng Pháp AI...', width / 2, boxY + 65 * scale);

    // 6. Referral Code Badge
    const codeBadgeY = 246 * scale;
    ctx.font = `600 ${10.5 * scale}px "Inter", sans-serif`;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('MÃ ƯU ĐÃI ĐẶC QUYỀN', width / 2, codeBadgeY);

    const codeBoxW = 180 * scale;
    const codeBoxH = 34 * scale;
    const codeBoxX = (width - codeBoxW) / 2;
    const codeBoxY = codeBadgeY + 8 * scale;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.beginPath();
    ctx.roundRect(codeBoxX, codeBoxY, codeBoxW, codeBoxH, 6 * scale);
    ctx.fill();

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.roundRect(codeBoxX, codeBoxY, codeBoxW, codeBoxH, 6 * scale);
    ctx.stroke();

    ctx.font = `bold ${17 * scale}px "Space Grotesk", monospace`;
    ctx.fillStyle = '#fef08a';
    ctx.fillText(referralCode || 'VIP8888', width / 2, codeBoxY + 23 * scale);

    // 7. QR Code Matrix Rendering
    const qrMatrix = generateQrMatrix(shareUrl);
    const qrMatrixSize = qrMatrix.length;
    const qrTargetSize = 130 * scale;
    const qrX = (width - qrTargetSize) / 2;
    const qrY = 312 * scale;

    // White/Cream Card under QR for camera contrast
    const qrBgPad = 10 * scale;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrX - qrBgPad, qrY - qrBgPad, qrTargetSize + qrBgPad * 2, qrTargetSize + qrBgPad * 2, 8 * scale);
    ctx.fill();

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.roundRect(qrX - qrBgPad, qrY - qrBgPad, qrTargetSize + qrBgPad * 2, qrTargetSize + qrBgPad * 2, 8 * scale);
    ctx.stroke();

    const moduleSize = qrTargetSize / qrMatrixSize;
    ctx.fillStyle = '#0f172a'; // Deep slate dark modules

    for (let r = 0; r < qrMatrixSize; r++) {
      for (let c = 0; c < qrMatrixSize; c++) {
        if (qrMatrix[r][c]) {
          ctx.fillRect(
            qrX + c * moduleSize,
            qrY + r * moduleSize,
            moduleSize + 0.3 * scale, // slight overlap to prevent gaps
            moduleSize + 0.3 * scale
          );
        }
      }
    }

    // 8. Footer Instructions
    const footerY = 485 * scale;
    ctx.font = `600 ${11 * scale}px "Inter", sans-serif`;
    ctx.fillStyle = '#fef08a';
    ctx.fillText('Quét mã QR để nhận XU và kích hoạt tức thì', width / 2, footerY);

    ctx.font = `400 ${9.5 * scale}px "Space Grotesk", sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('tuvitoantap.vercel.app  •  ViOS AI Platform', width / 2, footerY + 20 * scale);
  }

  async function handleDownloadImage() {
    if (!browser || isRendering) return;
    isRendering = true;

    try {
      const offscreenCanvas = document.createElement('canvas');
      renderCardToCanvas(offscreenCanvas, true); // High-res 2x (800x1120)

      const dataUrl = offscreenCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `ViOS_Thiep_Moi_${referralCode || 'VIP'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.show('🎉 Đã tải thiệp mời thành công! Bạn có thể gửi ngay qua Zalo/Facebook.', 'success');
    } catch {
      toast.show('Không thể xuất ảnh thiệp mời, vui lòng thử lại.', 'danger');
    } finally {
      isRendering = false;
    }
  }

  async function handleCopyImage() {
    if (!browser || isRendering) return;
    isRendering = true;

    try {
      const offscreenCanvas = document.createElement('canvas');
      renderCardToCanvas(offscreenCanvas, true);

      offscreenCanvas.toBlob(async (blob) => {
        if (!blob) {
          toast.show('Trình duyệt không hỗ trợ sao chép ảnh.', 'danger');
          isRendering = false;
          return;
        }

        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          isCopied = true;
          toast.show('✨ Đã sao chép thiệp mời! Bạn có thể dán (Ctrl+V) trực tiếp vào khung chat Zalo/Telegram.', 'success');
          setTimeout(() => {
            isCopied = false;
          }, 3000);
        } catch {
          // Fallback to copying share link
          await navigator.clipboard.writeText(shareUrl);
          toast.show('Đã sao chép link giới thiệu vào clipboard!', 'info');
        } finally {
          isRendering = false;
        }
      }, 'image/png');
    } catch {
      isRendering = false;
      toast.show('Không thể sao chép ảnh, vui lòng thử lại.', 'danger');
    }
  }

  async function handleNativeShare() {
    if (!browser) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Thiệp Mời Khai Vận ViOS — Nhận 10 XU Miễn Phí',
          text: `Nhận ngay 10 XU trải nghiệm 10 hệ thuật số AI (Tử Vi, Bát Tự, Kỳ Môn, Tướng Pháp AI...) cùng ViOS! Dùng mã ưu đãi: ${referralCode}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback copy
      navigator.clipboard.writeText(shareUrl);
      toast.show('Đã sao chép link mời bạn hữu!', 'success');
    }
  }

  function shareOnZalo() {
    if (!browser) return;
    window.open(`https://sp.zalo.me/share_inline?link=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
  }

  function shareOnFacebook() {
    if (!browser) return;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
  }

  function shareOnTelegram() {
    if (!browser) return;
    const msg = `Khai mở vận trình cùng ViOS — Tặng 10 XU trải nghiệm AI Tử Vi & Chiêm Tinh! Mã ưu đãi: ${referralCode}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  }
</script>

{#if isOpen}
  <div
    class="modal-backdrop"
    onclick={onClose}
    onkeydown={(e) => e.key === 'Escape' && onClose()}
    role="presentation"
  >
    <div
      class="modal-content glass-luxury-panel"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby="viral-modal-title"
    >
      <!-- Close Button -->
      <button class="close-btn" onclick={onClose} aria-label="Đóng thiệp mời">
        <X size={20} />
      </button>

      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-badge">
          <Sparkles size={14} class="gold-icon" />
          <span>Celestial Luxury</span>
        </div>
        <h2 id="viral-modal-title">Thiệp Mời Thượng Khách ViOS</h2>
        <p class="header-desc">
          Chia sẻ thiệp mời hoàng kim độc quyền kèm mã QR để tặng bạn hữu 10 XU và cùng nhận thưởng.
        </p>
      </div>

      <!-- Card Canvas Preview -->
      <div class="canvas-preview-wrapper">
        <canvas
          bind:this={canvasRef}
          class="viral-card-canvas"
          width="400"
          height="560"
        ></canvas>
      </div>

      <!-- Action Buttons Grid -->
      <div class="actions-grid">
        <button
          class="btn-action btn-primary-gold"
          onclick={handleDownloadImage}
          disabled={isRendering}
        >
          <Download size={18} />
          <span>Tải Thiệp Ảnh (.PNG)</span>
        </button>

        <button
          class="btn-action btn-secondary-glass"
          onclick={handleCopyImage}
          disabled={isRendering}
        >
          {#if isCopied}
            <Check size={18} class="text-green-400" />
            <span>Đã Sao Chép Ảnh</span>
          {:else}
            <Copy size={18} />
            <span>Sao Chép Ảnh</span>
          {/if}
        </button>

        <button
          class="btn-action btn-secondary-glass"
          onclick={handleNativeShare}
        >
          <Share2 size={18} />
          <span>Chia Sẻ 1 Chạm</span>
        </button>
      </div>

      <!-- Social Quick Links -->
      <div class="social-quick-share">
        <span class="social-label">Gửi trực tiếp:</span>
        <button class="social-btn zalo" onclick={shareOnZalo}>Zalo</button>
        <button class="social-btn fb" onclick={shareOnFacebook}>Facebook</button>
        <button class="social-btn tele" onclick={shareOnTelegram}>Telegram</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(2, 6, 23, 0.82);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    overflow-y: auto;
  }

  .modal-content {
    position: relative;
    max-width: 480px;
    width: 100%;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(24, 18, 48, 0.95));
    border: 1px solid rgba(212, 175, 55, 0.4);
    box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.7),
      0 0 35px rgba(212, 175, 55, 0.15);
    border-radius: 1.25rem;
    padding: 1.5rem;
    color: #e2e8f0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    border-radius: 9999px;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
    border-color: rgba(239, 68, 68, 0.4);
  }

  .modal-header {
    text-align: center;
    margin-bottom: 1rem;
  }

  .header-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.75rem;
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.4);
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #fef08a;
    margin-bottom: 0.5rem;
  }

  :global(.gold-icon) {
    color: #f59e0b;
  }

  .modal-header h2 {
    font-size: 1.35rem;
    font-weight: 700;
    background: linear-gradient(to right, #fef08a, #f59e0b, #eab308);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0.25rem 0 0.5rem;
  }

  .header-desc {
    font-size: 0.85rem;
    color: #94a3b8;
    line-height: 1.4;
    max-width: 360px;
    margin: 0 auto;
  }

  .canvas-preview-wrapper {
    margin: 0.5rem 0 1.25rem;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5);
    border-radius: 0.75rem;
    overflow: hidden;
  }

  .viral-card-canvas {
    width: 280px;
    height: 392px;
    display: block;
    border-radius: 0.75rem;
    transition: transform 0.2s ease;
  }

  .viral-card-canvas:hover {
    transform: scale(1.02);
  }

  .actions-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.6rem;
    width: 100%;
  }

  @media (min-width: 480px) {
    .actions-grid {
      grid-template-columns: 1fr 1fr;
    }
    .btn-primary-gold {
      grid-column: span 2;
    }
  }

  .btn-action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.7rem 1rem;
    border-radius: 0.65rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-primary-gold {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #020617;
    border: 1px solid #fbbf24;
    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);
  }

  .btn-primary-gold:hover {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.45);
  }

  .btn-secondary-glass {
    background: rgba(255, 255, 255, 0.06);
    color: #e2e8f0;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .btn-secondary-glass:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(212, 175, 55, 0.5);
    color: #fef08a;
  }

  .social-quick-share {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 1rem;
    font-size: 0.8rem;
    color: #94a3b8;
  }

  .social-btn {
    padding: 0.35rem 0.75rem;
    border-radius: 0.4rem;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: opacity 0.2s ease;
  }

  .social-btn:hover {
    opacity: 0.85;
  }

  .social-btn.zalo {
    background: #0068ff;
    color: white;
  }

  .social-btn.fb {
    background: #1877f2;
    color: white;
  }

  .social-btn.tele {
    background: #24a1de;
    color: white;
  }
</style>
