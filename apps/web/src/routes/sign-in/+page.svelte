<script lang="ts">
  import { useQueryClient } from '@tanstack/svelte-query';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { NoticeBanner } from '$lib/components/ui';

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

<svelte:head>
  <title>{mode === 'sign-in' ? 'Đăng nhập' : 'Tạo tài khoản'} - ziweiai</title>
</svelte:head>

<main class="screen">
  <div class="shell">
    <section class="intro" aria-label="ziweiai">
      <p class="brand">ZIWEIAI</p>
      <p class="intro-copy">Luận giải Tử Vi và chiêm tinh cá nhân hoá trong một không gian đọc tĩnh.</p>
    </section>

    <form class="card" onsubmit={handleSubmit}>
      <div class="header">
        <p class="eyebrow">{mode === 'sign-in' ? 'Phiên cá nhân' : 'Tài khoản mới'}</p>
        <h1 class="title">{mode === 'sign-in' ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
        <p class="subtitle">Tiếp tục hồ sơ và lịch sử luận giải của bạn.</p>
      </div>

      {#if errorMessage}
        <NoticeBanner tone="danger" message={errorMessage} />
      {/if}
      {#if noticeMessage}
        <NoticeBanner tone="info" message={noticeMessage} />
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
  </div>
</main>

<style>
  .screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100dvh;
    padding: 40px var(--space-lg);
    background:
      linear-gradient(180deg, var(--color-bg-surface) 0, var(--color-bg-primary) 320px),
      var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  .shell {
    box-sizing: border-box;
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(380px, 460px);
    gap: 48px;
    width: 100%;
    max-width: 980px;
    align-items: center;
  }

  .intro {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding-right: 24px;
  }

  .brand {
    margin: 0;
    width: fit-content;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--color-border-hairline);
    color: var(--color-text-muted);
    font-size: var(--text-eyebrow);
    font-weight: 700;
    letter-spacing: var(--tracking-eyebrow);
  }

  .intro-copy {
    margin: 0;
    max-width: 12ch;
    color: var(--color-text-primary);
    font-size: var(--text-h1);
    font-weight: 700;
    letter-spacing: 0;
    line-height: var(--text-h1-line);
    text-wrap: balance;
  }

  .card {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 18px;
    width: 100%;
    padding: 36px;
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-sm);
    background: var(--color-bg-surface);
  }

  .header {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--color-border-hairline);
  }

  .eyebrow {
    margin: 0;
    font-size: var(--text-eyebrow);
    font-weight: 700;
    letter-spacing: var(--tracking-eyebrow);
    color: var(--color-text-muted);
  }

  .title {
    margin: 0;
    font-size: var(--text-h2);
    font-weight: 700;
    letter-spacing: 0;
    line-height: var(--text-h2-line);
    color: var(--color-text-primary);
    text-wrap: balance;
  }

  .subtitle {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--text-body-sm);
    line-height: var(--text-body-sm-line);
    text-wrap: pretty;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .field input {
    min-height: 48px;
    box-sizing: border-box;
    padding: 0 var(--space-sm);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-sm);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    font-size: 16px;
  }

  .field input::placeholder {
    color: var(--color-text-muted);
  }

  .field input:hover {
    border-color: var(--color-border-strong);
  }

  .field input:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }

  .primary {
    min-height: 48px;
    padding: 0 var(--space-md);
    border: none;
    border-radius: var(--radius-sm);
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
    align-self: flex-start;
    min-height: 36px;
    padding: 0;
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

  /* Touch: nút chuyển đăng nhập/đăng ký là chữ trần (~18px cao) — nâng lên 44px khi con trỏ
     thô; 44px là ngưỡng AAA (WCAG 2.5.5), vượt mức AA 24px (2.5.8). */
  @media (pointer: coarse) {
    .switch {
      min-height: 44px;
    }
  }

  @media (max-width: 760px) {
    .screen {
      align-items: flex-start;
      padding: var(--space-lg) var(--space-md);
    }

    .shell {
      grid-template-columns: 1fr;
      gap: 28px;
      max-width: 480px;
    }

    .intro {
      padding-right: 0;
    }

    .intro-copy {
      max-width: 16ch;
    }

    .card {
      padding: var(--space-lg);
    }
  }

  @media (max-width: 420px) {
    .intro-copy,
    .title {
      max-width: none;
    }
  }
</style>
