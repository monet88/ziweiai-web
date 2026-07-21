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

  let checkinBusy = $state(false);
  let checkinError = $state<string | null>(null);

  async function handleCheckin() {
    checkinBusy = true;
    checkinError = null;
    try {
      const res = await walletModel.checkin();
      if (!res.success) {
        checkinError = 'Không thể điểm danh lúc này, vui lòng thử lại sau.';
      }
    } catch (err) {
      checkinError = err instanceof Error ? err.message : 'Lỗi hệ thống';
    } finally {
      checkinBusy = false;
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
    <div class="left-column">
      <div class="rewards-section">
        <h2 class="section-title">Quà Tặng Hàng Ngày</h2>
        <div class="reward-card surface-glass">
          <div class="reward-info">
            <h3>Điểm danh nhận XU</h3>
            <p>Nhận ngay 5 XU mỗi ngày khi quay lại ứng dụng.</p>
            {#if checkinError}
              <p class="error-text">{checkinError}</p>
            {/if}
          </div>
          <PrimaryButton
            disabled={!walletModel.canCheckin || checkinBusy}
            onclick={handleCheckin}
          >
            {#if checkinBusy}
              Đang xử lý...
            {:else if !walletModel.canCheckin}
              Đã nhận hôm nay
            {:else}
              Nhận 5 XU
            {/if}
          </PrimaryButton>
        </div>
      </div>

      <div class="referrals-section">
        <h2 class="section-title">Giới thiệu bạn bè</h2>
        <div class="referral-card surface-glass">
          <div class="referral-info">
            <h3>Chia sẻ mã giới thiệu</h3>
            {#if walletModel.referralCode}
              <p>Gửi link này cho bạn bè. Khi họ đăng ký và điểm danh lần đầu, cả hai đều nhận được 10 XU!</p>
              <div class="ref-code-box">
                <code>https://tuvitoantap.vercel.app/?ref={walletModel.referralCode}</code>
                <PrimaryButton 
                  onclick={() => {
                    navigator.clipboard.writeText(`https://tuvitoantap.vercel.app/?ref=${walletModel.referralCode}`);
                    alert('Đã copy link giới thiệu!');
                  }}
                >
                  Copy Link
                </PrimaryButton>
              </div>
            {:else}
              <p class="loading-text">Đang tải mã giới thiệu...</p>
            {/if}
          </div>
          
          {#if walletModel.referrals.length > 0}
            <div class="referral-history">
              <h4>Lịch sử giới thiệu ({walletModel.referrals.length})</h4>
              <ul>
                {#each walletModel.referrals as ref (ref.createdAt)}
                  <li>
                    <span class="ref-date">{new Date(ref.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span class="ref-desc">Giới thiệu thành công</span>
                    <span class="ref-reward">+{ref.rewardXu} XU</span>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      </div>

      <div class="packages-section">
        <h2 class="section-title">Chọn gói XU</h2>
        <div class="packages-grid">
          {#each packages as pkg (pkg.xu)}
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
    
    .left-column {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }
    
    .payment-section {
      flex: 1.2;
      position: sticky;
      top: 100px;
    }
  }

  .left-column {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .rewards-section,
  .referrals-section {
    display: flex;
    flex-direction: column;
  }

  .reward-card {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-radius: var(--radius-lg);
    gap: 16px;
  }

  .reward-info h3 {
    margin: 0 0 4px;
    font-size: var(--text-body);
    font-weight: 700;
    color: var(--color-primary);
  }

  .reward-info p {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .error-text {
    color: var(--color-danger) !important;
    font-size: var(--text-xs) !important;
    margin-top: 4px !important;
  }

  .referral-card {
    display: flex;
    flex-direction: column;
    padding: 20px;
    border-radius: var(--radius-lg);
    gap: 20px;
  }

  .referral-info h3 {
    margin: 0 0 8px;
    font-size: var(--text-body);
    font-weight: 700;
    color: var(--color-primary);
  }

  .referral-info p {
    margin: 0 0 16px;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .ref-code-box {
    display: flex;
    gap: 12px;
    align-items: center;
    background: var(--color-bg-elevated);
    padding: 12px;
    border-radius: var(--radius-md);
    border: 1px dashed var(--color-border-subtle);
  }

  .ref-code-box code {
    flex: 1;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    word-break: break-all;
  }

  .loading-text {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    font-style: italic;
  }

  .referral-history {
    border-top: 1px solid var(--color-border-hairline);
    padding-top: 20px;
  }

  .referral-history h4 {
    margin: 0 0 12px;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .referral-history ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .referral-history li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--color-bg-surface);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
  }

  .ref-date {
    color: var(--color-text-muted);
    font-size: var(--text-xs);
    min-width: 80px;
  }

  .ref-desc {
    flex: 1;
    color: var(--color-text-primary);
  }

  .ref-reward {
    font-weight: 600;
    color: var(--color-success);
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
