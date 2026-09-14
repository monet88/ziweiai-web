<script lang="ts">
  import { onMount } from 'svelte';
  import {
    X,
    Copy,
    Check,
    Share2,
    Trophy,
    Users,
    Coins,
    Gift,
    Loader2,
    Crown,
    Sparkles,
  } from 'lucide-svelte';
  import {
    referralPartnerHubResponseSchema,
    type ReferralPartnerHubResponse,
    type PartnerTier,
  } from '@ziweiai/contracts';
  import { fetchJson } from '$lib/api-client/fetch-json';
  import { toast } from '$lib/stores/toast';

  interface Props {
    token?: string;
    onClose: () => void;
  }

  let { token, onClose }: Props = $props();

  let hubData = $state<ReferralPartnerHubResponse | null>(null);
  let isLoading = $state(true);
  let errorMessage = $state<string | null>(null);
  let copied = $state(false);

  async function loadHubData(silent = false) {
    if (!silent) isLoading = true;
    try {
      hubData = await fetchJson('/rewards/partner-hub', referralPartnerHubResponseSchema, {
        method: 'GET',
        token,
      });
      errorMessage = null;
    } catch (err: any) {
      console.error('Failed to load partner hub data:', err);
      if (!silent) {
        errorMessage = err.message || 'Không thể nạp dữ liệu Trung Tâm Đối Tác.';
      }
    } finally {
      if (!silent) isLoading = false;
    }
  }

  onMount(() => {
    loadHubData();

    function handleRealtimeUpdate() {
      loadHubData(true);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('ziwei:referral_received', handleRealtimeUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('ziwei:referral_received', handleRealtimeUpdate);
      }
    };
  });

  function copyLink() {
    if (!hubData?.referralLink) return;
    navigator.clipboard.writeText(hubData.referralLink);
    copied = true;
    toast.show('✨ Đã sao chép liên kết giới thiệu độc quyền!', 'success');
    setTimeout(() => (copied = false), 2500);
  }

  async function handleShareInvite() {
    if (!hubData?.referralLink) return;
    const shareText = `Tử Vi Toàn Tập (ViOS) — Khảo sát thiên bàn tử vi, bát tự và nhận luận giải chi tiết từ Hội Đồng Chiêm Tinh Hoàng Cung. Đăng ký qua liên kết này nhận ngay +15 XU vào ví: ${hubData.referralLink}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Tử Vi Toàn Tập — Lập Lá Số & Khai Mở Khí Vận',
          text: shareText,
          url: hubData.referralLink,
        });
        toast.show('Đã mở giao diện chia sẻ mạng xã hội!', 'success');
        return;
      } catch {
        // Người dùng hủy chia sẻ, fallback sang copy clipboard
      }
    }

    navigator.clipboard.writeText(shareText);
    toast.show('✨ Đã sao chép nội dung lời mời phong thủy hoàng gia!', 'success');
  }

  function getTierInfo(tier: PartnerTier) {
    switch (tier) {
      case 'kim_cuong':
        return {
          name: 'Đại Sứ Mệnh Hoàng Gia — Kim Cương',
          shortName: 'Đại Sứ Kim Cương',
          icon: '💎',
          className: 'tier-kim-cuong',
          maxInTier: 30,
        };
      case 'vang':
        return {
          name: 'Sứ Giả Hoàng Triều — Hạng Vàng',
          shortName: 'Sứ Giả Hoàng Kim',
          icon: '👑',
          className: 'tier-vang',
          maxInTier: 30,
        };
      case 'bac':
        return {
          name: 'Sứ Giả Hoàng Triều — Hạng Bạc',
          shortName: 'Sứ Giả Bạch Ngân',
          icon: '🥈',
          className: 'tier-bac',
          maxInTier: 15,
        };
      case 'dong':
      default:
        return {
          name: 'Sứ Giả Hoàng Triều — Hạng Đồng',
          shortName: 'Sứ Giả Đồng',
          icon: '🥉',
          className: 'tier-dong',
          maxInTier: 5,
        };
    }
  }

  function getTierProgressPercent(totalRefs: number, tier: PartnerTier): number {
    if (tier === 'kim_cuong') return 100;
    if (tier === 'vang') {
      const p = Math.min(100, Math.max(0, ((totalRefs - 15) / 15) * 100));
      return Math.round(p);
    }
    if (tier === 'bac') {
      const p = Math.min(100, Math.max(0, ((totalRefs - 5) / 10) * 100));
      return Math.round(p);
    }
    const p = Math.min(100, Math.max(0, (totalRefs / 5) * 100));
    return Math.round(p);
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape') onClose();
  }}
/>

<!-- Backdrop overlay -->
<div
  class="hub-overlay"
  role="dialog"
  aria-modal="true"
  aria-labelledby="partner-hub-title"
  tabindex="-1"
  onclick={(e) => {
    if (e.target === e.currentTarget) onClose();
  }}
  onkeydown={(e) => {
    if (e.key === 'Escape') onClose();
  }}
>
  <div class="hub-modal" role="document">
    <!-- Header Hoàng Gia -->
    <header class="hub-header">
      <div class="header-left">
        <div class="trophy-badge" aria-hidden="true">
          <Trophy size={22} />
        </div>
        <div class="header-text">
          <div class="eyebrow-tag">
            <Sparkles size={12} />
            <span>Khâm Thiên Giám Ngự Chế • Đại Sứ Lan Tỏa</span>
          </div>
          <h3 id="partner-hub-title" class="modal-title">
            Trung Tâm Đối Tác & Bảng Xếp Hạng Sứ Giả
          </h3>
        </div>
      </div>
      <button
        type="button"
        onclick={onClose}
        class="btn-close-modal"
        aria-label="Đóng bảng vinh danh"
      >
        <X size={20} />
      </button>
    </header>

    <!-- Modal Content -->
    <div class="hub-body">
      {#if isLoading}
        <div class="state-loading">
          <Loader2 size={36} class="spinner" />
          <p>Đang đồng bộ dữ liệu Sứ Giả Hoàng Triều...</p>
        </div>
      {:else if errorMessage}
        <div class="state-error">
          <p class="error-msg">{errorMessage}</p>
          <button
            type="button"
            onclick={() => loadHubData()}
            class="btn-retry"
          >
            Thử tải lại
          </button>
        </div>
      {:else if hubData}
        {@const tierInfo = getTierInfo(hubData.tier)}
        {@const progressPercent = getTierProgressPercent(hubData.totalReferrals, hubData.tier)}

        <!-- 1. Banner Cấp Bậc & Liên Kết Giới Thiệu -->
        <section class="tier-card {tierInfo.className}">
          <div class="tier-main">
            <div class="tier-avatar" aria-hidden="true">
              <span class="tier-emoji">{tierInfo.icon}</span>
            </div>
            <div class="tier-details">
              <div class="tier-title-row">
                <h4 class="tier-name">{tierInfo.name}</h4>
                <span class="tier-pill">Cấp Hiện Tại</span>
              </div>
              <p class="tier-desc">
                {#if hubData.nextTierRemaining > 0}
                  Mời thêm <strong class="highlight-gold">{hubData.nextTierRemaining} bạn bè</strong> để nâng cấp danh hiệu kế tiếp.
                {:else}
                  Chúc mừng Đại Ka đã đạt cấp bậc vinh danh tối cao của hoàng triều!
                {/if}
              </p>

              <!-- Thanh tiến trình thăng hạng -->
              <div class="tier-progress-track" title="Tiến trình: {progressPercent}%">
                <div class="tier-progress-fill" style="width: {progressPercent}%;"></div>
              </div>
            </div>
          </div>

          <!-- Referral Link Box -->
          <div class="link-actions">
            <div class="link-input-box" title={hubData.referralLink}>
              <span class="link-url">{hubData.referralLink}</span>
            </div>
            <div class="link-btn-group">
              <button
                type="button"
                onclick={copyLink}
                class="btn-copy"
                class:btn-copied={copied}
              >
                {#if copied}
                  <Check size={15} /> <span>Đã Chép</span>
                {:else}
                  <Copy size={15} /> <span>Sao Chép</span>
                {/if}
              </button>
              <button
                type="button"
                onclick={handleShareInvite}
                class="btn-share"
                title="Chia sẻ mạng xã hội"
                aria-label="Chia sẻ mạng xã hội"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>
        </section>

        <!-- 2. Ba Thẻ Chỉ Số Hoàng Kim -->
        <section class="stats-grid">
          <div class="stat-box box-referrals">
            <div class="stat-top">
              <span class="stat-label">Tổng Bạn Bè Đã Mời</span>
              <Users size={18} class="stat-icon icon-gold" />
            </div>
            <div class="stat-num">
              {hubData.totalReferrals} <span class="stat-unit">người</span>
            </div>
            <p class="stat-sub text-emerald">
              Nhận +10 XU cho mỗi lượt tham gia hợp lệ
            </p>
          </div>

          <div class="stat-box box-earnings">
            <div class="stat-top">
              <span class="stat-label">Tổng XU Đã Nhận</span>
              <Coins size={18} class="stat-icon icon-amber" />
            </div>
            <div class="stat-num stat-gold">
              +{hubData.totalXuEarned} <span class="stat-unit">XU</span>
            </div>
            <p class="stat-sub text-muted">
              Cộng trực tiếp vào số dư ví của Đại Ka
            </p>
          </div>

          <div class="stat-box box-referee">
            <div class="stat-top">
              <span class="stat-label">Đãi Ngộ Người Được Mời</span>
              <Gift size={18} class="stat-icon icon-purple" />
            </div>
            <div class="stat-num stat-purple">
              +15 <span class="stat-unit">XU</span>
            </div>
            <p class="stat-sub text-muted">
              Quà tặng khởi đầu chào đón tân đạo hữu
            </p>
          </div>
        </section>

        <!-- 3. Bảng Vinh Danh Sứ Giả Lan Tỏa Toàn Quốc (Leaderboard) -->
        <section class="leaderboard-card">
          <header class="card-header">
            <div class="card-title-group">
              <Crown size={18} class="icon-gold" />
              <h4 class="card-heading">Bảng Vinh Danh Sứ Giả Lan Tỏa Toàn Quốc</h4>
            </div>
            <span class="sync-tag">Cập nhật mỗi 24 giờ</span>
          </header>

          <div class="table-wrapper">
            <table class="rank-table">
              <thead>
                <tr>
                  <th class="col-rank">Hạng</th>
                  <th class="col-user">Sứ Giả</th>
                  <th class="col-count text-center">Lượt Giới Thiệu</th>
                  <th class="col-reward text-right">Hoa Hồng Nhận</th>
                  <th class="col-badge text-right">Danh Hiệu</th>
                </tr>
              </thead>
              <tbody>
                {#each hubData.leaderboard as item (item.rank)}
                  <tr class="rank-row rank-{item.rank}">
                    <td class="col-rank">
                      {#if item.rank === 1}
                        <span class="medal-circle medal-gold" title="Quán Quân">🥇</span>
                      {:else if item.rank === 2}
                        <span class="medal-circle medal-silver" title="Á Quân">🥈</span>
                      {:else if item.rank === 3}
                        <span class="medal-circle medal-bronze" title="Quý Quân">🥉</span>
                      {:else}
                        <span class="rank-number">#{item.rank}</span>
                      {/if}
                    </td>
                    <td class="col-user">
                      <span class="masked-email font-mono">{item.maskedName}</span>
                    </td>
                    <td class="col-count text-center">
                      <span class="count-value font-bold">{item.referralCount}</span>
                    </td>
                    <td class="col-reward text-right">
                      <span class="reward-value">+{item.rewardXuEarned} XU</span>
                    </td>
                    <td class="col-badge text-right">
                      <span class="badge-tag">{item.badge}</span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>

        <!-- 4. Lịch Sử Bạn Bè Đã Mời Gần Đây -->
        <section class="recent-card">
          <header class="card-header">
            <div class="card-title-group">
              <Users size={16} class="icon-gold" />
              <h4 class="card-heading text-sm">Bạn Bè Đã Mời Gần Đây</h4>
            </div>
          </header>

          {#if hubData.recentReferrals.length === 0}
            <div class="empty-recent">
              <p>Chưa có bạn bè nào đăng ký qua liên kết của Đại Ka. Hãy sao chép liên kết phía trên và chia sẻ ngay!</p>
            </div>
          {:else}
            <div class="recent-list">
              {#each hubData.recentReferrals.slice(0, 5) as ref (ref.id)}
                <div class="recent-row">
                  <div class="recent-user">
                    <span class="status-dot"></span>
                    <span class="ref-email font-mono">{ref.refereeEmailMasked || 'Tân đạo hữu hữu duyên'}</span>
                  </div>
                  <div class="recent-meta">
                    <span class="ref-date">{new Date(ref.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span class="ref-reward font-bold">+{ref.rewardXu} XU</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </section>
      {/if}
    </div>

    <!-- Footer Hoàng Triều -->
    <footer class="hub-footer">
      <p class="footer-note">
        Khâm Thiên Giám Ngự Bút • Hoa hồng và cấp bậc áp dụng theo chính sách đối tác ViOS
      </p>
      <button
        type="button"
        onclick={onClose}
        class="btn-modal-close"
      >
        Đóng
      </button>
    </footer>
  </div>
</div>

<style>
  /* =========================================================================
     KHÂM THIÊN GIÁM NGỰ CHẾ • ROYAL CELESTIAL STYLES (SCOPED CSS)
     ========================================================================= */

  .hub-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background-color: rgba(5, 3, 15, 0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    animation: hubFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .hub-modal {
    position: relative;
    width: 100%;
    max-width: 920px;
    max-height: 92vh;
    display: flex;
    flex-direction: column;
    border-radius: 20px;
    background: linear-gradient(180deg, #16102b 0%, #0d091e 100%);
    border: 1px solid rgba(212, 175, 55, 0.35);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(212, 175, 55, 0.15);
    color: #f7eed8;
    overflow: hidden;
    animation: hubSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Header */
  .hub-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.1rem 1.5rem;
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
    background: linear-gradient(90deg, rgba(28, 20, 52, 0.95) 0%, rgba(13, 9, 30, 0.95) 100%);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.9rem;
  }

  .trophy-badge {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, #ffd700 0%, #d4af37 100%);
    color: #0b0819;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 14px rgba(212, 175, 55, 0.35);
    flex-shrink: 0;
  }

  .eyebrow-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: rgba(212, 175, 55, 0.12);
    color: #ffd700;
    border: 1px solid rgba(212, 175, 55, 0.28);
    margin-bottom: 0.25rem;
  }

  .modal-title {
    margin: 0;
    font-family: var(--font-serif, 'Playfair Display', Georgia, serif);
    font-size: 1.15rem;
    font-weight: 700;
    color: #fff4d9;
    letter-spacing: -0.01em;
  }

  .btn-close-modal {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(212, 175, 55, 0.2);
    color: #dcd0ba;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-close-modal:hover {
    background: rgba(212, 175, 55, 0.25);
    color: #ffd700;
    transform: rotate(90deg);
  }

  /* Body */
  .hub-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.4rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.3rem;
  }

  .hub-body::-webkit-scrollbar {
    width: 6px;
  }
  .hub-body::-webkit-scrollbar-thumb {
    background: rgba(212, 175, 55, 0.3);
    border-radius: 999px;
  }

  /* States */
  .state-loading {
    padding: 4rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: #cbbba4;
    font-size: 0.95rem;
  }

  .spinner {
    color: #ffd700;
    animation: spin 1s linear infinite;
  }

  .state-error {
    padding: 3rem 1rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  .error-msg {
    color: #ff7b7b;
    font-size: 0.9rem;
  }
  .btn-retry {
    padding: 0.55rem 1.2rem;
    border-radius: 10px;
    background: #2a1f44;
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #ffd700;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.82rem;
  }

  /* 1. Tier Banner */
  .tier-card {
    padding: 1.25rem 1.4rem;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(32, 22, 58, 0.8) 0%, rgba(16, 11, 33, 0.9) 100%);
    border: 1px solid rgba(212, 175, 55, 0.32);
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }

  .tier-main {
    display: flex;
    align-items: center;
    gap: 1.1rem;
  }

  .tier-avatar {
    width: 60px;
    height: 60px;
    border-radius: 16px;
    background: rgba(10, 7, 24, 0.8);
    border: 1px solid rgba(212, 175, 55, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: inset 0 0 16px rgba(212, 175, 55, 0.15);
  }

  .tier-emoji {
    font-size: 2rem;
    line-height: 1;
  }

  .tier-details {
    flex: 1;
    min-width: 0;
  }

  .tier-title-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .tier-name {
    margin: 0;
    font-family: var(--font-serif, 'Playfair Display', Georgia, serif);
    font-size: 1.12rem;
    font-weight: 700;
    color: #ffefcb;
  }

  .tier-pill {
    padding: 0.18rem 0.55rem;
    border-radius: 6px;
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: rgba(212, 175, 55, 0.15);
    color: #ffd700;
    border: 1px solid rgba(212, 175, 55, 0.4);
  }

  .tier-desc {
    margin: 0.35rem 0 0.55rem;
    font-size: 0.82rem;
    color: #c0b299;
  }

  .highlight-gold {
    color: #ffd700;
  }

  .tier-progress-track {
    width: 100%;
    max-width: 420px;
    height: 6px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    overflow: hidden;
    border: 1px solid rgba(212, 175, 55, 0.2);
  }

  .tier-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #d4af37 0%, #ffd700 100%);
    border-radius: 999px;
    transition: width 0.4s ease;
  }

  /* Link & Buttons */
  .link-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .link-input-box {
    flex: 1;
    min-width: 240px;
    padding: 0.6rem 0.85rem;
    border-radius: 12px;
    background: rgba(6, 4, 15, 0.75);
    border: 1px solid rgba(212, 175, 55, 0.25);
    overflow: hidden;
  }

  .link-url {
    font-family: var(--font-mono, monospace);
    font-size: 0.78rem;
    color: #e4d7bc;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .link-btn-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-copy {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.6rem 1.1rem;
    border-radius: 12px;
    background: linear-gradient(135deg, #ffd700 0%, #d4af37 100%);
    border: none;
    color: #0d081e;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(212, 175, 55, 0.3);
    transition: all 0.2s ease;
  }

  .btn-copy:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  .btn-copy.btn-copied {
    background: #10b981;
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
  }

  .btn-share {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(30, 21, 56, 0.9);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #ffd700;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-share:hover {
    background: rgba(212, 175, 55, 0.2);
    transform: translateY(-1px);
  }

  /* 2. Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.9rem;
  }

  .stat-box {
    padding: 1.1rem 1.2rem;
    border-radius: 14px;
    background: rgba(23, 16, 45, 0.7);
    border: 1px solid rgba(212, 175, 55, 0.2);
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  .stat-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .stat-label {
    font-size: 0.78rem;
    color: #b0a18a;
    font-weight: 500;
  }

  .stat-icon.icon-gold { color: #ffd700; }
  .stat-icon.icon-amber { color: #f59e0b; }
  .stat-icon.icon-purple { color: #c084fc; }

  .stat-num {
    font-family: var(--font-serif, 'Playfair Display', Georgia, serif);
    font-size: 1.65rem;
    font-weight: 700;
    color: #fbf6ec;
    line-height: 1.1;
  }

  .stat-gold { color: #ffd700; }
  .stat-purple { color: #d8b4fe; }

  .stat-unit {
    font-family: var(--font-sans, system-ui, sans-serif);
    font-size: 0.78rem;
    font-weight: 400;
    color: #9c8e78;
    margin-left: 0.15rem;
  }

  .stat-sub {
    margin: 0;
    font-size: 0.72rem;
    line-height: 1.3;
  }

  .text-emerald { color: #34d399; }
  .text-muted { color: #8e806d; }

  /* 3. Leaderboard Card */
  .leaderboard-card {
    padding: 1.25rem 1.3rem;
    border-radius: 16px;
    background: rgba(18, 12, 38, 0.75);
    border: 1px solid rgba(212, 175, 55, 0.22);
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .card-title-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .icon-gold { color: #ffd700; }

  .card-heading {
    margin: 0;
    font-family: var(--font-serif, 'Playfair Display', Georgia, serif);
    font-size: 0.98rem;
    font-weight: 700;
    color: #f7eed8;
  }

  .card-heading.text-sm {
    font-size: 0.88rem;
  }

  .sync-tag {
    font-size: 0.7rem;
    color: #8c7e6b;
  }

  /* Table */
  .table-wrapper {
    overflow-x: auto;
    border-radius: 10px;
  }

  .rank-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
    text-align: left;
  }

  .rank-table th {
    padding: 0.7rem 0.8rem;
    color: #9c8d76;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.68rem;
    letter-spacing: 0.06em;
    border-bottom: 1px solid rgba(212, 175, 55, 0.18);
  }

  .rank-table td {
    padding: 0.65rem 0.8rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    vertical-align: middle;
  }

  .rank-row:hover {
    background: rgba(212, 175, 55, 0.06);
  }

  .col-rank {
    width: 58px;
    text-align: center;
  }

  .medal-circle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    font-size: 1rem;
    line-height: 1;
  }

  .medal-gold {
    background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, rgba(212, 175, 55, 0.1) 70%);
    border: 1px solid rgba(255, 215, 0, 0.5);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  }

  .medal-silver {
    background: radial-gradient(circle, rgba(220, 220, 230, 0.3) 0%, rgba(180, 180, 190, 0.1) 70%);
    border: 1px solid rgba(200, 200, 215, 0.45);
  }

  .medal-bronze {
    background: radial-gradient(circle, rgba(205, 127, 50, 0.3) 0%, rgba(160, 90, 40, 0.1) 70%);
    border: 1px solid rgba(205, 127, 50, 0.45);
  }

  .rank-number {
    font-family: var(--font-mono, monospace);
    font-weight: 700;
    color: #9c8d76;
    font-size: 0.82rem;
  }

  .col-user {
    min-width: 140px;
  }

  .masked-email {
    color: #e5dac2;
    font-size: 0.82rem;
  }

  .col-count {
    width: 130px;
  }

  .count-value {
    color: #ffd700;
    font-size: 0.9rem;
  }

  .col-reward {
    width: 130px;
  }

  .reward-value {
    font-weight: 600;
    color: #f7eed8;
  }

  .col-badge {
    min-width: 150px;
  }

  .badge-tag {
    display: inline-block;
    padding: 0.2rem 0.55rem;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 600;
    background: rgba(36, 25, 62, 0.85);
    color: #ffd700;
    border: 1px solid rgba(212, 175, 55, 0.25);
    white-space: nowrap;
  }

  /* 4. Recent Referrals Card */
  .recent-card {
    padding: 1.1rem 1.3rem;
    border-radius: 16px;
    background: rgba(18, 12, 38, 0.75);
    border: 1px solid rgba(212, 175, 55, 0.2);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .empty-recent {
    text-align: center;
    padding: 1.2rem;
    color: #8c7e6b;
    font-size: 0.8rem;
    font-style: italic;
  }

  .recent-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .recent-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.85rem;
    border-radius: 10px;
    background: rgba(10, 7, 24, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 0.8rem;
  }

  .recent-user {
    display: flex;
    align-items: center;
    gap: 0.55rem;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
  }

  .ref-email {
    color: #ddd2bd;
    font-size: 0.8rem;
  }

  .recent-meta {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .ref-date {
    font-size: 0.72rem;
    color: #8c7e6b;
  }

  .ref-reward {
    color: #34d399;
    font-size: 0.82rem;
  }

  /* Footer */
  .hub-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-top: 1px solid rgba(212, 175, 55, 0.2);
    background: rgba(10, 7, 24, 0.95);
  }

  .footer-note {
    margin: 0;
    font-size: 0.73rem;
    color: #8c7e6b;
  }

  .btn-modal-close {
    padding: 0.55rem 1.4rem;
    border-radius: 10px;
    background: rgba(36, 25, 62, 0.9);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #f7eed8;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-modal-close:hover {
    background: rgba(212, 175, 55, 0.2);
    color: #ffd700;
  }

  /* Utilities */
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .font-bold { font-weight: 700; }
  .font-mono { font-family: var(--font-mono, monospace); }

  /* Keyframe Animations */
  @keyframes hubFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes hubSlideUp {
    from {
      opacity: 0;
      transform: translateY(18px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* =========================================================================
     RESPONSIVE BREAKPOINTS
     ========================================================================= */
  @media (max-width: 640px) {
    .hub-overlay {
      padding: 0.5rem;
    }

    .hub-modal {
      max-height: 96vh;
      border-radius: 16px;
    }

    .hub-header {
      padding: 0.85rem 1rem;
    }

    .trophy-badge {
      width: 36px;
      height: 36px;
    }

    .modal-title {
      font-size: 0.98rem;
    }

    .hub-body {
      padding: 0.9rem 1rem;
      gap: 1rem;
    }

    .tier-card {
      padding: 1rem;
    }

    .tier-main {
      flex-direction: column;
      text-align: center;
    }

    .tier-title-row {
      justify-content: center;
    }

    .tier-progress-track {
      margin: 0 auto;
    }

    .link-actions {
      flex-direction: column;
      width: 100%;
    }

    .link-input-box {
      width: 100%;
      min-width: 0;
    }

    .link-btn-group {
      width: 100%;
    }

    .btn-copy {
      flex: 1;
      justify-content: center;
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: 0.65rem;
    }

    .stat-box {
      padding: 0.85rem 1rem;
    }

    .stat-num {
      font-size: 1.4rem;
    }

    .rank-table th,
    .rank-table td {
      padding: 0.5rem 0.45rem;
      font-size: 0.75rem;
    }

    .hub-footer {
      flex-direction: column;
      gap: 0.65rem;
      text-align: center;
      padding: 0.85rem 1rem;
    }

    .btn-modal-close {
      width: 100%;
    }
  }
</style>
