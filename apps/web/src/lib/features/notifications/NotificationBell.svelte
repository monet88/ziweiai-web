<script lang="ts">
  import { notificationStore } from './notification-store.svelte';
  import { Bell } from 'lucide-svelte';

  interface Props {
    class?: string;
  }

  let { class: customClass = '' }: Props = $props();

  let unreadCount = $derived(notificationStore.unreadCount);
</script>

<button
  type="button"
  class="notification-bell-btn {customClass}"
  class:has-unread={unreadCount > 0}
  onclick={() => notificationStore.toggleDrawer()}
  aria-label={`Thông báo (${unreadCount} chưa đọc)`}
  title={unreadCount > 0 ? `Bạn có ${unreadCount} thông báo mới` : 'Trung tâm thông báo'}
>
  <Bell size={18} class="bell-icon" />

  {#if unreadCount > 0}
    <span class="unread-badge">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  {/if}
</button>

<style>
  .notification-bell-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(212, 175, 55, 0.25);
    color: #e8dcc4;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 0;
  }

  .notification-bell-btn:hover {
    background: rgba(212, 175, 55, 0.18);
    border-color: rgba(212, 175, 55, 0.6);
    color: #ffd700;
    transform: translateY(-1px);
    box-shadow: 0 0 16px rgba(212, 175, 55, 0.25);
  }

  :global(.bell-icon) {
    transition: transform 0.3s ease;
  }

  .notification-bell-btn:hover :global(.bell-icon) {
    transform: rotate(15deg);
  }

  .has-unread :global(.bell-icon) {
    animation: bellSwing 2s ease-in-out infinite;
    color: #ffd700;
  }

  .unread-badge {
    position: absolute;
    top: -3px;
    right: -3px;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: #ffffff;
    font-size: 10px;
    font-weight: 800;
    min-width: 17px;
    height: 17px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    border: 1.5px solid #130c2b;
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
  }

  @keyframes bellSwing {
    0%, 100% { transform: rotate(0deg); }
    10%, 30% { transform: rotate(14deg); }
    20%, 40% { transform: rotate(-14deg); }
    50% { transform: rotate(0deg); }
  }

  :global([data-theme="light"]) .notification-bell-btn {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(212, 175, 55, 0.4);
    color: #451a03;
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.12);
  }

  :global([data-theme="light"]) .notification-bell-btn:hover {
    background: #ffffff;
    border-color: #b45309;
    color: #78350f;
  }

  :global([data-theme="light"]) .unread-badge {
    border-color: #ffffff;
  }
</style>
