<script lang="ts">
  import { getAuthStore } from '$lib/auth/auth-context';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { deleteAccount } from '$lib/api-client/users';
  import { createWalletModel } from '$lib/features/payment/wallet-model.svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import {
    AlertTriangle,
    Trash2,
    ArrowLeft,
    Share2,
    Copy,
    Check,
    User,
    Coins,
    Shield,
    Sparkles,
    LogOut,
    Trophy,
  } from 'lucide-svelte';
  import ReferralPartnerHubModal from '$lib/features/referral/ReferralPartnerHubModal.svelte';

  const auth = getAuthStore();
  const queryClient = useQueryClient();
  const walletModel = createWalletModel(auth);

  let isDeleting = $state(false);
  let isSigningOut = $state(false);
  let showConfirmModal = $state(false);
  let showPartnerHubModal = $state(false);
  let copied = $state(false);

  const referralLink = $derived.by(() => {
    if (!walletModel.referralCode) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tuvitoantap.vercel.app';
    return `${origin}/?ref=${walletModel.referralCode}`;
  });

  function copyRefLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  async function handleSignOut() {
    if (isSigningOut) return;
    isSigningOut = true;
    try {
      await auth.signOut();
      queryClient.clear();
      await goto(resolve('/sign-in'), { replaceState: true });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi không xác định khi đăng xuất.');
    } finally {
      isSigningOut = false;
    }
  }

  async function handleDeleteAccount() {
    const token = auth.getAccessToken();
    if (!token) return;
    try {
      isDeleting = true;
      await deleteAccount(token);
      alert('Tài khoản đã được xoá thành công.');
      await auth.signOut();
      queryClient.clear();
      await goto(resolve('/sign-in'), { replaceState: true });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi không xác định khi xoá tài khoản.');
    } finally {
      isDeleting = false;
      showConfirmModal = false;
    }
  }
</script>

<svelte:head>
  <title>Cài đặt tài khoản - ViOS</title>
</svelte:head>

