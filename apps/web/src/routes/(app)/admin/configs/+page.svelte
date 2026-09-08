<script lang="ts">
  import { onMount } from 'svelte';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { Sliders, Gift, CheckCircle2, XCircle, RefreshCw } from 'lucide-svelte';

  interface ConfigData {
    dailyCheckinXu: number;
    referralRewardXu: number;
    rateVndToXu: number;
    features: Record<string, boolean>;
  }

  const auth = getAuthStore();
  let config = $state<ConfigData | null>(null);
  let loading = $state(true);
  let errorMsg = $state('');

  async function loadConfigs() {
    loading = true;
    errorMsg = '';
    try {
      const token = auth.getAccessToken();
      const res = await fetch('/api/admin/configs', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Không thể tải cấu hình');
      config = await res.json();
    } catch (err: any) {
      errorMsg = err.message || 'Lỗi kết nối';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void loadConfigs();
  });
</script>

<svelte:head>
  <title>Cấu hình Hệ thống & Cờ AI - Admin ViOS</title>
</svelte:head>

<div class="configs-page">
  {#if errorMsg}
    <div class="alert-error">{errorMsg}</div>
  {/if}

  {#if loading}
    <div class="loading-box">
      <RefreshCw size={24} class="spinning" />
      <span>Đang tải cấu hình hệ thống...</span>
    </div>
  {:else if config}
    <div class="config-sections">
      <!-- Rates & Reward Settings -->
      <section class="config-section">
        <div class="section-header">
          <Gift size={20} class="section-icon text-gold" />
          <h2 class="section-title">Cấu Hình Thưởng & Tỷ Giá XU</h2>
        </div>

        <div class="config-card">
          <div class="config-item">
            <div class="item-info">
              <span class="label">Mức XU Thưởng Điểm Danh Hàng Ngày</span>
              <span class="sub-label">Cộng tự động cho người dùng khi check-in mỗi ngày</span>
            </div>
            <span class="badge-gold">+{config.dailyCheckinXu} XU / ngày</span>
          </div>

          <div class="config-item">
            <div class="item-info">
              <span class="label">Mức XU Thưởng Giới Thiệu (Referral)</span>
              <span class="sub-label">Cộng cho người giới thiệu khi bạn bè đăng ký thành công</span>
            </div>
            <span class="badge-purple">+{config.referralRewardXu ?? 20} XU</span>
          </div>

          <div class="config-item">
            <div class="item-info">
              <span class="label">Tỷ Giá Nạp SePay VietQR</span>
              <span class="sub-label">Quy đổi tiền thực tế VNĐ sang số dư XU trong ví</span>
            </div>
            <span class="badge-rate">1.000 VNĐ = 1 XU</span>
          </div>
        </div>
      </section>

      <!-- Feature Flags Grid -->
      <section class="config-section">
        <div class="section-header">
          <Sliders size={20} class="section-icon text-purple" />
          <h2 class="section-title">Trạng Thái Cờ Tính Năng AI (Feature Flags)</h2>
        </div>

        <div class="features-grid">
          {#each Object.entries(config.features) as [featureKey, isEnabled] (featureKey)}
            <div class="feature-card {isEnabled ? 'enabled' : 'disabled'}">
              <div class="feature-header">
                <span class="feature-name">{featureKey.toUpperCase()}</span>
                {#if isEnabled}
                  <span class="status-pill status-on">
                    <CheckCircle2 size={12} /> BẬT
                  </span>
                {:else}
                  <span class="status-pill status-off">
                    <XCircle size={12} /> TẮT
                  </span>
                {/if}
              </div>
              <p class="feature-desc">
                {isEnabled ? 'Tính năng đang hoạt động bình thường.' : 'Tạm thời đóng để bảo trì hoặc bảo toàn quota.'}
              </p>
            </div>
          {/each}
        </div>
      </section>
    </div>
  {/if}
</div>

<style>
  .configs-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }

  .config-sections {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }

  .config-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .section-title {
    font-family: var(--font-serif);
    font-size: var(--text-h3);
    color: var(--color-text-primary);
    margin: 0;
    font-weight: 700;
  }

  :global(.text-gold) { color: #d4af37; }
  :global(.text-purple) { color: #c084fc; }

  /* Config Card */
  .config-card {
    background: var(--glass-bg);
    backdrop-filter: blur(18px) saturate(170%);
    -webkit-backdrop-filter: blur(18px) saturate(170%);
    border: 1px solid var(--overlay-border);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .config-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding-bottom: var(--space-md);
    border-bottom: 1px solid var(--overlay-border);
  }

  @media (min-width: 640px) {
    .config-item {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
  }

  .config-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .item-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .label {
    font-weight: 600;
    font-size: 14px;
    color: var(--color-text-primary);
  }

  .sub-label {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .badge-gold {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 4px 12px;
    border-radius: var(--radius-pill);
    background: rgba(212, 175, 55, 0.15);
    color: #d4af37;
    border: 1px solid rgba(212, 175, 55, 0.3);
    font-weight: 700;
    font-size: 13px;
  }

  .badge-purple {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 4px 12px;
    border-radius: var(--radius-pill);
    background: rgba(192, 132, 252, 0.15);
    color: #c084fc;
    border: 1px solid rgba(192, 132, 252, 0.3);
    font-weight: 700;
    font-size: 13px;
  }

  .badge-rate {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 4px 12px;
    border-radius: var(--radius-pill);
    background: var(--overlay-ink-wash);
    border: 1px solid var(--overlay-border);
    color: var(--color-text-primary);
    font-weight: 700;
    font-size: 13px;
  }

  /* Features Grid */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: var(--space-md);
  }

  .feature-card {
    background: var(--glass-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--overlay-border);
    border-radius: var(--radius-lg);
    padding: var(--space-md) var(--space-lg);
    box-shadow: var(--shadow-card);
    transition: transform 0.2s ease, border-color 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .feature-card:hover {
    transform: translateY(-2px);
  }

  .feature-card.enabled {
    border-color: rgba(16, 185, 129, 0.3);
    box-shadow: 0 8px 24px -6px rgba(16, 185, 129, 0.15);
  }

  .feature-card.disabled {
    border-color: rgba(239, 68, 68, 0.2);
    opacity: 0.75;
  }

  .feature-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .feature-name {
    font-weight: 700;
    font-family: monospace;
    font-size: 14px;
    color: var(--color-text-primary);
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .status-on {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .status-off {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .feature-desc {
    margin: 0;
    font-size: 12px;
    color: var(--color-text-muted);
    line-height: 1.4;
  }

  .loading-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-md);
    padding: 60px;
    color: var(--color-text-muted);
    font-size: 14px;
  }

  :global(.spinning) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .alert-error {
    padding: var(--space-md);
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border-radius: var(--radius-md);
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
</style>
