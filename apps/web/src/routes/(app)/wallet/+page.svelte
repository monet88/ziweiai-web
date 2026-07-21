<script lang="ts">
  import { getAuthStore } from '$lib/auth/auth-context';
  import { AppScaffold, PrimaryButton } from '$lib/components/ui';
  import { createWalletModel } from '$lib/features/payment/wallet-model.svelte';
  import { browser } from '$app/environment';
  import { env } from '$env/dynamic/public';

  const auth = getAuthStore();
  const walletModel = createWalletModel(auth);

  // Package definitions
  const packages = [
    { xu: 20, price: 20000, label: 'Gói Cơ Bản' },
    { xu: 50, price: 50000, label: 'Gói Phổ Biến' },
    { xu: 100, price: 100000, label: 'Gói Nâng Cao' },
  ];

  let selectedPackage = $state(packages[1]); // Default to 50 XU
  let shortUuid = $derived(auth.user?.id?.substring(0, 8).toUpperCase() ?? '');
  let qrUrl = $derived.by(() => {
    if (!shortUuid) return '';
    const acc = env.PUBLIC_SEPAY_ACCOUNT || '0123456789';
    const bank = env.PUBLIC_SEPAY_BANK || 'MBBank';
    return `https://qr.sepay.vn/img?acc=${acc}&bank=${bank}&amount=${selectedPackage.price}&des=TVTT%20${shortUuid}`;
  });

  let refreshing = $state(false);

  async function handleRefresh() {
    refreshing = true;
    try {
      await walletModel.refresh();
    } finally {
      setTimeout(() => {
        refreshing = false;
      }, 1000);
    }
  }

  $effect(() => {
    if (browser && auth.user) {
      walletModel.refresh();
    }
  });
</script>

<AppScaffold
  title="Ví XU"
  subtitle="Nạp XU để sử dụng các tính năng cao cấp như Xem Tướng, Xem Tay và Luận Giải Chuyên Sâu."
>
  <div class="wallet-layout">
    <div class="packages-section">
      <h2 class="section-title">Chọn gói XU</h2>
      <div class="packages-grid">
        {#each packages as pkg}
          <button
            class="package-card"
            class:selected={selectedPackage.xu === pkg.xu}
            onclick={() => (selectedPackage = pkg)}
          >
            <div class="pkg-label">{pkg.label}</div>
            <div class="pkg-xu">{pkg.xu} XU</div>
            <div class="pkg-price">{pkg.price.toLocaleString('vi-VN')} VNĐ</div>
          </button>
        {/each}
      </div>
    </div>

    <div class="payment-section">
      <div class="surface-glass">
        <div class="payment-card">
          <h2 class="section-title">Quét mã QR để thanh toán</h2>
          <p class="instruction">Mở ứng dụng ngân hàng và quét mã QR bên dưới.</p>
          
          {#if qrUrl}
            <div class="qr-container">
              <img src={qrUrl} alt="Mã QR thanh toán SePay" class="qr-image" />
            </div>
            
            <div class="transfer-info">
              <div class="info-row">
                <span class="info-label">Số tiền:</span>
                <span class="info-value price">{selectedPackage.price.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div class="info-row">
                <span class="info-label">Nội dung chuyển khoản:</span>
                <span class="info-value highlight">TVTT {shortUuid}</span>
              </div>
              <p class="warning">
                Lưu ý: Bắt buộc ghi đúng nội dung chuyển khoản để hệ thống tự động cộng XU (1-3 phút).
              </p>
            </div>
          {/if}

          <div class="actions">
            <PrimaryButton
              disabled={refreshing}
              onclick={handleRefresh}
            >
              {refreshing ? 'Đang kiểm tra...' : 'Tôi đã chuyển khoản'}
            </PrimaryButton>
            <p class="refresh-hint">Ấn nút trên để cập nhật số dư sau khi thanh toán.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</AppScaffold>

<style>
  .wallet-layout {
    display: flex;
    flex-direction: column;
    gap: 40px;
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
  }

  @media (min-width: 800px) {
    .wallet-layout {
      flex-direction: row;
      align-items: flex-start;
    }
    
    .packages-section {
      flex: 1;
    }
    
    .payment-section {
      flex: 1.2;
      position: sticky;
      top: 100px;
    }
  }

  .section-title {
    font-size: var(--text-h3);
    font-weight: 600;
    margin: 0 0 16px;
    color: var(--color-text-primary);
  }

  .packages-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .package-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
    background: var(--color-bg-surface);
    border: 2px solid var(--color-border-hairline);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .package-card:hover {
    border-color: var(--color-border-subtle);
    background: var(--color-bg-elevated);
  }

  .package-card.selected {
    border-color: var(--color-primary);
    background: var(--color-primary-subtle);
  }

  .pkg-label {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin-bottom: 4px;
  }

  .pkg-xu {
    font-size: var(--text-h2);
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 8px;
  }
  
  .package-card.selected .pkg-xu {
    color: var(--color-primary);
  }

  .pkg-price {
    font-size: var(--text-body);
    color: var(--color-text-primary);
    font-weight: 500;
  }

  .payment-card {
    padding: 32px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .instruction {
    color: var(--color-text-secondary);
    margin-bottom: 24px;
  }

  .qr-container {
    background: white;
    padding: 16px;
    border-radius: var(--radius-md);
    margin-bottom: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .qr-image {
    width: 240px;
    height: 240px;
    object-fit: contain;
    display: block;
  }

  .transfer-info {
    width: 100%;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    padding: 16px;
    margin-bottom: 32px;
    text-align: left;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px dashed var(--color-border-hairline);
  }

  .info-row:last-of-type {
    border-bottom: none;
  }

  .info-label {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
  }

  .info-value {
    font-weight: 600;
    font-size: var(--text-body);
  }

  .info-value.price {
    color: var(--color-text-primary);
  }

  .info-value.highlight {
    color: var(--color-primary);
    font-size: var(--text-lg);
    font-weight: 700;
    letter-spacing: 1px;
  }

  .warning {
    margin-top: 12px;
    font-size: var(--text-xs);
    color: var(--color-danger);
    font-style: italic;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .refresh-hint {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .surface-glass {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-xl);
    overflow: hidden;
  }
</style>
