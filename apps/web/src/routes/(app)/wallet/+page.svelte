<script lang="ts">
  import { getAuthStore } from '$lib/auth/auth-context';
  import { AppScaffold, PrimaryButton } from '$lib/components/ui';
  import { getWalletStore } from '$lib/features/payment/wallet-context';
  import { browser } from '$app/environment';
  import { env } from '$env/dynamic/public';
  import { authModalStore } from '$lib/stores/auth-modal.svelte';
  import XuSuccessModal from '$lib/features/payment/XuSuccessModal.svelte';
  import { onMount } from 'svelte';
  import ViralReferralCardModal from '$lib/features/referral/ViralReferralCardModal.svelte';
  import TurnstileWidget from '$lib/components/security/TurnstileWidget.svelte';
  import { page } from '$app/state';
  import {
    XU_PACKAGES,
    FEATURE_COSTS,
    findPackageByXu,
    getDefaultPackage,
    type XuPackage
  } from '$lib/features/payment/pricing-config';
  import {
    Copy,
    Check,
    RefreshCw,
    Coins,
    Gift,
    Sparkles,
    Share2,
    ShieldCheck,
    AlertCircle,
    Users,
    CreditCard,
    Zap,
    CheckCircle2,
    Lock
  } from 'lucide-svelte';

  import {
    getDefaultBank,
    type SepayBankAccount
  } from '$lib/features/payment/bank-config';

  const auth = getAuthStore();
  const walletModel = getWalletStore();

  const selectedBank: SepayBankAccount = getDefaultBank(env.PUBLIC_SEPAY_ACCOUNT);

  const packages = XU_PACKAGES;

  const costIconMap: Record<string, any> = {
    deep_explanation: Sparkles,
    face_palm_vision: Zap,
    iching_divination: CreditCard,
    tarot_lenormand: Gift,
    chart_creation: CheckCircle2,
    annual_report: Sparkles
  };

  const featureCosts = FEATURE_COSTS.map((item) => ({
    ...item,
    icon: costIconMap[item.id] || Sparkles
  }));

  let selectedPackage = $state<XuPackage>(getDefaultPackage());

  // Check URL query param ?package=
  $effect(() => {
    const pkgParam = page.url.searchParams.get('package');
    const pkgFromQuery = findPackageByXu(pkgParam);
    if (pkgFromQuery && pkgFromQuery.xu !== selectedPackage.xu) {
      selectedPackage = pkgFromQuery;
    }
  });
  let shortUuid = $derived(auth.user?.id?.substring(0, 8).toUpperCase() ?? '');
  let qrUrl = $derived.by(() => {
    if (!shortUuid) return '';
    return `https://qr.sepay.vn/img?acc=${selectedBank.accountNo}&bank=${selectedBank.bankCode}&amount=${selectedPackage.price}&des=TVTT%20${shortUuid}`;
  });

  let refreshing = $state(false);
  let copiedField = $state<string | null>(null);
  let showViralModal = $state(false);
  let turnstileWidget = $state<any>(null);

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
      const turnstileToken = await turnstileWidget?.execute?.();
      const res = await walletModel.checkin(turnstileToken);
      if (!res.success) {
        checkinError = 'Không thể điểm danh lúc này, vui lòng thử lại sau.';
      }
    } catch (err) {
      checkinError = err instanceof Error ? err.message : 'Lỗi hệ thống';
    } finally {
      checkinBusy = false;
    }
  }

  function shareOnFacebook(url: string) {
    if (!browser) return;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
  }

  function shareOnTelegram(url: string, text: string) {
    if (!browser) return;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  function shareOnZalo(url: string) {
    if (!browser) return;
    window.open(`https://sp.zalo.me/share_inline?link=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
  }

  onMount(() => {
    walletModel.subscribe();
    // Auto-polling every 2.5s while wallet page is active and visible
    const interval = setInterval(() => {
      if (browser && auth.user && !auth.isAnonymous && !document.hidden) {
        walletModel.refresh();
      }
    }, 2500);

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
  title="Ví XU & Điểm Danh"
  subtitle="Nạp XU tự động qua VietQR để mở khoá Luận Giải AI Chuyên Sâu, Xem Tướng và Gieo Quẻ."
>
  <div class="wallet-page-wrapper">
    <!-- Top Hero Overview Card -->
    <section class="hero-overview-card glass-panel">
      <div class="balance-meta">
        <div class="balance-icon-ring">
          <Coins size={28} class="gold-icon" />
        </div>
        <div class="balance-details">
          <div class="balance-label">
            <span>Số dư Ví hiện tại</span>
            {#if auth.isAnonymous}
              <span class="user-tier-tag anon"><Lock size={12} /> Tài khoản vãng lai</span>
            {:else}
              <span class="user-tier-tag member"><ShieldCheck size={12} /> Thành viên Email</span>
            {/if}
          </div>
          <div class="balance-amount">
            <span class="num">{walletModel.balance}</span>
            <span class="unit">XU</span>
          </div>
        </div>
      </div>

      <!-- Quick Checkin Widget -->
      <div class="hero-checkin-box">
        <div class="checkin-info">
          <div class="checkin-title">
            <Gift size={18} class="text-gold" />
            <strong>Điểm Danh Hàng Ngày</strong>
          </div>
          <p>Nhận ngay <strong>+5 XU</strong> mỗi ngày khi đăng nhập vào ViOS</p>
          {#if checkinError}
            <p class="error-text">{checkinError}</p>
          {/if}
        </div>

        <PrimaryButton
          disabled={!walletModel.canCheckin || checkinBusy || auth.isAnonymous}
          onclick={handleCheckin}
        >
          {#if checkinBusy}
            <RefreshCw size={14} class="spin-icon" /> Đang nhận...
          {:else if !walletModel.canCheckin}
            <Check size={14} /> Đã nhận hôm nay
          {:else if auth.isAnonymous}
            Đăng nhập để nhận
          {:else}
            <Gift size={14} /> Nhận 5 XU
          {/if}
        </PrimaryButton>
      </div>
    </section>

    <!-- Main Content 2-Column Grid -->
    <div class="wallet-grid">
      <!-- Left Column: Packages, Costs, Referral -->
      <div class="left-pane">
        {#if auth.isAnonymous}
          <div class="anon-warning-card glass-panel">
            <AlertCircle size={24} class="warning-icon" />
            <div class="warning-content">
              <h3>Bạn đang dùng tài khoản vãng lai</h3>
              <p>Hãy đăng nhập bằng Email để giữ bảo mật số dư XU bền vững và nhận 5 XU điểm danh mỗi ngày!</p>
            </div>
            <a href="/sign-in" class="btn-anon-login">Đăng nhập ngay</a>
          </div>
        {/if}

        <!-- Section 1: Choose XU Package -->
        <section class="packages-section">
          <div class="section-header">
            <h2><Coins size={20} class="text-gold" /> Chọn gói nạp XU</h2>
            <span class="sub-tag">Nạp tự động qua VietQR</span>
          </div>

          <div class="packages-grid">
            {#each packages as pkg (pkg.xu)}
              <button
                type="button"
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
                <div class="pkg-main">
                  <span class="pkg-xu">{pkg.xu} <small>XU</small></span>
                  <span class="pkg-price">{pkg.price.toLocaleString('vi-VN')} VNĐ</span>
                </div>
                <div class="pkg-footer">
                  <span>{pkg.desc}</span>
                </div>
              </button>
            {/each}
          </div>
        </section>

        <!-- Section 2: XU Feature Costs Table -->
        <section class="costs-section glass-panel">
          <div class="section-header">
            <h2><Sparkles size={20} class="text-gold" /> Bảng giá sử dụng XU</h2>
          </div>
          <div class="costs-list">
            {#each featureCosts as item (item.name)}
              <div class="cost-item">
                <div class="cost-item-left">
                  <item.icon size={16} class="cost-icon" />
                  <span class="cost-name">{item.name}</span>
                </div>
                <div class="cost-item-right">
                  <span class="cost-tag">{item.tag}</span>
                  <span class="cost-val">{item.cost}</span>
                </div>
              </div>
            {/each}
          </div>
        </section>

        <!-- Section 3: Referrals -->
        <section class="referral-section glass-panel">
          <div class="section-header">
            <h2><Users size={20} class="text-gold" /> Giới thiệu bạn bè nhận XU</h2>
          </div>
          <p class="referral-desc">
            Chia sẻ link giới thiệu của bạn. Khi người mới đăng nhập & điểm danh lần đầu, bạn nhận <strong>+10 XU</strong> và người đó nhận tổng <strong>15 XU</strong> (+5 điểm danh +10 thưởng giới thiệu).
          </p>

          {#if walletModel.referralCode}
            <div class="ref-link-box">
              <input
                type="text"
                readonly
                value={`https://tuvitoantap.vercel.app/share/ref/${walletModel.referralCode}`}
                class="ref-input"
              />
              <button
                type="button"
                class="btn-copy-ref"
                onclick={() => copyToClipboard(`https://tuvitoantap.vercel.app/share/ref/${walletModel.referralCode}`, 'refLink')}
              >
                {#if copiedField === 'refLink'}
                  <Check size={14} /> Đã Copy
                {:else}
                  <Copy size={14} /> Copy Link
                {/if}
              </button>
            </div>

            <!-- Social Share Bar -->
            <div class="social-share-bar">
              <span class="share-label"><Share2 size={14} /> Chia sẻ nhanh:</span>
              <button
                type="button"
                class="btn-share-social zalo"
                onclick={() => shareOnZalo(`https://tuvitoantap.vercel.app/share/ref/${walletModel.referralCode}`)}
              >
                Zalo
              </button>
              <button
                type="button"
                class="btn-share-social facebook"
                onclick={() => shareOnFacebook(`https://tuvitoantap.vercel.app/share/ref/${walletModel.referralCode}`)}
              >
                Facebook
              </button>
              <button
                type="button"
                class="btn-share-social telegram"
                onclick={() => shareOnTelegram(`https://tuvitoantap.vercel.app/share/ref/${walletModel.referralCode}`, 'Tham gia ViOS ngay để nhận XU thưởng Tử Vi & Chiêm Tinh AI!')}
              >
                Telegram
              </button>
            </div>
          {:else}
            <p class="loading-text">Đang tải mã giới thiệu...</p>
          {/if}

          <!-- Nút Tạo Thiệp Mời Celestial Luxury -->
          <button
            type="button"
            class="btn-open-viral-card"
            onclick={() => (showViralModal = true)}
          >
            <Sparkles size={16} class="gold-icon" />
            <span>Tạo Thiệp Mời Celestial Luxury (QR + Ảnh Đẹp)</span>
          </button>

          <!-- 2 thẻ KPI thống kê Referral -->
          <div class="referral-stats-grid">
            <div class="ref-stat-card">
              <span class="ref-stat-icon">👥</span>
              <div class="ref-stat-info">
                <span class="ref-stat-label">Bạn bè đã mời</span>
                <span class="ref-stat-value">{walletModel.referrals.length} bạn</span>
              </div>
            </div>
            <div class="ref-stat-card">
              <span class="ref-stat-icon">🪙</span>
              <div class="ref-stat-info">
                <span class="ref-stat-label">Tổng XU nhận được</span>
                <span class="ref-stat-value highlight">{walletModel.referrals.reduce((sum, r) => sum + (r.rewardXu || 10), 0)} XU</span>
              </div>
            </div>
          </div>

          {#if walletModel.referrals.length > 0}
            <div class="referral-history">
              <h4>Lịch sử bạn bè kích hoạt ({walletModel.referrals.length})</h4>
              <div class="ref-list">
                {#each walletModel.referrals as ref (ref.createdAt)}
                  <div class="ref-item">
                    <div class="ref-item-main">
                      <span class="ref-date">
                        {new Date(ref.createdAt).toLocaleDateString('vi-VN')} {new Date(ref.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span class="ref-desc">
                        Bạn mới ({ref.refereeEmailMasked || 'ẩn danh'}) đã kích hoạt thành công
                      </span>
                    </div>
                    <span class="ref-reward">+{ref.rewardXu} XU</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </section>
      </div>

      <!-- Right Column: Sticky Payment VietQR SePay -->
      <aside class="right-pane sticky-pane">
        <div class="payment-card glass-panel">
          <div class="payment-header">
            <h3>Thanh Toán Qua VietQR</h3>
            <div class="live-pulse-badge">
              <span class="pulse-dot"></span>
              <span>Đang chờ chuyển khoản</span>
            </div>
          </div>
          
          {#if auth.isAnonymous}
            <div class="anon-block-box" style="padding: 24px; text-align: center;">
              <Lock size={48} style="color: var(--color-text-muted); margin-bottom: 16px; opacity: 0.5;" />
              <p style="margin-bottom: 16px; font-size: 14px; color: var(--color-text-secondary);">Bạn cần tạo tài khoản để nạp XU. Điều này giúp bảo vệ số dư của bạn an toàn, không bị mất khi đổi trình duyệt hoặc thiết bị.</p>
              <PrimaryButton 
                label="Đăng nhập / Đăng ký" 
                onclick={() => authModalStore.open('Vui lòng đăng nhập hoặc tạo tài khoản để nạp XU an toàn.')} 
              />
            </div>
          {:else}
            <p class="instruction">Quét mã QR bằng ứng dụng Ngân hàng (ACB, Vietcombank, Momo, MB, Techcombank...) để thanh toán tự động.</p>

          {#if qrUrl}
            <div class="qr-frame">
              <img src={qrUrl} alt="Mã QR thanh toán SePay" class="qr-image" />
            </div>

            <div class="transfer-info-box">
              <div class="info-row">
                <span class="info-label">Ngân hàng</span>
                <span class="info-val">{selectedBank.fullName}</span>
              </div>

              <div class="info-row">
                <span class="info-label">Chủ tài khoản</span>
                <span class="info-val owner-name">{selectedBank.accountName}</span>
              </div>

              <div class="info-row">
                <span class="info-label">Số tài khoản</span>
                <div class="info-val-group">
                  <span class="info-val account-num">{selectedBank.accountNo}</span>
                  <button
                    type="button"
                    class="btn-copy-small"
                    onclick={() => copyToClipboard(selectedBank.accountNo, 'accountNo')}
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
                <span class="info-label">Số tiền</span>
                <div class="info-val-group">
                  <span class="info-val price">{selectedPackage.price.toLocaleString('vi-VN')} VNĐ</span>
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

              <div class="info-row highlight-row">
                <span class="info-label">Nội dung CK</span>
                <div class="info-val-group">
                  <span class="info-val highlight">TVTT {shortUuid}</span>
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

              <button
                type="button"
                class="btn-copy-all"
                onclick={() =>
                  copyToClipboard(
                    `Ngân hàng: ${selectedBank.fullName}\nChủ TK: ${selectedBank.accountName}\nSTK: ${selectedBank.accountNo}\nSố tiền: ${selectedPackage.price.toLocaleString('vi-VN')} VNĐ\nNội dung: TVTT ${shortUuid}`,
                    'copyAll'
                  )}
              >
                {#if copiedField === 'copyAll'}
                  <Check size={16} /> Đã sao chép tất cả thông tin!
                {:else}
                  <Copy size={16} /> Sao chép tất cả thông tin CK
                {/if}
              </button>

              <p class="warning-text">
                ⚠️ Bắt buộc giữ nguyên nội dung <strong>TVTT {shortUuid}</strong> để hệ thống tự động cộng XU trong 1 - 3 phút.
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
            <p class="refresh-hint">Ví sẽ tự động cập nhật ngay khi nhận được tín hiệu từ VietQR.</p>
          </div>
          {/if}
        </div>
      </aside>
    </div>
  </div>

  <XuSuccessModal
    show={!!walletModel.lastTopupEvent}
    addedXu={walletModel.lastTopupEvent?.added ?? 0}
    newBalance={walletModel.lastTopupEvent?.newBalance ?? 0}
    onClose={() => walletModel.clearTopupEvent()}
  />

  <ViralReferralCardModal
    isOpen={showViralModal}
    referralCode={walletModel.referralCode || shortUuid || 'VIP8888'}
    onClose={() => (showViralModal = false)}
  />

  <TurnstileWidget bind:this={turnstileWidget} action="wallet_checkin" />
</AppScaffold>

<style>
  .wallet-page-wrapper {
    display: flex;
    flex-direction: column;
    gap: 28px;
    width: 100%;
  }

  /* Glassmorphism Panel Base (Theme Adaptive) */
  .glass-panel {
    background: var(--color-bg-surface, #ffffff);
    border: 1px solid var(--color-border-hairline, #e2e8f0);
    border-radius: var(--radius-xl, 20px);
    padding: 24px;
    box-shadow: var(--shadow-card, 0 10px 30px rgba(0, 0, 0, 0.06));
    transition: background 0.2s ease, border-color 0.2s ease;
  }

  :global([data-theme="dark"]) .glass-panel {
    background: rgba(22, 24, 34, 0.85);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  }

  /* Hero Overview Card */
  .hero-overview-card {
    display: flex;
    flex-direction: column;
    gap: 24px;
    background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
    border: 1px solid rgba(245, 158, 11, 0.35);
    color: #f8fafc;
    position: relative;
    overflow: hidden;
  }

  .hero-overview-card::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, transparent 70%);
    pointer-events: none;
  }

  @media (min-width: 768px) {
    .hero-overview-card {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  .balance-meta {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .balance-icon-ring {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.35));
    border: 1px solid rgba(245, 158, 11, 0.5);
    box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
    flex-shrink: 0;
  }

  :global(.text-gold) {
    color: #d97706;
  }
  :global([data-theme="dark"]) :global(.text-gold) {
    color: #f59e0b;
  }

  :global(.gold-icon) {
    color: #f59e0b;
    filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.6));
  }

  .balance-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .balance-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #cbd5e1;
  }

  .user-tier-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: var(--radius-pill, 999px);
    font-size: 11px;
    font-weight: 600;
  }

  .user-tier-tag.member {
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .user-tier-tag.anon {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .balance-amount {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .balance-amount .num {
    font-size: 36px;
    font-weight: 800;
    letter-spacing: -1px;
    color: #ffffff;
  }

  .balance-amount .unit {
    font-size: 16px;
    font-weight: 700;
    color: #fbbf24;
  }

  .hero-checkin-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 16px 20px;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: var(--radius-lg, 16px);
  }

  .checkin-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .checkin-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #f8fafc;
  }

  .checkin-info p {
    margin: 0;
    font-size: 12px;
    color: #94a3b8;
  }

  .error-text {
    color: var(--color-danger, #ef4444) !important;
    font-size: 11px !important;
    margin-top: 2px !important;
  }

  /* Wallet 2-Column Grid Layout */
  .wallet-grid {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  @media (min-width: 960px) {
    .wallet-grid {
      display: grid;
      grid-template-columns: 1fr 400px;
      align-items: start;
    }
  }

  .left-pane {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .sticky-pane {
    position: sticky;
    top: 90px;
  }

  /* Section Headers */
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .section-header h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 17px;
    font-weight: 700;
    color: var(--color-text-primary, #0f172a);
  }

  .sub-tag {
    font-size: 12px;
    color: var(--color-text-muted, #64748b);
  }

  /* Anonymous Warning Banner */
  .anon-warning-card {
    display: flex;
    align-items: center;
    gap: 16px;
    background: #fef3c7;
    border: 1px solid #fde68a;
    padding: 16px 20px;
  }
  :global([data-theme="dark"]) .anon-warning-card {
    background: rgba(245, 158, 11, 0.08);
    border-color: rgba(245, 158, 11, 0.3);
  }

  :global(.warning-icon) {
    color: #d97706;
    flex-shrink: 0;
  }

  .warning-content h3 {
    margin: 0 0 2px;
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text-primary, #0f172a);
  }

  .warning-content p {
    margin: 0;
    font-size: 12px;
    color: var(--color-text-secondary, #475569);
  }

  .btn-anon-login {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 14px;
    border-radius: var(--radius-md, 10px);
    background: #d97706;
    color: #ffffff;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    flex-shrink: 0;
    transition: opacity 0.2s ease;
  }

  .btn-anon-login:hover {
    opacity: 0.9;
  }

  /* Packages Grid */
  .packages-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 14px;
  }

  .package-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 18px;
    background: var(--color-bg-surface, #ffffff);
    border: 2px solid var(--color-border-hairline, #e2e8f0);
    border-radius: var(--radius-lg, 16px);
    cursor: pointer;
    text-align: left;
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  :global([data-theme="dark"]) .package-card {
    background: rgba(22, 24, 34, 0.6);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .package-card:hover {
    border-color: #d97706;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(217, 119, 6, 0.12);
  }

  .package-card.selected {
    border-color: #d97706;
    background: #fffbeb;
    box-shadow: 0 0 20px rgba(217, 119, 6, 0.2);
  }

  :global([data-theme="dark"]) .package-card.selected {
    border-color: #f59e0b;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%);
  }

  .pkg-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .pkg-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary, #475569);
  }

  .pkg-badge {
    font-size: 10px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
    background: #d97706;
    color: #ffffff;
    text-transform: uppercase;
  }

  .pkg-main {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 8px;
  }

  .pkg-xu {
    font-size: 24px;
    font-weight: 800;
    color: var(--color-text-primary, #0f172a);
  }

  .package-card.selected .pkg-xu {
    color: #b45309;
  }
  :global([data-theme="dark"]) .package-card.selected .pkg-xu {
    color: #f59e0b;
  }

  .pkg-xu small {
    font-size: 14px;
    font-weight: 700;
  }

  .pkg-price {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-secondary, #64748b);
  }

  .pkg-footer {
    font-size: 11px;
    color: var(--color-text-muted, #64748b);
    border-top: 1px dashed var(--color-border-hairline, #e2e8f0);
    padding-top: 8px;
  }

  /* Costs List */
  .costs-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .cost-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: var(--color-bg-elevated, #f8fafc);
    border-radius: var(--radius-md, 12px);
    border: 1px solid var(--color-border-hairline, #e2e8f0);
  }

  :global([data-theme="dark"]) .cost-item {
    background: rgba(30, 41, 59, 0.4);
    border-color: rgba(255, 255, 255, 0.05);
  }

  .cost-item-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  :global(.cost-icon) {
    color: #d97706;
  }
  :global([data-theme="dark"]) :global(.cost-icon) {
    color: #f59e0b;
  }

  .cost-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary, #0f172a);
  }

  .cost-item-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .cost-tag {
    font-size: 11px;
    color: var(--color-text-muted, #64748b);
    background: rgba(0, 0, 0, 0.04);
    padding: 2px 6px;
    border-radius: 4px;
  }
  :global([data-theme="dark"]) .cost-tag {
    background: rgba(255, 255, 255, 0.05);
  }

  .cost-val {
    font-size: 13px;
    font-weight: 700;
    color: #b45309;
  }
  :global([data-theme="dark"]) .cost-val {
    color: #f59e0b;
  }

  /* Referral Section */
  .referral-desc {
    font-size: 13px;
    color: var(--color-text-secondary, #475569);
    margin: 0 0 16px;
    line-height: 1.5;
  }

  .ref-link-box {
    display: flex;
    gap: 8px;
    background: var(--color-bg-elevated, #f8fafc);
    padding: 6px 6px 6px 14px;
    border-radius: var(--radius-md, 12px);
    border: 1px dashed #d97706;
    margin-bottom: 12px;
  }
  :global([data-theme="dark"]) .ref-link-box {
    background: rgba(30, 41, 59, 0.6);
  }

  .ref-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--color-text-primary, #0f172a);
    font-family: var(--font-mono, monospace);
    font-size: 12px;
    outline: none;
  }

  .btn-copy-ref {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: var(--radius-sm, 8px);
    background: #d97706;
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .btn-copy-ref:hover {
    opacity: 0.9;
  }

  .social-share-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .share-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--color-text-muted, #64748b);
  }

  .btn-share-social {
    padding: 4px 10px;
    border-radius: var(--radius-pill, 999px);
    font-size: 11px;
    font-weight: 700;
    border: 1px solid var(--color-border-hairline, #cbd5e1);
    background: var(--color-bg-elevated, #f1f5f9);
    color: var(--color-text-primary, #0f172a);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-share-social.zalo:hover { background: #0068ff; border-color: #0068ff; color: #fff; }
  .btn-share-social.facebook:hover { background: #1877f2; border-color: #1877f2; color: #fff; }
  .btn-share-social.telegram:hover { background: #229ed9; border-color: #229ed9; color: #fff; }

  .btn-open-viral-card {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    margin-top: 12px;
    padding: 10px 16px;
    border-radius: var(--radius-md, 12px);
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(124, 58, 237, 0.16));
    border: 1px solid rgba(245, 158, 11, 0.4);
    color: #fbbf24;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
    transition: all 0.25s ease;
  }

  .btn-open-viral-card:hover {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(124, 58, 237, 0.26));
    border-color: #f59e0b;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(245, 158, 11, 0.2);
    color: #fef08a;
  }

  :global(.gold-icon) {
    color: #f59e0b;
  }

  .referral-stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 14px;
    margin-bottom: 8px;
  }

  .ref-stat-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: var(--color-bg-surface, #ffffff);
    border: 1px solid var(--color-border-hairline, #e2e8f0);
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .ref-stat-icon {
    font-size: 20px;
    line-height: 1;
  }

  .ref-stat-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
  }

  .ref-stat-label {
    font-size: 11px;
    color: var(--color-text-muted, #64748b);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .ref-stat-value {
    font-size: 15px;
    font-weight: 800;
    color: var(--color-text-primary, #0f172a);
  }

  .ref-stat-value.highlight {
    color: #16a34a;
  }

  .referral-history {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px dashed var(--color-border-hairline, #e2e8f0);
  }

  .referral-history h4 {
    margin: 0 0 10px;
    font-size: 12px;
    font-weight: 700;
    color: var(--color-text-secondary, #475569);
  }

  .ref-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 280px;
    overflow-y: auto;
  }

  .ref-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--color-bg-elevated, #f8fafc);
    border: 1px solid var(--color-border-hairline, #f1f5f9);
    border-radius: 8px;
    font-size: 12px;
    gap: 10px;
  }

  .ref-item-main {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .ref-date {
    font-size: 10.5px;
    color: var(--color-text-muted, #64748b);
  }

  .ref-desc {
    color: var(--color-text-primary, #0f172a);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ref-reward {
    font-weight: 800;
    color: #16a34a;
    background: #f0fdf4;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 11.5px;
    white-space: nowrap;
  }

  /* Right Sticky Payment Card */
  .payment-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .payment-header h3 {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 800;
    color: var(--color-text-primary, #0f172a);
  }

  .live-pulse-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: var(--radius-pill, 999px);
    background: rgba(34, 197, 94, 0.12);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #16a34a;
    font-size: 11px;
    font-weight: 600;
    margin-bottom: 12px;
  }
  :global([data-theme="dark"]) .live-pulse-badge {
    color: #4ade80;
  }

  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #16a34a;
    box-shadow: 0 0 0 rgba(34, 197, 94, 0.4);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
    70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
    100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
  }

  .instruction {
    font-size: 12px;
    color: var(--color-text-secondary, #475569);
    margin: 0 0 14px;
    line-height: 1.4;
  }

  .owner-name {
    font-weight: 800;
    color: #0369a1;
  }
  :global([data-theme="dark"]) .owner-name {
    color: #38bdf8;
  }

  .account-num {
    font-family: var(--font-mono, monospace);
    letter-spacing: 0.5px;
    font-size: 13.5px;
  }

  .qr-frame {
    background: #ffffff;
    padding: 12px;
    border-radius: var(--radius-lg, 16px);
    margin-bottom: 16px;
    box-shadow: 0 0 25px rgba(217, 119, 6, 0.18);
    border: 2px solid #d97706;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .qr-frame:hover {
    transform: scale(1.03);
  }

  .qr-image {
    width: 210px;
    height: 210px;
    object-fit: contain;
    display: block;
  }

  .transfer-info-box {
    width: 100%;
    background: var(--color-bg-elevated, #f8fafc);
    border: 1px solid var(--color-border-hairline, #e2e8f0);
    border-radius: var(--radius-md, 12px);
    padding: 14px;
    margin-bottom: 16px;
    text-align: left;
    box-sizing: border-box;
  }
  :global([data-theme="dark"]) .transfer-info-box {
    background: rgba(15, 23, 42, 0.7);
    border-color: rgba(245, 158, 11, 0.2);
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px dashed var(--color-border-hairline, #e2e8f0);
  }

  .highlight-row {
    background: #fef3c7;
    padding: 8px 10px;
    border-radius: 8px;
    margin: 4px 0;
    border-bottom: none;
  }
  :global([data-theme="dark"]) .highlight-row {
    background: rgba(245, 158, 11, 0.1);
  }

  .info-label {
    color: var(--color-text-secondary, #475569);
    font-size: 12px;
  }

  .info-val {
    font-weight: 700;
    font-size: 13px;
    color: var(--color-text-primary, #0f172a);
  }

  .info-val.price {
    color: #b45309;
    font-size: 14px;
  }
  :global([data-theme="dark"]) .info-val.price {
    color: #f59e0b;
  }

  .info-val.highlight {
    color: #b45309;
    font-size: 15px;
    letter-spacing: 0.5px;
  }
  :global([data-theme="dark"]) .info-val.highlight {
    color: #f59e0b;
  }

  .info-val-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .btn-copy-small {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: 1px solid var(--color-border-hairline, #cbd5e1);
    background: var(--color-bg-surface, #ffffff);
    color: var(--color-text-secondary, #475569);
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
  }

  .btn-copy-small:hover {
    background: #fef3c7;
    color: #b45309;
    border-color: #d97706;
  }

  .btn-copy-highlight {
    border-color: #d97706;
    background: #fef3c7;
    color: #b45309;
  }

  .btn-copy-all {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 8px 12px;
    margin-top: 10px;
    border-radius: 8px;
    background: #d97706;
    border: 1px solid #b45309;
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-copy-all:hover {
    background: #b45309;
    box-shadow: 0 0 15px rgba(217, 119, 6, 0.3);
  }

  .warning-text {
    margin: 10px 0 0;
    font-size: 11px;
    color: #dc2626;
    font-style: italic;
    line-height: 1.4;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .refresh-hint {
    font-size: 11px;
    color: var(--color-text-muted, #64748b);
    margin: 0;
  }

  :global(.spin-icon) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .loading-text {
    font-size: 12px;
    color: var(--color-text-muted, #64748b);
    font-style: italic;
  }

  :global(.text-success) {
    color: #16a34a;
  }
</style>