<div class="settings-page">
  <!-- Header section -->
  <header class="settings-header">
    <a href={resolve('/')} class="btn-back" title="Quay lại Trang chủ">
      <ArrowLeft class="icon" />
    </a>
    <div class="header-titles">
      <h1 class="page-title">Cài Đặt Tài Khoản</h1>
      <p class="page-subtitle">Quản lý thông tin cá nhân, liên kết chia sẻ & thiết lập ứng dụng</p>
    </div>
  </header>

  <div class="settings-content">
    <!-- Account Information Card -->
    <section class="card surface-glass">
      <header class="card-head">
        <div class="card-icon-title">
          <User class="section-icon icon-primary" />
          <h2 class="card-title">Thông Tin Danh Tính</h2>
        </div>
        {#if auth.isAnonymous}
          <span class="badge badge-anon">Khách vãng lai</span>
        {:else}
          <span class="badge badge-verified">Đã xác thực</span>
        {/if}
      </header>
      <div class="card-body">
        {#if auth.isAnonymous}
          <div class="notice-box notice-warning">
            <Shield class="box-icon" />
            <div class="notice-text">
              <strong>Bạn đang dùng tài khoản Ẩn danh.</strong>
              <p>Dữ liệu lá số và lịch sử hội thoại sẽ lưu tạm trên trình duyệt này. Hãy đăng nhập Email để bảo lưu dữ liệu bền vững khi đổi thiết bị.</p>
              <a href={resolve('/sign-in')} class="btn-link">Đăng nhập / Đăng ký ngay &rarr;</a>
            </div>
          </div>
        {:else}
          <div class="info-row">
            <span class="info-label">Email tài khoản</span>
            <span class="info-value">{auth.user?.email ?? 'Chưa cập nhật'}</span>
          </div>
        {/if}

        <div class="info-row">
          <span class="info-label">Số dư ví XU</span>
          <span class="info-value xu-balance">
            <Coins class="xu-icon" />
            {walletModel.balance} XU
          </span>
        </div>

        {#if !auth.isAnonymous}
          <div class="account-actions">
            <button
              type="button"
              class="btn-signout"
              disabled={isSigningOut}
              onclick={handleSignOut}
            >
              <LogOut class="btn-icon" />
              <span>{isSigningOut ? 'Đang đăng xuất...' : 'Đăng xuất tài khoản'}</span>
            </button>
          </div>
        {/if}
      </div>
    </section>

    <!-- Referral / Affiliate Card -->
    {#if !auth.isAnonymous}
      <section class="card surface-glass">
        <header class="card-head">
          <div class="card-icon-title">
            <Share2 class="section-icon icon-accent" />
            <h2 class="card-title">Chương Trình Giới Thiệu (Affiliate)</h2>
          </div>
          <span class="badge badge-bonus"><Sparkles class="badge-icon" /> Nhận XU Thưởng</span>
        </header>
        <div class="card-body">
          <p class="description">
            Chia sẻ link giới thiệu với bạn bè. Khi bạn bè truy cập và tạo tài khoản:
            <strong>Bạn nhận ngay +10 XU</strong> và <strong>Bạn bè nhận +15 XU</strong> vào ví.
          </p>

          {#if walletModel.referralCode}
            <div class="copy-field">
              <input
                type="text"
                readonly
                value={referralLink}
                class="copy-input"
              />
              <button
                type="button"
                onclick={copyRefLink}
                class="btn-copy"
              >
                {#if copied}
                  <Check class="btn-icon" /> Đã Copy
                {:else}
                  <Copy class="btn-icon" /> Sao chép Link
                {/if}
              </button>
            </div>

            <div class="partner-hub-action-row">
              <button
                type="button"
                class="btn-partner-hub"
                onclick={() => (showPartnerHubModal = true)}
              >
                <Trophy class="btn-icon text-gold" />
                <span>Mở Trung Tâm Đối Tác & Bảng Xếp Hạng Sứ Giả</span>
              </button>
            </div>
          {:else}
            <p class="loading-text">Đang nạp mã giới thiệu...</p>
          {/if}
        </div>
      </section>
    {/if}

    {#if showPartnerHubModal}
      <ReferralPartnerHubModal
        token={auth.getAccessToken() || undefined}
        onClose={() => (showPartnerHubModal = false)}
      />
    {/if}

    <!-- Danger Zone Card -->
    <section class="card card-danger surface-glass">
      <header class="card-head">
        <div class="card-icon-title">
          <AlertTriangle class="section-icon icon-danger" />
          <h2 class="card-title danger-title">Khu Vực Nguy Hiểm</h2>
        </div>
      </header>
      <div class="card-body">
        <p class="description">
          Hành động này sẽ xoá vĩnh viễn tài khoản của bạn, bao gồm toàn bộ lá số đã lập, lịch sử hội thoại và các luận giải AI. Dữ liệu không thể khôi phục sau khi xoá.
        </p>

        <button
          type="button"
          class="btn-danger-outline"
          disabled={isDeleting}
          onclick={() => (showConfirmModal = true)}
        >
          <Trash2 class="btn-icon" />
          Xoá tài khoản vĩnh viễn
        </button>
      </div>
    </section>
  </div>
</div>

<!-- Confirmation Modal -->
{#if showConfirmModal}
  <div class="modal-wrapper">
    <div class="modal-backdrop" role="presentation" onclick={() => (showConfirmModal = false)}></div>
    <div class="modal-dialog surface-glass" role="dialog" aria-modal="true">
      <header class="modal-head">
        <h3 class="modal-title">Xác Nhận Xoá Tài Khoản?</h3>
      </header>
      <div class="modal-body">
        <p>Bạn đang thực hiện thao tác xoá tài khoản vĩnh viễn. Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?</p>
      </div>
      <footer class="modal-footer">
        <button
          type="button"
          class="btn-modal-cancel"
          disabled={isDeleting}
          onclick={() => (showConfirmModal = false)}
        >
          Huỷ bỏ
        </button>
        <button
          type="button"
          class="btn-modal-delete"
          disabled={isDeleting}
          onclick={handleDeleteAccount}
        >
          {#if isDeleting}
            <span class="spinner"></span> Đang xoá...
          {:else}
            Xác nhận xoá
          {/if}
        </button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .settings-page {
    max-width: 768px;
    margin: 0 auto;
    padding: var(--space-xl) var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }

  .settings-header {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .btn-back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-pill);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-hairline);
    color: var(--color-text-secondary);
    transition: all var(--duration-fast);
  }

  .btn-back:hover {
    color: var(--color-text-primary);
    background: var(--overlay-ink-wash);
  }

  .btn-back :global(.icon) {
    width: 20px;
    height: 20px;
  }

  .header-titles {
    display: flex;
    flex-direction: column;
  }

  .page-title {
    margin: 0;
    font-size: 24px;
    font-weight: 750;
    color: var(--color-text-primary);
    line-height: 1.2;
  }

  .page-subtitle {
    margin: 4px 0 0;
    font-size: 14px;
    color: var(--color-text-muted);
  }

  .settings-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .card {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border-hairline);
    overflow: hidden;
    background: var(--color-bg-surface);
  }

  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-lg);
    border-bottom: 1px solid var(--color-border-hairline);
  }

  .card-icon-title {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  :global(.section-icon) {
    width: 22px;
    height: 22px;
  }

  :global(.icon-primary) { color: var(--color-accent-primary); }
  :global(.icon-accent) { color: var(--color-accent-gold, #d97706); }
  :global(.icon-danger) { color: var(--color-accent-danger, #ef4444); }

  .card-title {
    margin: 0;
    font-size: 18px;
    font-weight: 650;
    color: var(--color-text-primary);
  }

  .danger-title {
    color: var(--color-accent-danger, #ef4444);
  }

  .card-body {
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .description {
    margin: 0;
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }

  .info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-sm) 0;
    border-bottom: 1px dashed var(--color-border-hairline);
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .info-label {
    font-size: 14px;
    color: var(--color-text-muted);
  }

  .info-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .xu-balance {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--color-accent-sienna, #c2410c);
  }

  :global(.xu-icon) {
    width: 16px;
    height: 16px;
  }

  .account-actions {
    display: flex;
    margin-top: var(--space-md);
    padding-top: var(--space-md);
    border-top: 1px solid var(--color-border-hairline);
  }

  .btn-signout {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-hairline);
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--duration-fast);
  }

  .btn-signout:hover:not(:disabled) {
    color: var(--color-text-primary);
    border-color: var(--color-border-strong);
    background: var(--overlay-ink-wash);
  }

  /* Notice Box */
  .notice-box {
    display: flex;
    gap: var(--space-md);
    padding: var(--space-md);
    border-radius: var(--radius-lg);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-hairline);
  }

  .notice-warning {
    border-color: rgba(217, 119, 6, 0.3);
  }

  :global(.box-icon) {
    width: 20px;
    height: 20px;
    color: var(--color-accent-gold, #d97706);
    flex-shrink: 0;
    margin-top: 2px;
  }

  .notice-text {
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  .notice-text strong {
    color: var(--color-text-primary);
    display: block;
    margin-bottom: 2px;
  }

  .btn-link {
    display: inline-block;
    margin-top: 6px;
    color: var(--color-accent-primary);
    font-weight: 600;
    text-decoration: none;
  }

  .btn-link:hover {
    text-decoration: underline;
  }

  /* Copy field */
  .copy-field {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: 6px var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-strong);
  }

  .copy-input {
    flex: 1;
    border: none;
    background: transparent;
    font-family: var(--font-mono, monospace);
    font-size: 13px;
    color: var(--color-text-primary);
    outline: none;
  }

  .btn-copy {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: var(--radius-sm);
    background: var(--color-accent-primary);
    color: var(--color-text-on-primary, #fff);
    font-size: 12px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: filter var(--duration-fast);
  }

  .btn-copy:hover {
    filter: brightness(1.1);
  }

  :global(.btn-icon) {
    width: 14px;
    height: 14px;
  }

  .loading-text {
    font-size: 13px;
    font-style: italic;
    color: var(--color-text-muted);
  }

  /* Danger Button */
  .btn-danger-outline {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    align-self: flex-start;
    padding: var(--space-sm) var(--space-lg);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-accent-danger, #ef4444);
    background: transparent;
    color: var(--color-accent-danger, #ef4444);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--duration-fast);
  }

  .btn-danger-outline:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.1);
  }

  /* Badges */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: var(--radius-pill);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .badge-anon {
    background: var(--color-bg-elevated);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border-hairline);
  }

  .badge-verified {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .badge-bonus {
    background: rgba(217, 119, 6, 0.15);
    color: var(--color-accent-gold, #d97706);
    border: 1px solid rgba(217, 119, 6, 0.3);
  }

  :global(.badge-icon) {
    width: 12px;
    height: 12px;
  }

  /* Modal */
  .modal-wrapper {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-lg);
  }

  .modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
  }

  .modal-dialog {
    position: relative;
    width: min(440px, 100%);
    border-radius: var(--radius-xl);
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-hairline);
    box-shadow: var(--shadow-card);
    overflow: hidden;
    animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .modal-head {
    padding: var(--space-lg);
    border-bottom: 1px solid var(--color-border-hairline);
  }

  .modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .modal-body {
    padding: var(--space-lg);
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    padding: var(--space-md) var(--space-lg);
    background: var(--color-bg-elevated);
    border-top: 1px solid var(--color-border-hairline);
  }

  .btn-modal-cancel {
    padding: 8px 16px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border-strong);
    background: transparent;
    color: var(--color-text-primary);
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
  }

  .btn-modal-delete {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    border: none;
    background: var(--color-accent-danger, #ef4444);
    color: #fff;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes popIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  .copy-field {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .copy-input {
    flex: 1;
    padding: 8px 12px;
    border-radius: var(--radius-md);
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--color-border-hairline);
    color: var(--color-text-primary);
    font-family: monospace;
    font-size: 13px;
  }

  .btn-copy {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-hairline);
    color: var(--color-text-primary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--duration-fast);
    white-space: nowrap;
  }

  .btn-copy:hover {
    background: var(--overlay-ink-wash);
    border-color: var(--color-border-strong);
  }

  .partner-hub-action-row {
    margin-top: 14px;
  }

  .btn-partner-hub {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: var(--radius-md);
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(180, 83, 9, 0.25) 100%);
    border: 1px solid rgba(212, 175, 55, 0.5);
    color: #fef08a;
    font-weight: 700;
    font-size: 13.5px;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(212, 175, 55, 0.2);
    transition: all 0.2s ease;
    width: 100%;
    justify-content: center;
  }

  .btn-partner-hub:hover {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(180, 83, 9, 0.45) 100%);
    box-shadow: 0 0 16px rgba(255, 215, 0, 0.35);
    transform: translateY(-1px);
  }

  :global([data-theme="light"]) .btn-partner-hub {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-color: #d97706;
    color: #78350f;
  }
</style>
