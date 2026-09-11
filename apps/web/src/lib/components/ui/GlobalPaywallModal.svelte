<script lang="ts">
  import { paywallStore } from '$lib/stores/paywall.svelte';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { getWalletStore } from '$lib/features/payment/wallet-context';
  import { authModalStore } from '$lib/stores/auth-modal.svelte';
  import { env } from '$env/dynamic/public';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import {
    XU_PACKAGES,
    formatVnd,
    type XuPackage
  } from '$lib/features/payment/pricing-config';
  import {
    getDefaultBank,
    type SepayBankAccount
  } from '$lib/features/payment/bank-config';
  import {
    Copy,
    Check,
    Coins,
    Zap,
    Shield,
    Sparkles,
    CheckCircle2,
    ExternalLink,
    X
  } from 'lucide-svelte';

  const auth = getAuthStore();
  const wallet = getWalletStore();

  const selectedBank: SepayBankAccount = getDefaultBank(env.PUBLIC_SEPAY_ACCOUNT);
  const packages = XU_PACKAGES;

  // Chọn gói phù hợp với số XU cần (mặc định gói 50k hoặc 100k)
  let selectedPackage = $state<XuPackage>(packages[1] || packages[0]);

  $effect(() => {
    if (paywallStore.isOpen) {
      const match = packages.find((p) => p.xu >= paywallStore.requiredXu);
      if (match) {
        selectedPackage = match;
      }
    }
  });

  let shortUuid = $derived(auth.user?.id?.substring(0, 8).toUpperCase() ?? '');
  let qrUrl = $derived.by(() => {
    if (!shortUuid) return '';
    return `https://qr.sepay.vn/img?acc=${selectedBank.accountNo}&bank=${selectedBank.bankCode}&amount=${selectedPackage.price}&des=TVTT%20${shortUuid}`;
  });

  let copiedField = $state<string | null>(null);
  let isSuccess = $state(false);

  function copyToClipboard(text: string, fieldName: string) {
    if (!browser) return;
    navigator.clipboard.writeText(text);
    copiedField = fieldName;
    setTimeout(() => {
      if (copiedField === fieldName) copiedField = null;
    }, 2000);
  }

  // Tự động kiểm tra số dư theo thời gian thực (Polling mỗi 2.5s khi modal mở)
  $effect(() => {
    if (!browser || !paywallStore.isOpen || !auth.user || auth.isAnonymous) {
      isSuccess = false;
      return;
    }

    const interval = setInterval(() => {
      if (!document.hidden && !isSuccess) {
        wallet.refresh();
      }
    }, 2500);

    return () => clearInterval(interval);
  });

  // Khi số dư vừa được nạp đủ
  $effect(() => {
    if (paywallStore.isOpen && (wallet.lastTopupEvent || (wallet.balance >= paywallStore.requiredXu && paywallStore.requiredXu > 0))) {
      isSuccess = true;
    }
  });

  function handleClose() {
    isSuccess = false;
    paywallStore.close();
  }

  function handleGoToWallet() {
    handleClose();
    goto(resolve('/wallet'));
  }

  function handleOpenAuth() {
    paywallStore.close();
    authModalStore.open('Vui lòng đăng nhập hoặc tạo tài khoản để nạp XU và mở khóa tính năng.');
  }
</script>

