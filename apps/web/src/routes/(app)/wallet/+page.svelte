<script lang="ts">
  import { getAuthStore } from '$lib/auth/auth-context';
  import { AppScaffold, PrimaryButton } from '$lib/components/ui';
  import { createWalletModel } from '$lib/features/payment/wallet-model.svelte';
  import { browser } from '$app/environment';
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import { Copy, Check, RefreshCw } from 'lucide-svelte';

  const auth = getAuthStore();
  const walletModel = createWalletModel(auth);

  const accountNo = env.PUBLIC_SEPAY_ACCOUNT || '0123456789';
  const bankName = env.PUBLIC_SEPAY_BANK || 'MBBank';

  // Package definitions
  const packages = [
    { xu: 20, price: 20000, label: 'Gói Cơ Bản', badge: null },
    { xu: 50, price: 50000, label: 'Gói Phổ Biến', badge: 'Bán Chạy' },
    { xu: 120, price: 100000, label: 'Gói Nâng Cao', badge: '+20% XU' },
    { xu: 600, price: 500000, label: 'Gói Thưởng Lớn', badge: '+20% XU' },
  ];

  let selectedPackage = $state(packages[1]); // Default to 50 XU
  let shortUuid = $derived(auth.user?.id?.substring(0, 8).toUpperCase() ?? '');
  let qrUrl = $derived.by(() => {
    if (!shortUuid) return '';
    return `https://qr.sepay.vn/img?acc=${accountNo}&bank=${bankName}&amount=${selectedPackage.price}&des=TVTT%20${shortUuid}`;
  });

  let refreshing = $state(false);
  let copiedField = $state<string | null>(null);

  function copyToClipboard(text: string, fieldName: string) {
    if (!browser) return;
    navigator.clipboard.writeText(text);
    copiedField = fieldName;
    setTimeout(() => {
      if (copiedField === fieldName) copiedField = null;
    }, 2000);
  }

  async function handleRefresh() {
    refreshing = true;
    try {
      await walletModel.refresh();
    } finally {
      setTimeout(() => {
        refreshing = false;
      }, 800);
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

  onMount(() => {
    walletModel.subscribe();

    // Auto-polling every 5s while wallet page is active
    const interval = setInterval(() => {
      if (browser && auth.user && !auth.isAnonymous) {
        walletModel.refresh();
      }
    }, 5000);

    return () => {
      walletModel.unsubscribe();
      clearInterval(interval);
    };
  });

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
  {#snippet action()}
    <a href="/" class="btn-back-home">
      ← Trang chủ
    </a>
  {/snippet}

  <div class="wallet-layout">
    <div class="left-column">
      {#if auth.isAnonymous}
        <div class="anon-notice-banner surface-glass">
          <div class="anon-notice-text">
            <h3>🔒 Bạn đang sử dụng tài khoản vãng lai</h3>
            <p>Đăng nhập bằng Email để Điểm danh nhận 5 XU hàng ngày, tự động lưu lịch sử giao dịch và bảo vệ số dư XU của bạn!</p>
          </div>
          <a href="/sign-in" class="btn-anon-login">Đăng nhập ngay</a>
        </div>
      {/if}

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
            disabled={!walletModel.canCheckin || checkinBusy || auth.isAnonymous}
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
              <p>Gửi link này cho bạn bè. Khi họ đăng nhập và điểm danh lần đầu (ever), bạn nhận +10 XU và họ nhận +15 XU (điểm danh +5 kèm thưởng giới thiệu +10).</p>
              <div class="ref-code-box">
                <code>https://tuvitoantap.pages.dev/?ref={walletModel.referralCode}</code>
                <PrimaryButton 
                  onclick={() => {
                    copyToClipboard(`https://tuvitoantap.pages.dev/?ref=${walletModel.referralCode}`, 'refLink');
                  }}
                >
                  {#if copiedField === 'refLink'}
                    <Check size={14} /> Đã Copy
                  {:else}
                    <Copy size={14} /> Copy Link
                  {/if}
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
              <div class="pkg-header">
                <span class="pkg-label">{pkg.label}</span>
                {#if pkg.badge}
                  <span class="pkg-badge">{pkg.badge}</span>
                {/if}
              </div>
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
          <div class="payment-header">
            <h2 class="section-title">Quét mã QR để thanh toán</h2>
            <div class="live-pulse-badge">
              <span class="pulse-dot"></span>
              <span>Đang chờ chuyển khoản...</span>
            </div>
          </div>
          <p class="instruction">Mở app Ngân hàng (MBBank, Vietcombank, Momo...) quét mã QR để thanh toán tự động.</p>
          
          {#if qrUrl}
            <div class="qr-container">
              <img src={qrUrl} alt="Mã QR thanh toán SePay" class="qr-image" />
            </div>
            
            <div class="transfer-info">
              <div class="info-row">
                <span class="info-label">Ngân hàng:</span>
                <span class="info-value">{bankName}</span>
              </div>

              <div class="info-row">
                <span class="info-label">Số tài khoản:</span>
                <div class="info-value-group">
                  <span class="info-value">{accountNo}</span>
                  <button 
                    type="button" 
                    class="btn-copy-small" 
                    onclick={() => copyToClipboard(accountNo, 'accountNo')}
                    aria-label="Copy số tài khoản"
                  >
                    {#if copiedField === 'accountNo'}
                      <Check size={14} class="text-success" />
                    {:else}
                      <Copy size={14} />
                    {/if}
                  </button>
                </div>
              </div>

              <div class="info-row">
                <span class="info-label">Số tiền:</span>
                <div class="info-value-group">
                  <span class="info-value price">{selectedPackage.price.toLocaleString('vi-VN')} VNĐ</span>
                  <button 
                    type="button" 
                    class="btn-copy-small" 
                    onclick={() => copyToClipboard(selectedPackage.price.toString(), 'price')}
                    aria-label="Copy số tiền"
                  >
                    {#if copiedField === 'price'}
                      <Check size={14} class="text-success" />
                    {:else}
                      <Copy size={14} />
                    {/if}
                  </button>
                </div>
              </div>

              <div class="info-row">
                <span class="info-label">Nội dung CK:</span>
                <div class="info-value-group">
                  <span class="info-value highlight">TVTT {shortUuid}</span>
                  <button 
                    type="button" 
                    class="btn-copy-small btn-copy-highlight" 
                    onclick={() => copyToClipboard(`TVTT ${shortUuid}`, 'content')}
                    aria-label="Copy nội dung chuyển khoản"
                  >
                    {#if copiedField === 'content'}
                      <Check size={14} class="text-success" />
                    {:else}
                      <Copy size={14} />
                    {/if}
                  </button>
                </div>
              </div>

              <p class="warning">
                ⚠️ Lưu ý: Bắt buộc giữ nguyên nội dung <strong>TVTT {shortUuid}</strong> để hệ thống tự động cộng XU trong 1-3 phút.
              </p>
            </div>
          {/if}

          <div class="actions">
            <PrimaryButton
              disabled={refreshing}
              onclick={handleRefresh}
            >
              {#if refreshing}
                <RefreshCw size={16} class="spin-icon" /> Đang kiểm tra số dư...
              {:else}
                Tôi đã chuyển khoản
              {/if}
            </PrimaryButton>
            <p class="refresh-hint">Hệ thống tự động cộng XU ngay khi nhận tiền từ VietQR.</p>
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

  .pkg-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-bottom: 4px;
  }

  .pkg-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    background: var(--color-accent-primary);
    color: var(--color-text-on-primary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .payment-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .live-pulse-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: var(--radius-pill);
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: var(--color-success, #22c55e);
    font-size: var(--text-xs);
    font-weight: 600;
    margin-bottom: 8px;
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--color-success, #22c55e);
    box-shadow: 0 0 0 rgba(34, 197, 94, 0.4);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
    }
    70% {
      box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
    }
  }

  .info-value-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-copy-small {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-hairline);
    background: var(--color-bg-surface);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
  }

  .btn-copy-small:hover {
    background: var(--color-bg-elevated);
    color: var(--color-primary);
    border-color: var(--color-primary);
  }

  .btn-copy-highlight {
    border-color: var(--color-primary-subtle);
    background: var(--color-primary-subtle);
    color: var(--color-primary);
  }

  .text-success {
    color: var(--color-success, #22c55e);
  }

  :global(.spin-icon) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
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

  /* Uses shared .surface-glass from tokens.css; local radius/overflow only. */
  .surface-glass {
    border-radius: var(--radius-xl);
    overflow: hidden;
  }

  .btn-back-home {
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    border-radius: var(--radius-pill);
    border: 1px solid var(--overlay-border-strong);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .btn-back-home:hover {
    background: var(--overlay-surface-veil);
    border-color: var(--color-accent-primary);
  }

  .anon-notice-banner {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
    border-radius: var(--radius-lg);
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.3);
    margin-bottom: 8px;
  }

  .anon-notice-text h3 {
    margin: 0 0 4px;
    font-size: 15px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .anon-notice-text p {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  .btn-anon-login {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    background: var(--color-accent-primary);
    color: var(--color-text-on-primary);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    align-self: flex-start;
    transition: opacity 0.2s ease;
  }

  .btn-anon-login:hover {
    opacity: 0.9;
  }
</style>
