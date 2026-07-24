<script lang="ts">
  import { onMount } from 'svelte';

  interface TopReferrer {
    referrerId: string;
    count: number;
  }

  interface ReferralRecord {
    id: string;
    referrer_id: string;
    referred_id: string;
    reward_xu: number;
    created_at: string;
  }

  interface ReferralAnalytics {
    totalReferrals: number;
    topReferrers: TopReferrer[];
    recentReferrals: ReferralRecord[];
  }

  let data = $state<ReferralAnalytics | null>(null);
  let loading = $state(true);
  let errorMsg = $state('');

  async function loadReferrals() {
    loading = true;
    errorMsg = '';
    try {
      const res = await fetch('/api/admin/referrals');
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
  <title>Thống kê Giới thiệu - Admin ViOS</title>
</svelte:head>

{#if errorMsg}
  <div class="alert-error">{errorMsg}</div>
{/if}

{#if loading}
  <div class="loading-state">Đang tải thống kê giới thiệu...</div>
{:else if data}
  <div class="metrics-grid">
    <div class="metric-card">
      <span class="metric-label">Tổng lượt giới thiệu thành công</span>
      <span class="metric-value">{data.totalReferrals}</span>
    </div>
    <div class="metric-card">
      <span class="metric-label">Tổng XU thưởng đã phát</span>
      <span class="metric-value text-gold">{data.totalReferrals * 10} XU</span>
    </div>
  </div>

  <div class="section-title">
    <h2>🏆 Top Người Giới Thiệu (Leaderboard)</h2>
  </div>

  {#if data.topReferrers.length === 0}
    <div class="empty-box">Chưa có dữ liệu người giới thiệu.</div>
  {:else}
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Xếp hạng</th>
            <th>Referrer ID (Người giới thiệu)</th>
            <th>Số lượt giới thiệu</th>
            <th>XU thưởng ước tính</th>
          </tr>
        </thead>
        <tbody>
          {#each data.topReferrers as top, idx (top.referrerId)}
            <tr>
              <td class="rank-col">#{idx + 1}</td>
              <td class="id-col"><code>{top.referrerId}</code></td>
              <td class="count-col">{top.count} người</td>
              <td class="xu-col">+{top.count * 10} XU</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <div class="section-title margin-top">
    <h2>📜 Lịch Sử Giới Thiệu Gần Đây</h2>
  </div>

  {#if data.recentReferrals.length === 0}
    <div class="empty-box">Chưa có lịch sử giới thiệu.</div>
  {:else}
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Người giới thiệu (Referrer)</th>
            <th>Người được mời (Referred)</th>
            <th>Thưởng XU</th>
          </tr>
        </thead>
        <tbody>
          {#each data.recentReferrals as ref (ref.id)}
            <tr>
              <td>{new Date(ref.created_at).toLocaleString('vi-VN')}</td>
              <td><code>{ref.referrer_id.substring(0, 8)}...</code></td>
              <td><code>{ref.referred_id.substring(0, 8)}...</code></td>
              <td class="xu-col">+{ref.reward_xu ?? 10} XU</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
{/if}

<style>
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--space-md);
    margin-bottom: var(--space-xl);
  }

  .metric-card {
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-hairline);
    padding: var(--space-lg);
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .metric-label {
    font-size: var(--text-body-sm);
    color: var(--color-text-secondary);
  }

  .metric-value {
    font-size: var(--text-h2);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .text-gold { color: var(--color-accent-gold, #d97706); }

  .section-title {
    margin-bottom: var(--space-md);
  }

  .section-title h2 {
    font-size: var(--text-h3);
    font-family: var(--font-serif);
    margin: 0;
  }

  .margin-top { margin-top: var(--space-xxl); }

  .table-card {
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-lg);
    overflow-x: auto;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: var(--text-body-sm);
  }

  .data-table th, .data-table td {
    padding: var(--space-md);
    border-bottom: 1px solid var(--color-border-hairline);
  }

  .rank-col { font-weight: 700; color: var(--color-accent-primary); }
  .id-col code { font-family: var(--font-mono); color: var(--color-text-muted); }
  .count-col { font-weight: 600; }
  .xu-col { font-weight: 700; color: var(--color-accent-gold, #d97706); }

  .empty-box {
    padding: var(--space-xl);
    background: var(--color-bg-surface);
    border: 1px dashed var(--color-border-hairline);
    border-radius: var(--radius-md);
    text-align: center;
    color: var(--color-text-muted);
  }

  .alert-error {
    padding: var(--space-md);
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border-radius: var(--radius-md);
    margin-bottom: var(--space-md);
  }
</style>
