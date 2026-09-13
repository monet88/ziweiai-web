<script lang="ts">
  import { getAuthStore } from '$lib/auth/auth-context';
  import { getWalletStore } from '$lib/features/payment/wallet-context';
  import { authModalStore } from '$lib/stores/auth-modal.svelte';
  import { notificationStore } from '$lib/features/notifications/notification-store.svelte';
  import TurnstileWidget from '$lib/components/security/TurnstileWidget.svelte';
  import { toast } from '$lib/stores/toast';
  import {
    Gift,
    Flame,
    CheckCircle2,
    Sparkles,
    Crown
  } from 'lucide-svelte';

  interface Props {
    compact?: boolean;
  }

  let { compact = false }: Props = $props();

  const auth = getAuthStore();
  const wallet = getWalletStore();

  let checkinBusy = $state(false);
  let checkinError = $state<string | null>(null);
  let turnstileWidget = $state<any>(null);

  // Chuỗi 7 ngày điểm danh với phần thưởng cân bằng kinh tế học (1 XU/ngày, ngày 7 nhận 3 XU)
  const streakDays = [
    { day: 1, reward: 1, label: 'Ngày 1' },
    { day: 2, reward: 1, label: 'Ngày 2' },
    { day: 3, reward: 1, label: 'Ngày 3' },
    { day: 4, reward: 1, label: 'Ngày 4' },
    { day: 5, reward: 1, label: 'Ngày 5' },
    { day: 6, reward: 1, label: 'Ngày 6' },
    { day: 7, reward: 3, label: 'Ngày 7', jackpot: true }
  ];

  async function handleCheckin() {
    if (!auth.user || auth.isAnonymous) {
      authModalStore.open('Vui lòng đăng nhập để điểm danh nhận XU khởi vận và tích lũy chuỗi ngày hoàng đạo.');
      return;
    }

    if (!wallet.canCheckin || checkinBusy) return;

    checkinBusy = true;
    checkinError = null;

    try {
      const turnstileToken = await turnstileWidget?.execute?.();
      const res = await wallet.checkin(turnstileToken);

      if (res.success) {
        toast.show(`🎉 Điểm danh thành công! +${res.xu_added} XU đã được cộng vào ví của bạn.`, 'success');
        notificationStore.pushNotification({
          id: `checkin-${Date.now()}`,
          type: 'checkin_reward',
          title: 'Điểm Danh Hoàng Kim Thành Công',
          body: `+${res.xu_added} XU đã được cộng vào tài khoản của bạn. Hãy duy trì chuỗi ngày hoàng đạo!`,
          amountXu: res.xu_added,
          link: '/wallet',
          createdAt: new Date().toISOString(),
          isRead: false
        });
      } else {
        checkinError = 'Không thể điểm danh lúc này, vui lòng thử lại sau.';
      }
    } catch (err: any) {
      checkinError = err instanceof Error ? err.message : 'Lỗi hệ thống khi điểm danh';
    } finally {
      checkinBusy = false;
    }
  }

  function handleRequireAuth() {
    authModalStore.open('Vui lòng đăng nhập để điểm danh nhận XU khởi vận và tích lũy chuỗi ngày hoàng đạo.');
  }
</script>

