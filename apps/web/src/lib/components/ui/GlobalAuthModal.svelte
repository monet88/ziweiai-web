<script lang="ts">
  import { authModalStore } from '$lib/stores/auth-modal.svelte';
  import { PrimaryButton } from '$lib/components/ui';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  function handleGoToSignIn() {
    authModalStore.close();
    goto(resolve('/sign-in'));
  }
</script>

{#if authModalStore.isOpen}
  <div class="auth-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-title">
    <div class="auth-modal">
      <button class="auth-close" aria-label="Đóng" onclick={() => authModalStore.close()}>×</button>
      
      <div class="auth-content">
        <h2 id="auth-title">Yêu cầu Đăng nhập</h2>
        <p class="auth-message">
          {authModalStore.message || 'Vui lòng đăng nhập hoặc tạo tài khoản để sử dụng tính năng này.'}
        </p>
        
        <div class="auth-actions">
          <PrimaryButton label="Đăng nhập ngay" variant="primary" onclick={handleGoToSignIn} />
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .auth-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    padding: var(--space-md);
    animation: fadeIn 0.2s ease-out;
  }

  .auth-modal {
    background-color: var(--color-bg-primary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-lg);
    width: 100%;
    max-width: 400px;
    position: relative;
    overflow: hidden;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .auth-close {
    position: absolute;
    top: var(--space-sm);
    right: var(--space-sm);
    background: none;
    border: none;
    font-size: 24px;
    color: var(--color-text-muted);
    cursor: pointer;
    line-height: 1;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    transition: all 0.2s;
  }

  .auth-close:hover {
    background-color: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }

  .auth-content {
    padding: var(--space-xl);
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  h2 {
    margin: 0;
    font-size: 20px;
    color: var(--color-text-primary);
  }

  .auth-message {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 15px;
    line-height: 1.5;
  }

  .auth-actions {
    margin-top: var(--space-sm);
    display: flex;
    justify-content: center;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
