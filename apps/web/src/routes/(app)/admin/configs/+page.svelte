<script lang="ts">
  import { onMount } from 'svelte';

  interface ConfigData {
    dailyCheckinXu: number;
    rateVndToXu: number;
    features: Record<string, boolean>;
  }

  let config = $state<ConfigData | null>(null);
  let loading = $state(true);
  let errorMsg = $state('');

  async function loadConfigs() {
    loading = true;
    errorMsg = '';
    try {
      const res = await fetch('/api/admin/configs');
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
  <title>Cấu hình Hệ thống - Admin ViOS</title>
</svelte:head>

{#if errorMsg}
  <div class="alert-error">{errorMsg}</div>
{/if}

{#if loading}
  <div class="loading-state">Đang tải cấu hình hệ thống...</div>
{:else if config}
  <div class="config-section">
    <h2>⚙️ Cấu Hình Thưởng & Tỷ Giá XU</h2>
    <div class="config-card">
      <div class="config-item">
        <span class="label">Mức XU Thưởng Điểm Danh Hàng Ngày</span>
        <span class="value badge-gold">+{config.dailyCheckinXu} XU / ngày</span>
      </div>
      <div class="config-item">
        <span class="label">Tỷ giá nạp SePay VietQR</span>
        <span class="value">1.000 VNĐ = 1 XU</span>
      </div>
    </div>

    <h2>🧩 Trạng Thái Cờ Tính Năng AI (Feature Flags)</h2>
    <div class="features-grid">
      {#each Object.entries(config.features) as [featureKey, isEnabled]}
        <div class="feature-card {isEnabled ? 'enabled' : 'disabled'}">
          <div class="feature-info">
            <span class="feature-name">{featureKey.toUpperCase()}</span>
            <span class="feature-status">{isEnabled ? '🟢 Đang bật' : '🔴 Đã tắt'}</span>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .config-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .config-section h2 {
    font-size: var(--text-h3);
    font-family: var(--font-serif);
    margin: 0;
  }

  .config-card {
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .config-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: var(--space-sm);
    border-bottom: 1px solid var(--color-border-hairline);
  }

  .config-item:last-child { border-bottom: none; }

  .label { font-weight: 500; color: var(--color-text-secondary); }
  .value { font-weight: 700; color: var(--color-text-primary); }
  .badge-gold { color: var(--color-accent-gold, #d97706); }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-md);
  }

  .feature-card {
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    padding: var(--space-md);
  }

  .feature-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .feature-name { font-weight: 700; font-family: var(--font-mono); }
  .feature-status { font-size: 13px; }

  .alert-error {
    padding: var(--space-md);
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border-radius: var(--radius-md);
    margin-bottom: var(--space-md);
  }
</style>
