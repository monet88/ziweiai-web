<script lang="ts">
  import { useQueryClient } from '@tanstack/svelte-query';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { getAuthStore } from '$lib/auth/auth-context';

  // Nhãn tiếng Việt hardcode tạm — i18n tập trung là US-003 (bất biến ngôn ngữ: không chữ Hán).
  const auth = getAuthStore();
  const queryClient = useQueryClient();

  let email = $state('');
  let password = $state('');
  let mode = $state<'sign-in' | 'sign-up'>('sign-in');
  let errorMessage = $state<string | null>(null);
  let noticeMessage = $state<string | null>(null);
  let isBusy = $state(false);

  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (isBusy) {
      return;
    }

    isBusy = true;
    errorMessage = null;
    noticeMessage = null;

    try {
      if (mode === 'sign-in') {
        await auth.signInWithPassword(email, password);
        // Chuyển từ phiên ẩn danh (decision 0009) sang phiên email → xoá cache query
        // để không rò dữ liệu/lịch sử của phiên anon trước đó (bất biến token tươi §3).
        queryClient.clear();
        await goto(resolve('/'));
      } else {
        const { needsEmailConfirmation } = await auth.signUpWithPassword(email, password);
        if (needsEmailConfirmation) {
          noticeMessage = 'Tài khoản đã tạo. Vui lòng kiểm tra email để xác nhận trước khi đăng nhập.';
        } else {
          queryClient.clear();
          await goto(resolve('/'));
        }
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Xác thực thất bại. Vui lòng thử lại.';
    } finally {
      isBusy = false;
    }
  }

  function toggleMode() {
    mode = mode === 'sign-in' ? 'sign-up' : 'sign-in';
    errorMessage = null;
    noticeMessage = null;
  }
</script>

<main class="screen">
  <form class="card" onsubmit={handleSubmit}>
    <p class="eyebrow">ZIWEIAI</p>
    <h1 class="title">{mode === 'sign-in' ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
    <p class="subtitle">Luận giải Tử Vi và chiêm tinh cá nhân hoá.</p>

    {#if errorMessage}
      <p class="banner danger" role="alert">{errorMessage}</p>
    {/if}
    {#if noticeMessage}
      <p class="banner info">{noticeMessage}</p>
    {/if}

    <label class="field">
      <span>Email</span>
      <input
        type="email"
        bind:value={email}
        placeholder="ban@vidu.com"
        autocomplete="email"
        required
      />
    </label>

    <label class="field">
      <span>Mật khẩu</span>
      <input
        type="password"
        bind:value={password}
        placeholder="••••••••"
        autocomplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
        required
      />
    </label>

    <button type="submit" class="primary" disabled={isBusy}>
      {#if isBusy}
        Đang xử lý…
      {:else}
        {mode === 'sign-in' ? 'Đăng nhập' : 'Tạo tài khoản'}
      {/if}
    </button>

    <button type="button" class="switch" onclick={toggleMode}>
      {mode === 'sign-in' ? 'Chưa có tài khoản? Tạo mới' : 'Đã có tài khoản? Đăng nhập'}
    </button>
  </form>
</main>

<style>
  .screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: var(--space-lg);
    background: var(--color-bg-primary);
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    width: 100%;
    max-width: 420px;
    padding: var(--space-xl);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-lg);
    background: var(--color-bg-surface);
  }

  .eyebrow {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.125px;
    color: var(--color-text-muted);
  }

  .title {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.625px;
    color: var(--color-text-primary);
  }

  .subtitle {
    margin: 0 0 var(--space-xs);
    color: var(--color-text-muted);
    font-size: 15px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xxs);
    font-size: 14px;
    color: var(--color-text-secondary);
  }

  .field input {
    padding: var(--space-xs) var(--space-sm);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-xs);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    font-size: 16px;
  }

  .field input:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 1px;
  }

  .primary {
    padding: var(--space-sm) var(--space-md);
    border: none;
    border-radius: var(--radius-pill);
    background: var(--color-accent-primary);
    color: var(--color-text-on-primary);
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
  }

  .primary:hover:not(:disabled) {
    background: var(--color-accent-primary-pressed);
  }

  .primary:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }

  .primary:disabled {
    opacity: 0.6;
    cursor: progress;
  }

  .switch {
    background: none;
    border: none;
    color: var(--color-link);
    font-size: 14px;
    cursor: pointer;
  }

  .switch:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }

  .banner {
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    font-size: 14px;
    margin: 0;
  }

  .banner.danger {
    border: 1px solid var(--color-accent-danger);
    background: var(--color-bg-surface);
    color: var(--color-accent-danger);
  }

  .banner.info {
    border: 1px solid var(--color-accent-primary);
    background: var(--color-bg-surface);
    color: var(--color-accent-primary-pressed);
  }
</style>
