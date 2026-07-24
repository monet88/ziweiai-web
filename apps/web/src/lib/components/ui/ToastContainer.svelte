<script lang="ts">
  import { toast } from '$lib/stores/toast';
</script>

<div class="toast-container" aria-live="polite">
  {#each $toast as item (item.id)}
    <div
      class="toast-item {item.type ?? 'success'}"
      onclick={() => toast.dismiss(item.id)}
      role="button"
      tabindex="0"
      onkeydown={(e) => e.key === 'Enter' && toast.dismiss(item.id)}
    >
      <span class="toast-text">{item.message}</span>
      <button class="close-btn" aria-label="Đóng">&times;</button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 380px;
    width: calc(100vw - 40px);
    pointer-events: none;
  }

  .toast-item {
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
    color: #ffffff;
    background: rgba(17, 24, 39, 0.92);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    cursor: pointer;
    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .toast-item.success {
    border-color: rgba(245, 158, 11, 0.6);
    background: linear-gradient(135deg, rgba(30, 27, 15, 0.95), rgba(15, 12, 5, 0.95));
    color: #fef08a;
  }

  .toast-item.danger {
    border-color: rgba(239, 68, 68, 0.5);
    background: rgba(69, 10, 10, 0.95);
    color: #fca5a5;
  }

  .toast-text {
    flex: 1;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: inherit;
    font-size: 18px;
    cursor: pointer;
    opacity: 0.7;
    padding: 0;
    line-height: 1;
  }

  .close-btn:hover {
    opacity: 1;
  }

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
