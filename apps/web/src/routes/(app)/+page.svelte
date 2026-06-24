<script lang="ts">
  // Dashboard — màn chính sau đăng nhập (US-005). Bố cục 2 cột qua AppScaffold:
  // main = BirthForm (tạo lá số), sidebar = DashboardSidebar (lịch sử gần đây limit 8).
  // <1080px sidebar xếp xuống dưới (AppScaffold media query); <768px form gom 1 cột (CSS).
  //
  // Model dashboard khởi tạo một lần ở đây (factory runes) rồi truyền xuống BirthForm.
  // Đăng xuất: clear cache query để không rò dữ liệu user cũ (bất biến token tươi §3).
  import { useQueryClient } from '@tanstack/svelte-query';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { AppScaffold, PrimaryButton } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import { createDashboardModel } from '$lib/features/dashboard/dashboard-model.svelte';
  import BirthForm from '$lib/features/dashboard/BirthForm.svelte';
  import DashboardSidebar from '$lib/features/dashboard/DashboardSidebar.svelte';
  import ExtendedSystemNav from '$lib/features/dashboard/ExtendedSystemNav.svelte';

  const auth = getAuthStore();
  const queryClient = useQueryClient();

  const model = createDashboardModel({ auth, queryClient });

  let isSigningOut = $state(false);

  async function handleSignOut(): Promise<void> {
    if (isSigningOut) {
      return;
    }
    isSigningOut = true;
    try {
      await auth.signOut();
      queryClient.clear();
      await goto(resolve('/sign-in'), { replaceState: true });
    } finally {
      isSigningOut = false;
    }
  }

  // Cuộn tới form khi sidebar rỗng nhấn "Lập lá số".
  function focusForm(): void {
    document.getElementById('birth-day')?.focus();
  }

  // Lối tắt tới màn hình từng hệ thuật số khác (US-007). Mỗi route đặt mặc định hệ tương
  // ứng cho cùng luồng tạo lá số; nhãn tiếng Việt từ viCopy (bất biến ngôn ngữ).
  // Giữ route literal ở đây (as const) rồi gọi resolve() ngay tại href để vừa qua kiểm tra
  // kiểu route của SvelteKit vừa thoả eslint svelte/no-navigation-without-resolve.
  const systemLinks = [
    { route: '/bazi', label: viCopy.dashboard.openBazi },
    { route: '/meihua', label: viCopy.dashboard.openMeihua },
    { route: '/liuyao', label: viCopy.dashboard.openLiuyao },
    { route: '/daliuren', label: viCopy.dashboard.openDaliuren },
    { route: '/qimen', label: viCopy.dashboard.openQimen },
  ] as const;
</script>

<AppScaffold
  eyebrow={viCopy.dashboard.heroEyebrow}
  title={viCopy.dashboard.heroTitle}
  subtitle={viCopy.dashboard.heroSubtitle}
>
  {#snippet action()}
    <div class="session">
      {#if auth.isAnonymous}
        <span class="session-email">{viCopy.dashboard.anonymousSession}</span>
        <a class="session-cta" href={resolve('/sign-in')}>{viCopy.dashboard.signInOrSignUp}</a>
      {:else}
        <span class="session-email" title={auth.user?.email ?? undefined}
          >{auth.user?.email ?? viCopy.dashboard.unknownUser}</span
        >
        <PrimaryButton
          label={viCopy.dashboard.signOut}
          variant="surface"
          loading={isSigningOut}
          onclick={handleSignOut}
        />
      {/if}
    </div>
  {/snippet}

  {#snippet sidebar()}
    <nav class="system-nav" aria-label="Hệ thuật số khác">
      <h2 class="nav-title">Hệ thuật số khác</h2>
      <div class="nav-links">
        {#each systemLinks as link (link.route)}
          <a class="nav-link" href={resolve(link.route)}>
            {link.label}
          </a>
        {/each}
      </div>
      <ExtendedSystemNav />
      <a class="nav-history" href={resolve('/history')}>
        {viCopy.dashboard.viewHistory}
      </a>
    </nav>
    <DashboardSidebar onCreateFirst={focusForm} />
  {/snippet}


  <BirthForm {model} />
</AppScaffold>

<style>
  .session {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--space-xs);
  }

  .session-email {
    max-width: 220px;
    overflow: hidden;
    color: var(--color-text-muted);
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .session-cta {
    display: inline-flex;
    align-items: center;
    padding: var(--space-xs) var(--space-md);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
    color: var(--color-link);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
  }

  .session-cta:hover {
    background: var(--color-bg-elevated);
  }

  .session-cta:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 1px;
  }

  /* Touch: link phụ ở header đạt vùng chạm 44px khi con trỏ thô (WCAG 2.5.8). */
  @media (pointer: coarse) {
    .session-cta {
      min-height: 44px;
    }
  }

  .system-nav {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .nav-title {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 17px;
    font-weight: 600;
  }

  .nav-links {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(120px, 100%), 1fr));
    grid-auto-rows: 1fr;
    gap: var(--space-xs);
  }

  .nav-link,
  .nav-history {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    height: 100%;
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    font-size: 14px;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }

  .nav-history {
    margin-top: var(--space-xs);
    color: var(--color-link);
    font-weight: 600;
  }

  .nav-link:hover,
  .nav-history:hover {
    border-color: var(--color-accent-primary);
  }

  .nav-link:focus-visible,
  .nav-history:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 1px;
  }
</style>
