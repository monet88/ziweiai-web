<script lang="ts">
  import { useQueryClient } from '@tanstack/svelte-query';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { isDisposableEmail } from '@ziweiai/contracts';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { NoticeBanner, ViOSLogo } from '$lib/components/ui';
  import TurnstileWidget from '$lib/components/security/TurnstileWidget.svelte';
  import { viCopy } from '$lib/i18n/vi';

  const t = viCopy.signIn;
  const auth = getAuthStore();
  const queryClient = useQueryClient();

  let email = $state('');
  let password = $state('');
  let mode = $state<'sign-in' | 'sign-up'>('sign-in');
  let errorMessage = $state<string | null>(null);
  let noticeMessage = $state<string | null>(null);
  let isBusy = $state(false);
  let turnstileWidget = $state<any>(null);

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
        if (isDisposableEmail(email)) {
          errorMessage =
            'Hệ thống không chấp nhận email tạm thời. Vui lòng sử dụng Gmail hoặc đăng nhập Google 1-Click để nhận XU thưởng an toàn.';
          isBusy = false;
          return;
        }

        // Invisible Turnstile bot defense verification
        const turnstileToken = await turnstileWidget?.execute?.();
        if (turnstileToken) {
          try {
            const { fetchJson } = await import('$lib/api-client/fetch-json');
            const { TurnstileVerifyResponseSchema } = await import('@ziweiai/contracts');
            await fetchJson('/auth/turnstile/verify', TurnstileVerifyResponseSchema, {
              method: 'POST',
              body: { token: turnstileToken },
            });
          } catch {
            errorMessage =
              'Xác thực chống bot tự động không thành công. Vui lòng tải lại trang và thử lại.';
            isBusy = false;
            return;
          }
        }

        const { needsEmailConfirmation } = await auth.signUpWithPassword(email, password);
        if (needsEmailConfirmation) {
          noticeMessage = t.signUpCheckEmail;
        } else {
          queryClient.clear();
          await goto(resolve('/'));
        }
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : t.genericError;
    } finally {
      isBusy = false;
    }
  }

  async function handleGoogleSignIn() {
    if (isBusy) return;
    isBusy = true;
    errorMessage = null;
    try {
      await auth.signInWithGoogle();
      // Supabase OAuth redirects to provider, we don't need to do anything else here
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : t.genericError;
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
  <title>{mode === 'sign-in' ? t.headTitleSignIn : t.headTitleSignUp} - ViOS</title>
</svelte:head>

<main class="screen">
  <div class="shell">
    <section class="intro" aria-label="ViOS">
      <div class="brand-wrapper">
        <ViOSLogo size="lg" showTagline={true} />
      </div>
      <p class="intro-copy">{t.introCopy}</p>
    </section>

    <form class="card" onsubmit={handleSubmit}>
      <div class="header">
        <p class="eyebrow">{mode === 'sign-in' ? t.eyebrowSignIn : t.eyebrowSignUp}</p>
        <h1 class="title">{mode === 'sign-in' ? t.titleSignIn : t.titleSignUp}</h1>
        <p class="subtitle">{t.subtitle}</p>
      </div>

      {#if errorMessage}
        <NoticeBanner tone="danger" message={errorMessage} />
      {/if}
      {#if noticeMessage}
        <NoticeBanner tone="info" message={noticeMessage} />
      {/if}

      <label class="field">
        <span>{t.emailLabel}</span>
        <input
          type="email"
          bind:value={email}
          placeholder={t.emailPlaceholder}
          autocomplete="email"
          required
        />
      </label>

      <label class="field">
        <span>{t.passwordLabel}</span>
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
          {t.submitBusy}
        {:else}
          {mode === 'sign-in' ? t.submitSignIn : t.submitSignUp}
        {/if}
      </button>

      <button type="button" class="switch" onclick={toggleMode}>
        {mode === 'sign-in' ? t.switchToSignUp : t.switchToSignIn}
      </button>

      <div class="divider">
        <span>Hoặc</span>
      </div>

      <button type="button" class="google-btn" onclick={handleGoogleSignIn} disabled={isBusy}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
        Tiếp tục với Google
      </button>

      <TurnstileWidget bind:this={turnstileWidget} action="signup" />
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
      linear-gradient(180deg, var(--color-bg-surface) 0%, var(--color-bg-primary) 320px),
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

  .divider {
    display: flex;
    align-items: center;
    text-align: center;
    margin: 8px 0;
    color: var(--color-text-muted);
    font-size: 14px;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid var(--color-border-hairline);
  }

  .divider span {
    padding: 0 16px;
  }

  .google-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 48px;
    padding: 0 var(--space-md);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-sm);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .google-btn:hover:not(:disabled) {
    background: var(--color-bg-primary);
    border-color: var(--color-border-strong);
  }

  .google-btn:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }

  .google-btn:disabled {
    opacity: 0.6;
    cursor: progress;
  }
</style>