{#if paywallStore.isOpen}
  <div class="paywall-overlay" role="dialog" aria-modal="true" aria-labelledby="paywall-title">
    <div class="paywall-modal">
      <button class="paywall-close" aria-label="Đóng" onclick={handleClose}>
        <X size={20} />
      </button>

      {#if isSuccess}
        <!-- MÀN HÌNH NẠP THÀNH CÔNG -->
        <div class="paywall-content success-state">
          <div class="success-icon-box">
            <CheckCircle2 size={48} class="text-emerald" />
          </div>
          <h2 class="title-gold">Nạp XU Thành Công!</h2>
          <p class="paywall-message">
            Giao dịch chuyển khoản đã được ghi nhận. Số dư hiện tại của bạn là <strong>{wallet.balance} XU</strong>.
          </p>
          <div class="paywall-actions">
            <button class="btn-royal-primary" onclick={handleClose}>
              <Sparkles size={16} />
              <span>Tiếp Tục Sử Dụng Ngay</span>
            </button>
          </div>
        </div>
      {:else if !auth.user || auth.isAnonymous}
        <!-- NẾU CHƯA ĐĂNG NHẬP -->
        <div class="paywall-content">
          <div class="badge-tag">
            <Coins size={14} />
            <span>TÍNH NĂNG HOÀNG GIA</span>
          </div>
          <h2 id="paywall-title" class="title-gold">{paywallStore.featureName}</h2>
          <p class="paywall-message">
            {paywallStore.message || 'Bạn cần đăng nhập tài khoản để nhận XU khởi vận và nạp XU mở khóa tính năng.'}
          </p>
          <div class="paywall-actions">
            <button class="btn-royal-primary" onclick={handleOpenAuth}>
              <span>Đăng Nhập / Đăng Ký Tài Khoản</span>
            </button>
          </div>
        </div>
      {:else}
        <!-- ONE-CLICK TOPUP MODAL VỚI MÃ VIETQR ĐỘNG -->
        <div class="paywall-content">
          <div class="modal-header">
            <div class="badge-tag">
              <Zap size={14} class="text-celestial-gold" />
              <span>NẠP XU 1-CHẠM SIÊU TỐC</span>
            </div>
            <h2 id="paywall-title" class="title-gold">{paywallStore.featureName}</h2>
            <div class="balance-status-bar">
              <span>Số dư ví: <strong>{wallet.balance} XU</strong></span>
              <span class="divider">•</span>
              <span>Cần: <strong>{paywallStore.requiredXu} XU</strong></span>
              {#if paywallStore.requiredXu > wallet.balance}
                <span class="badge-missing">Thiếu {paywallStore.requiredXu - wallet.balance} XU</span>
              {/if}
            </div>
          </div>

          <!-- Bộ Chọn Gói Nạp XU -->
          <div class="package-picker">
            <span class="picker-label">Chọn gói nạp:</span>
            <div class="package-pills">
              {#each packages.slice(0, 3) as pkg (pkg.xu)}
                <button
                  type="button"
                  class="package-pill"
                  class:active={selectedPackage.xu === pkg.xu}
                  onclick={() => selectedPackage = pkg}
                >
                  <span class="pill-xu">{pkg.xu} XU</span>
                  <span class="pill-price">{formatVnd(pkg.price)}đ</span>
                  {#if pkg.badge}
                    <span class="pill-badge">{pkg.badge}</span>
                  {/if}
                </button>
              {/each}
            </div>
          </div>

          <!-- Khung Quét Mã VietQR Động -->
          <div class="qr-payment-box">
            <div class="qr-wrapper">
              {#if qrUrl}
                <img
                  src={qrUrl}
                  alt="Mã QR nạp XU VietQR"
                  class="vietqr-img"
                  loading="lazy"
                />
              {:else}
                <div class="qr-loading">Đang tải mã QR...</div>
              {/if}
              <div class="qr-pulse-indicator">
                <span class="pulse-dot"></span>
                <span>Chờ chuyển khoản (tự động cộng XU sau 3-5s)</span>
              </div>
            </div>

            <!-- Bảng Thông Tin Chuyển Khoản 1-Chạm -->
            <div class="transfer-info-list">
              <div class="info-row">
                <span class="info-label">Ngân hàng:</span>
                <span class="info-value">{selectedBank.shortName} ({selectedBank.fullName})</span>
              </div>

              <div class="info-row">
                <span class="info-label">Số tài khoản:</span>
                <div class="info-value-copy">
                  <code>{selectedBank.accountNo}</code>
                  <button
                    type="button"
                    class="copy-mini-btn"
                    onclick={() => copyToClipboard(selectedBank.accountNo, 'acc')}
                    title="Sao chép số tài khoản"
                  >
                    {#if copiedField === 'acc'}
                      <Check size={13} class="text-emerald" />
                    {:else}
                      <Copy size={13} />
                    {/if}
                  </button>
                </div>
              </div>

              <div class="info-row">
                <span class="info-label">Số tiền:</span>
                <div class="info-value-copy">
                  <strong class="text-gold">{formatVnd(selectedPackage.price)}đ</strong>
                  <button
                    type="button"
                    class="copy-mini-btn"
                    onclick={() => copyToClipboard(selectedPackage.price.toString(), 'amount')}
                    title="Sao chép số tiền"
                  >
                    {#if copiedField === 'amount'}
                      <Check size={13} class="text-emerald" />
                    {:else}
                      <Copy size={13} />
                    {/if}
                  </button>
                </div>
              </div>

              <div class="info-row highlight-row">
                <span class="info-label">Nội dung CK:</span>
                <div class="info-value-copy">
                  <code class="syntax-code">TVTT {shortUuid}</code>
                  <button
                    type="button"
                    class="copy-mini-btn"
                    onclick={() => copyToClipboard(`TVTT ${shortUuid}`, 'syntax')}
                    title="Sao chép nội dung chuyển khoản"
                  >
                    {#if copiedField === 'syntax'}
                      <Check size={13} class="text-emerald" />
                    {:else}
                      <Copy size={13} />
                    {/if}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <div class="security-badge">
              <Shield size={13} class="text-celestial-gold" />
              <span>Xác thực tự động bởi SePay • Bảo mật chuẩn ngân hàng</span>
            </div>
            <button type="button" class="btn-link-wallet" onclick={handleGoToWallet}>
              <span>Mở trang Ví XU & xem ưu đãi khác</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .paywall-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(5, 3, 15, 0.78);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    padding: var(--space-md);
    animation: fadeIn 0.2s ease-out;
  }

  .paywall-modal {
    background: linear-gradient(180deg, #16102b 0%, #0d091e 100%);
    border-radius: 20px;
    border: 1px solid rgba(212, 175, 55, 0.35);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6), 0 0 24px rgba(212, 175, 55, 0.15);
    width: 100%;
    max-width: 480px;
    position: relative;
    overflow: hidden;
    color: #f7eed8;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .paywall-close {
    position: absolute;
    top: 14px;
    right: 14px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(212, 175, 55, 0.2);
    color: #e8dcc4;
    cursor: pointer;
    line-height: 1;
    padding: 6px;
    border-radius: 999px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .paywall-close:hover {
    background: rgba(212, 175, 55, 0.2);
    color: #ffd700;
    transform: rotate(90deg);
  }

  .paywall-content {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .modal-header {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .badge-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(212, 175, 55, 0.12);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #ffd700;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  .title-gold {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 21px;
    font-weight: 700;
    background: linear-gradient(135deg, #ffffff 0%, #fce99f 50%, #d4af37 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .balance-status-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 13px;
    color: rgba(232, 220, 196, 0.85);
  }

  .balance-status-bar strong {
    color: #ffd700;
  }

  .divider {
    color: rgba(212, 175, 55, 0.4);
  }

  .badge-missing {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #f87171;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
  }

  /* Package Picker */
  .package-picker {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .picker-label {
    font-size: 12px;
    font-weight: 600;
    color: #e8dcc4;
  }

  .package-pills {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .package-pill {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 4px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(212, 175, 55, 0.2);
    cursor: pointer;
    transition: all 0.2s ease;
    color: #e8dcc4;
  }

  .package-pill:hover {
    border-color: rgba(212, 175, 55, 0.6);
    background: rgba(212, 175, 55, 0.08);
  }

  .package-pill.active {
    background: rgba(212, 175, 55, 0.18);
    border-color: #ffd700;
    box-shadow: 0 0 12px rgba(212, 175, 55, 0.25);
  }

  .pill-xu {
    font-weight: 700;
    font-size: 14px;
    color: #ffd700;
  }

  .pill-price {
    font-size: 11px;
    opacity: 0.8;
  }

  .pill-badge {
    position: absolute;
    top: -6px;
    right: 4px;
    background: linear-gradient(135deg, #d4af37, #f59e0b);
    color: #090615;
    font-size: 9px;
    font-weight: 800;
    padding: 1px 5px;
    border-radius: 999px;
  }

  /* QR Box */
  .qr-payment-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 14px;
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(212, 175, 55, 0.2);
  }

  @media (min-width: 440px) {
    .qr-payment-box {
      flex-direction: row;
      align-items: flex-start;
    }
  }

  .qr-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .vietqr-img {
    width: 140px;
    height: 140px;
    border-radius: 10px;
    background: #ffffff;
    padding: 6px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
  }

  .qr-loading {
    width: 140px;
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    font-size: 12px;
    color: #e8dcc4;
  }

  .qr-pulse-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10.5px;
    color: #ffd700;
  }

  .pulse-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #10b981;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% { transform: scale(0.9); opacity: 0.6; }
    50% { transform: scale(1.3); opacity: 1; }
    100% { transform: scale(0.9); opacity: 0.6; }
  }

  .transfer-info-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    font-size: 12.5px;
  }

  .info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
  }

  .highlight-row {
    background: rgba(212, 175, 55, 0.12);
    border: 1px dashed rgba(212, 175, 55, 0.4);
  }

  .info-label {
    color: rgba(232, 220, 196, 0.7);
  }

  .info-value-copy {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .info-value-copy code {
    font-family: monospace;
    font-size: 13px;
    color: #f7eed8;
  }

  .syntax-code {
    color: #ffd700 !important;
    font-weight: 700;
  }

  .text-gold {
    color: #ffd700;
  }

  :global(.text-emerald) {
    color: #34d399;
  }

  .copy-mini-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #e8dcc4;
    border-radius: 6px;
    padding: 3px 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .copy-mini-btn:hover {
    background: rgba(212, 175, 55, 0.3);
    color: #ffd700;
  }

  .modal-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding-top: 4px;
  }

  .security-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: rgba(232, 220, 196, 0.7);
  }

  .btn-link-wallet {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: #ffd700;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: opacity 0.2s;
  }

  .btn-link-wallet:hover {
    opacity: 0.8;
  }

  /* Success & Unauthenticated States */
  .success-state {
    text-align: center;
    align-items: center;
    padding: 40px 24px;
    gap: 16px;
  }

  .success-icon-box {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .paywall-message {
    margin: 0;
    color: rgba(232, 220, 196, 0.85);
    font-size: 14px;
    line-height: 1.5;
    text-align: center;
  }

  .paywall-actions {
    margin-top: 8px;
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .btn-royal-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px 20px;
    border-radius: 12px;
    background: linear-gradient(135deg, #d4af37 0%, #f59e0b 100%);
    border: 1px solid #ffe57f;
    color: #090615;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(212, 175, 55, 0.35);
    transition: all 0.2s ease;
  }

  .btn-royal-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.5);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
