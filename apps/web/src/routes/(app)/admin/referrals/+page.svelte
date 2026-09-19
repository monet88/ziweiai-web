<script lang="ts">
  import { onMount } from 'svelte';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { UserPlus, Trophy, Coins, Sparkles, RefreshCw } from 'lucide-svelte';

  interface TopReferrer {
    referrerId: string;
    count: number;
    email?: string | null;
    displayName?: string | null;
  }

  interface ReferralRecord {
    id: string;
    referrer_id: string;
    referee_id?: string;
    referred_id?: string;
    referrer_email?: string | null;
    referrer_name?: string | null;
    referee_email?: string | null;
    referee_name?: string | null;
    reward_xu: number;
    created_at: string;
  }

  interface ReferralAnalytics {
    totalReferrals: number;
    topReferrers: TopReferrer[];
    recentReferrals: ReferralRecord[];
  }

  const auth = getAuthStore();
  let data = $state<ReferralAnalytics | null>(null);
  let loading = $state(true);
  let errorMsg = $state('');

  async function loadReferrals() {
    loading = true;
    errorMsg = '';
    try {
      const token = auth.getAccessToken();
      const res = await fetch('/api/admin/referrals', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Không thể tải dữ liệu giới thiệu');
      data = await res.json();
    } catch (err: any) {
      errorMsg = err.message || 'Lỗi kết nối';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void loadReferrals();
  });
</script>

<svelte:head>
  <title>Thống kê & Bảng Xếp Hạng Giới Thiệu - Admin ViOS</title>
</svelte:head>

<div class="referrals-page">
  {#if errorMsg}
    <div class="alert-error">{errorMsg}</div>
  {/if}

  {#if loading}
    <div class="loading-box">
      <RefreshCw size={24} class="spinning" />
      <span>Đang tải thống kê giới thiệu...</span>
    </div>
  {:else if data}
    <!-- Metrics Grid -->
    <div class="metrics-grid">
      <div class="stat-hud-card">
        <div class="stat-top">
          <span class="stat-label">Tổng Lượt Mời Thành Công</span>
          <div class="stat-icon icon-purple">
            <UserPlus size={18} />
          </div>
        </div>
        <div class="stat-value">{data.totalReferrals.toLocaleString('vi-VN')}</div>
        <div class="stat-sub">Người dùng đăng ký qua link giới thiệu</div>
      </div>

      <div class="stat-hud-card">
        <div class="stat-top">
          <span class="stat-label">Tổng XU Thưởng Đã Phát</span>
          <div class="stat-icon icon-gold">
            <Coins size={18} />
          </div>
        </div>
        <div class="stat-value text-gold">+{(data.totalReferrals * 20).toLocaleString('vi-VN')} XU</div>
        <div class="stat-sub">Đã cộng trực tiếp vào ví người giới thiệu</div>
      </div>
    </div>

    <!-- Leaderboard Section -->
    <div class="section-container">
      <div class="section-header">
        <Trophy size={18} class="section-icon text-gold" />
        <h2 class="section-title">Bảng Vinh Danh Người Giới Thiệu (Leaderboard)</h2>
      </div>

      {#if data.topReferrers.length === 0}
        <div class="empty-box">Chưa có dữ liệu người giới thiệu.</div>
      {:else}
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 80px;">Hạng</th>
                <th>Người Giới Thiệu (Tên / Email / User ID)</th>
                <th class="align-right">Số Lượt Mời</th>
                <th class="align-right">XU Thưởng Nhận</th>
              </tr>
            </thead>
            <tbody>
              {#each data.topReferrers as top, idx (top.referrerId)}
                <tr class="data-row">
                  <td class="rank-cell">
                    <span class="rank-badge rank-{idx + 1}">#{idx + 1}</span>
                  </td>
                  <td class="primary-cell">
                    <div class="user-badge-group">
                      <span class="user-primary-name">{top.displayName || top.email || 'Thành viên ViOS'}</span>
                      {#if top.displayName && top.email}
                        <span class="user-email-text">{top.email}</span>
                      {/if}
                      <code class="user-sub-id">{top.referrerId}</code>
                    </div>
                  </td>
                  <td class="align-right">
                    <strong>{top.count} người</strong>
                  </td>
                  <td class="align-right text-gold">
                    <span class="xu-pill">
                      <Coins size={12} />
                      +{(top.count * 20).toLocaleString('vi-VN')} XU
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <!-- Recent History Section -->
    <div class="section-container">
      <div class="section-header">
        <Sparkles size={18} class="section-icon text-purple" />
        <h2 class="section-title">Lịch Sử Giới Thiệu Gần Đây</h2>
      </div>

      {#if data.recentReferrals.length === 0}
        <div class="empty-box">Chưa có lịch sử giới thiệu.</div>
      {:else}
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Thời Gian</th>
                <th>Người Giới Thiệu (Referrer)</th>
                <th>Người Được Mời (Referred)</th>
                <th class="align-right">Thưởng XU</th>
              </tr>
            </thead>
            <tbody>
              {#each data.recentReferrals as ref (ref.id)}
                <tr class="data-row">
                  <td class="date-cell">
                    {new Date(ref.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td>
                    <div class="user-badge-group">
                      <span class="user-primary-name">{ref.referrer_name || ref.referrer_email || 'Thành viên'}</span>
                      {#if ref.referrer_name && ref.referrer_email}
                        <span class="user-email-text">{ref.referrer_email}</span>
                      {/if}
                      <code class="user-sub-id">{(ref.referrer_id || '').slice(0, 12)}…</code>
                    </div>
                  </td>
                  <td>
                    <div class="user-badge-group">
                      <span class="user-primary-name">{ref.referee_name || ref.referee_email || 'Khách mới'}</span>
                      {#if ref.referee_name && ref.referee_email}
                        <span class="user-email-text">{ref.referee_email}</span>
                      {/if}
                      <code class="user-sub-id">{(ref.referee_id || ref.referred_id || '').slice(0, 12)}…</code>
                    </div>
                  </td>
                  <td class="align-right text-gold">
                    <span class="xu-pill">
                      <Coins size={12} />
                      +{ref.reward_xu ?? 20} XU
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .referrals-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }

  /* Metrics Grid */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: var(--space-md);
  }

  @media (min-width: 640px) {
    .metrics-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .stat-hud-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-lg);
    background: var(--glass-bg);
    backdrop-filter: blur(18px) saturate(170%);
    -webkit-backdrop-filter: blur(18px) saturate(170%);
    border: 1px solid var(--overlay-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
  }

  .stat-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .stat-label {
    font-size: var(--text-eyebrow);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
    color: var(--color-text-muted);
  }

  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
  }

  .icon-purple {
    background: rgba(192, 132, 252, 0.15);
    color: #c084fc;
  }

  .icon-gold {
    background: rgba(212, 175, 55, 0.15);
    color: #d4af37;
  }

  .stat-value {
    font-family: var(--font-sans);
    font-size: 28px;
    font-weight: 800;
    color: var(--color-text-primary);
    line-height: 1.1;
  }

  .text-gold { color: #d4af37; }

  .stat-sub {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  /* Section Containers */
  .section-container {
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

  /* Table */
  .data-table-container {
    width: 100%;
    overflow-x: auto;
    background: var(--glass-bg);
    backdrop-filter: blur(18px) saturate(170%);
    -webkit-backdrop-filter: blur(18px) saturate(170%);
    border: 1px solid var(--overlay-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
  }

  .data-table {
    width: 100%;
    min-width: 640px;
    border-collapse: collapse;
    text-align: left;
  }

  .data-table th,
  .data-table td {
    padding: 12px var(--space-lg);
    border-bottom: 1px solid var(--overlay-border);
  }

  .data-table thead th {
    background: var(--overlay-ink-wash);
    font-size: var(--text-eyebrow);
    font-weight: 700;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
  }

  .align-right {
    text-align: right;
  }

  .data-row:hover {
    background-color: var(--overlay-ink-wash);
  }

  .data-row:last-child td {
    border-bottom: none;
  }

  .rank-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-pill);
    font-size: 12px;
    font-weight: 800;
    background: var(--overlay-ink-wash);
    color: var(--color-text-secondary);
  }

  .rank-1 {
    background: linear-gradient(135deg, #fce99f 0%, #d4af37 100%);
    color: #0f0c1b;
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.4);
  }

  .rank-2 {
    background: linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%);
    color: #0f0c1b;
  }

  .rank-3 {
    background: linear-gradient(135deg, #fed7aa 0%, #f97316 100%);
    color: #0f0c1b;
  }

  .id-code {
    background: var(--overlay-ink-wash);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 13px;
    color: var(--color-text-primary);
  }

  .xu-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: var(--radius-pill);
    background: rgba(212, 175, 55, 0.12);
    color: #d4af37;
    border: 1px solid rgba(212, 175, 55, 0.25);
    font-size: 13px;
    font-weight: 700;
  }

  .date-cell {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .empty-box {
    padding: 40px;
    background: var(--glass-bg);
    border: 1px dashed var(--overlay-border);
    border-radius: var(--radius-md);
    text-align: center;
    color: var(--color-text-muted);
    font-size: 14px;
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

  .spinning {
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

  .user-badge-group {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .user-primary-name {
    font-weight: 600;
    font-size: 13.5px;
    color: var(--color-text-primary);
  }

  .user-email-text {
    font-size: 12px;
    color: var(--color-primary-light, #c084fc);
    font-weight: 500;
  }

  .user-sub-id {
    font-family: monospace;
    font-size: 11px;
    color: var(--color-text-muted);
    opacity: 0.8;
  }
</style>