<div class="daily-checkin-widget" class:compact-mode={compact}>
  <div class="widget-header">
    <div class="header-left">
      <div class="streak-flame-box">
        <Flame size={20} class="flame-icon" />
      </div>
      <div>
        <h3 class="widget-title">Điểm Danh Khởi Vận 7 Ngày</h3>
        <p class="widget-desc">Duy trì chuỗi điểm danh 7 ngày để nhận Jackpot <strong>+3 XU</strong> (Mỗi ngày +1 XU)</p>
      </div>
    </div>

    <div class="status-indicator">
      {#if !auth.user || auth.isAnonymous}
        <span class="badge-status-neutral">Chưa đăng nhập</span>
      {:else if wallet.canCheckin}
        <span class="badge-status-ready">
          <span class="ready-dot"></span>
          Sẵn sàng nhận
        </span>
      {:else}
        <span class="badge-status-done">
          <CheckCircle2 size={13} />
          Đã điểm danh hôm nay
        </span>
      {/if}
    </div>
  </div>

  <!-- 7-Day Streak Track -->
  <div class="streak-track">
    {#each streakDays as item, index (item.day)}
      {@const isDone = !wallet.canCheckin && index === 0}
      {@const isCurrent = wallet.canCheckin && index === 0}
      <div
        class="streak-day-card"
        class:is-done={isDone}
        class:is-current={isCurrent}
        class:is-jackpot={item.jackpot}
      >
        <span class="day-label">{item.label}</span>
        <div class="day-icon-wrap">
          {#if isDone}
            <CheckCircle2 size={18} class="text-emerald" />
          {:else if item.jackpot}
            <Crown size={18} class="text-gold animate-bounce" />
          {:else}
            <Gift size={16} class={isCurrent ? 'text-gold' : 'text-muted'} />
          {/if}
        </div>
        <span class="reward-pill" class:jackpot-pill={item.jackpot}>
          +{item.reward} XU
        </span>
      </div>
    {/each}
  </div>

  <!-- Action Bar -->
  <div class="widget-action-bar">
    {#if checkinError}
      <p class="error-notice">{checkinError}</p>
    {/if}

    {#if !auth.user || auth.isAnonymous}
      <button type="button" class="btn-checkin btn-auth" onclick={handleRequireAuth}>
        <Sparkles size={16} />
        <span>Đăng Nhập Nhận XU Khởi Vận</span>
      </button>
    {:else if wallet.canCheckin}
      <button
        type="button"
        class="btn-checkin btn-ready"
        onclick={handleCheckin}
        disabled={checkinBusy}
      >
        {#if checkinBusy}
          <span class="spinner"></span>
          <span>Đang ghi nhận...</span>
        {:else}
          <Gift size={16} />
          <span>Điểm Danh Ngay (+1 XU)</span>
        {/if}
      </button>
    {:else}
      <button type="button" class="btn-checkin btn-completed" disabled>
        <CheckCircle2 size={16} />
        <span>Đã Điểm Danh Hôm Nay — Hẹn Gặp Ngày Mai!</span>
      </button>
    {/if}
  </div>

  <TurnstileWidget bind:this={turnstileWidget} action="daily_checkin" />
</div>

<style>
  .daily-checkin-widget {
    background: linear-gradient(135deg, rgba(26, 18, 48, 0.75) 0%, rgba(13, 9, 30, 0.9) 100%);
    border: 1px solid rgba(212, 175, 55, 0.35);
    border-radius: 20px;
    padding: 20px 24px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(212, 175, 55, 0.05);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    display: flex;
    flex-direction: column;
    gap: 16px;
    color: #f7eed8;
    position: relative;
    overflow: hidden;
  }

  .daily-checkin-widget::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 30% 20%, rgba(212, 175, 55, 0.08), transparent 50%);
    pointer-events: none;
  }

  /* Header */
  .widget-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .streak-flame-box {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.flame-icon) {
    color: #f59e0b;
    animation: flamePulse 2s ease-in-out infinite;
  }

  @keyframes flamePulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.12); }
  }

  .widget-title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 17px;
    font-weight: 700;
    color: #f7eed8;
  }

  .widget-desc {
    margin: 0;
    font-size: 12.5px;
    color: rgba(232, 220, 196, 0.75);
  }

  .widget-desc strong {
    color: #ffd700;
  }

  /* Status Badge */
  .status-indicator {
    font-size: 12px;
    font-weight: 600;
  }

  .badge-status-neutral {
    background: rgba(255, 255, 255, 0.08);
    color: #e8dcc4;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  .badge-status-ready {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(16, 185, 129, 0.35);
  }

  .ready-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
    animation: pulse 1.5s infinite;
  }

  .badge-status-done {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(212, 175, 55, 0.12);
    color: #ffd700;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(212, 175, 55, 0.35);
  }

  /* Streak Track */
  .streak-track {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
  }

  @media (max-width: 600px) {
    .streak-track {
      gap: 5px;
    }
  }

  .streak-day-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 10px 4px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: all 0.2s ease;
  }

  .streak-day-card.is-current {
    background: rgba(212, 175, 55, 0.15);
    border-color: #ffd700;
    box-shadow: 0 0 14px rgba(212, 175, 55, 0.3);
    transform: translateY(-2px);
  }

  .streak-day-card.is-done {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.35);
  }

  .streak-day-card.is-jackpot {
    background: linear-gradient(180deg, rgba(212, 175, 55, 0.15) 0%, rgba(245, 158, 11, 0.25) 100%);
    border-color: rgba(212, 175, 55, 0.5);
  }

  .day-label {
    font-size: 11px;
    font-weight: 600;
    color: rgba(232, 220, 196, 0.7);
  }

  .day-icon-wrap {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .reward-pill {
    font-size: 10.5px;
    font-weight: 700;
    color: #e8dcc4;
    padding: 1px 4px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.06);
  }

  .is-current .reward-pill {
    color: #ffd700;
    background: rgba(212, 175, 55, 0.25);
  }

  .jackpot-pill {
    color: #ffd700 !important;
    background: rgba(245, 158, 11, 0.3) !important;
    font-weight: 800;
  }

  :global(.text-gold) {
    color: #ffd700;
  }

  :global(.text-emerald) {
    color: #34d399;
  }

  :global(.text-muted) {
    color: rgba(232, 220, 196, 0.4);
  }

  /* Action Bar */
  .widget-action-bar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .error-notice {
    margin: 0;
    font-size: 12.5px;
    color: #f87171;
  }

  .btn-checkin {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .btn-ready {
    background: linear-gradient(135deg, #d4af37 0%, #f59e0b 100%);
    border: 1px solid #ffe57f;
    color: #090615;
    box-shadow: 0 4px 16px rgba(212, 175, 55, 0.35);
  }

  .btn-ready:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(212, 175, 55, 0.55);
  }

  .btn-auth {
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.4);
    color: #ffd700;
  }

  .btn-auth:hover {
    background: rgba(212, 175, 55, 0.28);
    border-color: #ffd700;
    transform: translateY(-1px);
  }

  .btn-completed {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(232, 220, 196, 0.6);
    cursor: default;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(9, 6, 21, 0.2);
    border-top-color: #090615;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0% { transform: scale(0.9); opacity: 0.6; }
    50% { transform: scale(1.3); opacity: 1; }
    100% { transform: scale(0.9); opacity: 0.6; }
  }
</style>
