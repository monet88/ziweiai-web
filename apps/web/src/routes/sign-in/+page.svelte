<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { getAuthStore } from '$lib/auth/auth-context';

  // Nhãn tiếng Việt hardcode tạm — i18n tập trung là US-003 (bất biến ngôn ngữ: không chữ Hán).
  const auth = getAuthStore();

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
        await goto(resolve('/'));
      } else {
        const { needsEmailConfirmation } = await auth.signUpWithPassword(email, password);
        if (needsEmailConfirmation) {
          noticeMessage = 'Tài khoản đã tạo. Vui lòng kiểm tra email để xác nhận trước khi đăng nhập.';
        } else {
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
    padding: 1.5rem;
    font-family: system-ui, sans-serif;
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 30rem;
  }

  .eyebrow {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    color: #b8860b;
  }

  .title {
    font-size: 1.875rem;
    font-weight: 600;
    margin: 0;
  }

  .subtitle {
    color: #6b7280;
    margin: 0 0 0.5rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.875rem;
  }

  .field input {
    padding: 0.65rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
  }

  .primary {
    padding: 0.7rem 1rem;
    border: none;
    border-radius: 0.5rem;
    background: #111827;
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
  }

  .primary:disabled {
    opacity: 0.6;
    cursor: progress;
  }

  .switch {
    background: none;
    border: none;
    color: #b8860b;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .banner {
    padding: 0.6rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    margin: 0;
  }

  .banner.danger {
    background: #fee2e2;
    color: #b91c1c;
  }

  .banner.info {
    background: #dbeafe;
    color: #1e40af;
  }
</style>
