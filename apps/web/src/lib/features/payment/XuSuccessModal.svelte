<script lang="ts">
  import { browser } from '$app/environment';
  import { Coins, ArrowRight, X, ShieldCheck, Crown, Sparkles } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { resolveVipPromotion } from './vip-tier';

  interface Props {
    show: boolean;
    addedXu: number;
    newBalance: number;
    onClose: () => void;
  }

  let { show, addedXu, newBalance, onClose }: Props = $props();

  let vipPromo = $derived(resolveVipPromotion(addedXu));

  // Tạo 28 hạt pháo hoa đồng tiền vàng
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    angle: (i * 360) / 28,
    distance: 100 + (i % 5) * 35,
    delay: (i % 6) * 0.08,
    size: 8 + (i % 4) * 4,
  }));

  function handleExplore() {
    onClose();
    if (browser) {
      goto(resolve('/'));
    }
  }
</script>

{#if show}
  <div
    class="modal-backdrop"
    onclick={onClose}
    onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
    role="presentation"
  >
    <div
      class="success-modal celestial-card-glass"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="-1"
    >
      <!-- Pháo hoa XU vàng kim bùng nổ -->
      <div class="confetti-container" aria-hidden="true">
        {#each particles as p (p.id)}
          <span
            class="coin-particle"
            style="
              --angle: {p.angle}deg;
              --distance: {p.distance}px;
              --delay: {p.delay}s;
              --size: {p.size}px;
            "
          >
            🪙
          </span>
        {/each}
      </div>

      <!-- Nút đóng góc phải -->
      <button type="button" class="btn-close" onclick={onClose} aria-label="Đóng">
        <X size={18} />
      </button>

      {#if vipPromo.isVip}
        <!-- Biểu tượng Vương Miện Hội Viên Hoàng Thân VIP -->
        <div class="hero-coin-wrapper hero-vip-wrapper">
          <div class="coin-aura vip-aura"></div>
          <div class="coin-icon-ring vip-ring">
            <Crown size={48} class="gold-crown-svg" />
          </div>
        </div>

        <!-- Tiêu đề Thăng Hạng VIP Hoàng Gia -->
        <div class="modal-header">
          <span class="sub-badge vip-badge-royal">
            <Sparkles size={14} /> {vipPromo.vipBadge}
          </span>
          <h2 id="modal-title" class="title-gold vip-title">{vipPromo.vipTitle}</h2>
          <p class="subtitle vip-sub">{vipPromo.vipDescription}</p>
        </div>
      {:else}
        <!-- Biểu tượng Đồng Tiền Vàng Khâm Thiên Bảo Giám -->
        <div class="hero-coin-wrapper">
          <div class="coin-aura"></div>
          <div class="coin-icon-ring">
            <Coins size={44} class="gold-coin-svg" />
          </div>
        </div>

        <!-- Tiêu đề Hoàng Gia -->
        <div class="modal-header">
          <span class="sub-badge">
            <ShieldCheck size={14} /> Giao dịch VietQR Hoàn Tất
          </span>
          <h2 id="modal-title" class="title-gold">Nạp XU Thành Công!</h2>
          <p class="subtitle">Thiên cơ hanh thông, ví bản mệnh của bạn đã được tiếp thêm năng lượng.</p>
        </div>
      {/if}

      <!-- Hộp Số XU Nạp -->
      <div class="reward-box">
        <div class="reward-amount">
          <span class="plus">+</span>
          <span class="num">{addedXu}</span>
          <span class="unit">XU</span>
        </div>
        <div class="new-balance">
          <span>Số dư hiện tại:</span>
          <strong>{newBalance} XU</strong>
        </div>
      </div>

      <!-- Các Nút Hành Động -->
      <div class="modal-actions">
        <button type="button" class="btn-primary-gold" onclick={handleExplore}>
          <span>Khám Phá Vận Mệnh Ngay</span>
          <ArrowRight size={16} />
        </button>
        <button type="button" class="btn-secondary" onclick={onClose}>
          Đóng và Ở lại Ví
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(5, 3, 14, 0.8);
    backdrop-filter: blur(12px);
    animation: fadeIn 0.3s ease-out forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .success-modal {
    position: relative;
    width: 100%;
    max-width: 440px;
    padding: 36px 28px 28px;
    border-radius: 24px;
    background: linear-gradient(135deg, rgba(28, 18, 56, 0.95) 0%, rgba(13, 8, 30, 0.98) 100%);
    border: 1.5px solid rgba(212, 175, 55, 0.5);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(245, 158, 11, 0.25), inset 0 0 30px rgba(212, 175, 55, 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    overflow: hidden;
    animation: scaleUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  @keyframes scaleUp {
    from {
      opacity: 0;
      transform: scale(0.85) translateY(20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  /* Pháo hoa Confetti Vàng */
  .confetti-container {
    position: absolute;
    top: 30%;
    left: 50%;
    width: 0;
    height: 0;
    pointer-events: none;
    z-index: 10;
  }

  .coin-particle {
    position: absolute;
    font-size: var(--size, 12px);
    opacity: 0;
    animation: explode 1.4s ease-out var(--delay, 0s) forwards;
  }

  @keyframes explode {
    0% {
      opacity: 1;
      transform: translate(0, 0) scale(0.5) rotate(0deg);
    }
    60% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform:
        rotate(var(--angle))
        translateX(var(--distance))
        rotate(calc(-1 * var(--angle) + 720deg))
        scale(1.2);
    }
  }

  .btn-close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 20;
  }

  .btn-close:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    transform: rotate(90deg);
  }

  .hero-coin-wrapper {
    position: relative;
    margin-bottom: 20px;
    z-index: 2;
  }

  .coin-aura {
    position: absolute;
    inset: -20px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.5) 0%, transparent 70%);
    animation: pulseAura 2s ease-in-out infinite;
  }

  @keyframes pulseAura {
    0%, 100% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(1.25); opacity: 0.9; }
  }

  .coin-icon-ring {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #fef3c7 0%, #f59e0b 50%, #b45309 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 25px rgba(245, 158, 11, 0.8), inset 0 2px 4px rgba(255, 255, 255, 0.8);
    animation: floatCoin 2.5s ease-in-out infinite;
  }

  @keyframes floatCoin {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }

  :global(.gold-coin-svg) {
    color: #78350f;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .modal-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
  }

  .sub-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    background: rgba(34, 197, 94, 0.15);
    border: 1px solid rgba(74, 222, 128, 0.4);
    color: #4ade80;
  }

  .title-gold {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.01em;
    background: linear-gradient(135deg, #fffbeb 0%, #fbbf24 50%, #f59e0b 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 20px rgba(251, 191, 36, 0.4);
  }

  .subtitle {
    margin: 0;
    font-size: 13.5px;
    color: #d1d5db;
    line-height: 1.5;
  }

  .reward-box {
    width: 100%;
    padding: 16px;
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(212, 175, 55, 0.25);
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .reward-amount {
    display: flex;
    align-items: baseline;
    gap: 4px;
    color: #fbbf24;
  }

  .reward-amount .plus {
    font-size: 24px;
    font-weight: 700;
  }

  .reward-amount .num {
    font-size: 38px;
    font-weight: 900;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 16px rgba(251, 191, 36, 0.6);
  }

  .reward-amount .unit {
    font-size: 18px;
    font-weight: 800;
  }

  .new-balance {
    display: flex;
    gap: 6px;
    font-size: 13px;
    color: #9ca3af;
  }

  .new-balance strong {
    color: #fef08a;
  }

  .modal-actions {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .btn-primary-gold {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 13px 20px;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 700;
    color: #78350f;
    background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 50%, #f59e0b 100%);
    border: 1px solid #fef08a;
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.25s ease;
  }

  .btn-primary-gold:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(245, 158, 11, 0.6);
  }

  .btn-secondary {
    width: 100%;
    padding: 10px 16px;
    border-radius: 12px;
    font-size: 13.5px;
    font-weight: 600;
    color: #9ca3af;
    background: transparent;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    color: #e5e7eb;
    background: rgba(255, 255, 255, 0.05);
  }

  /* Dual Theme: Light Mode */
  :global([data-theme="light"]) .success-modal {
    background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
    border-color: rgba(180, 83, 9, 0.3);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15), 0 0 30px rgba(245, 158, 11, 0.2);
  }

  :global([data-theme="light"]) .title-gold {
    background: linear-gradient(135deg, #78350f 0%, #b45309 60%, #92400e 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: none;
  }

  :global([data-theme="light"]) .subtitle {
    color: #4b5563;
  }

  :global([data-theme="light"]) .reward-box {
    background: #fef3c7;
    border-color: rgba(180, 83, 9, 0.2);
  }

  :global([data-theme="light"]) .reward-amount {
    color: #92400e;
  }

  :global([data-theme="light"]) .reward-amount .num {
    text-shadow: none;
  }

  :global([data-theme="light"]) .new-balance {
    color: #6b7280;
  }

  :global([data-theme="light"]) .new-balance strong {
    color: #78350f;
  }

  :global([data-theme="light"]) .btn-secondary {
    color: #6b7280;
  }

  :global([data-theme="light"]) .btn-secondary:hover {
    color: #111827;
    background: #f3f4f6;
  }

  /* VIP Royal Upgrade Enhancements */
  .hero-vip-wrapper .vip-aura {
    background: radial-gradient(circle, rgba(234, 179, 8, 0.4) 0%, rgba(168, 85, 247, 0.2) 60%, transparent 80%);
    filter: blur(24px);
  }

  .hero-vip-wrapper .vip-ring {
    background: linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%);
    box-shadow: 0 0 35px rgba(234, 179, 8, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.8);
    animation: vipPulse 2.5s infinite ease-in-out;
  }

  :global(.gold-crown-svg) {
    color: #78350f;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }

  .vip-badge-royal {
    background: linear-gradient(90deg, rgba(234, 179, 8, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%);
    border: 1px solid rgba(234, 179, 8, 0.5);
    color: #ca8a04;
    font-weight: 800;
  }

  :global(.dark) .vip-badge-royal {
    color: #fef08a;
    border-color: rgba(234, 179, 8, 0.6);
  }

  .vip-title {
    font-size: 24px;
    letter-spacing: -0.01em;
  }

  .vip-sub {
    color: var(--color-text-secondary, #475569);
    font-weight: 500;
  }

  :global(.dark) .vip-sub {
    color: #cbd5e1;
  }

  @keyframes vipPulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 30px rgba(234, 179, 8, 0.4);
    }
    50% {
      transform: scale(1.06);
      box-shadow: 0 0 45px rgba(234, 179, 8, 0.7);
    }
  }
</style>
