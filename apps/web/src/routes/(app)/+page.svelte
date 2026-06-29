<script lang="ts">
  // Dashboard home: màn chính sau đăng nhập/ẩn danh. Lát cắt redesign US-041 giữ flow thật:
  // BirthForm để tạo lá số, sidebar hệ thuật số, lịch sử gần đây và điều hướng phiên.
  //
  // Model dashboard khởi tạo một lần ở đây (factory runes) rồi truyền xuống BirthForm.
  // Đăng xuất: clear cache query để không rò dữ liệu user cũ (bất biến token tươi §3).
  import { useQueryClient } from '@tanstack/svelte-query';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { PrimaryButton } from '$lib/components/ui';
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

  const toolLinks = [
    {
      route: '/face',
      title: viCopy.dashboard.toolFaceTitle,
      description: viCopy.dashboard.toolFaceDescription,
      meta: viCopy.dashboard.toolFaceMeta,
    },
    {
      route: '/tarot',
      title: viCopy.dashboard.toolTarotTitle,
      description: viCopy.dashboard.toolTarotDescription,
      meta: viCopy.dashboard.toolTarotMeta,
    },
    {
      route: '/palm',
      title: viCopy.dashboard.toolPalmTitle,
      description: viCopy.dashboard.toolPalmDescription,
      meta: viCopy.dashboard.toolPalmMeta,
    },
  ] as const;

  const promiseCards = [
    {
      title: viCopy.dashboard.promiseTodayTitle,
      description: viCopy.dashboard.promiseTodayDescription,
    },
    {
      title: viCopy.dashboard.promiseChartTitle,
      description: viCopy.dashboard.promiseChartDescription,
    },
    {
      title: viCopy.dashboard.promiseHepanTitle,
      description: viCopy.dashboard.promiseHepanDescription,
    },
    {
      title: viCopy.dashboard.promiseAiTitle,
      description: viCopy.dashboard.promiseAiDescription,
    },
  ] as const;
</script>

<svelte:head>
  <title>{viCopy.dashboard.heroTitle} - ziweiai</title>
</svelte:head>

<main class="dashboard-page">
  <div class="shell">
    <nav class="topbar" aria-label={viCopy.dashboard.homeNavAria}>
      <a class="brand" href={resolve('/')}>ziweiai</a>
      <div class="top-links">
        <a href="#create-chart">{viCopy.dashboard.homeNavCreate}</a>
        <a href={resolve('/history')}>{viCopy.dashboard.homeNavHistory}</a>
        <a href="#systems">{viCopy.dashboard.homeNavSystems}</a>
      </div>
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
    </nav>

    <section class="hero" aria-labelledby="dashboard-hero-title">
      <div class="hero-copy">
        <p class="eyebrow">{viCopy.dashboard.heroEyebrow}</p>
        <h1 id="dashboard-hero-title">{viCopy.dashboard.heroTitle}</h1>
        <p class="hero-subtitle">{viCopy.dashboard.heroSubtitle}</p>
        <div class="hero-actions">
          <a class="hero-primary" href="#create-chart">{viCopy.dashboard.createChart}</a>
          <a class="hero-secondary" href={resolve('/history')}>{viCopy.dashboard.viewHistory}</a>
        </div>
      </div>

      <div class="chart-preview" aria-label={viCopy.dashboard.previewChart}>
        <div class="chart-orbit">
          <span class="orbit-label primary">{viCopy.dashboard.previewPrimaryLabel}</span>
          <span class="orbit-label secondary">{viCopy.dashboard.previewSecondaryLabel}</span>
        </div>
        <div class="preview-grid">
          <div>
            <strong>{viCopy.dashboard.previewChart}</strong>
            <span>{viCopy.dashboard.previewChartHint}</span>
          </div>
          <div>
            <strong>{viCopy.dashboard.previewAi}</strong>
            <span>{viCopy.dashboard.previewAiHint}</span>
          </div>
          <div>
            <strong>{viCopy.dashboard.previewHistory}</strong>
            <span>{viCopy.dashboard.previewHistoryHint}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="tools" id="tools" aria-labelledby="tools-title">
      <div class="section-head compact">
        <h2 id="tools-title">{viCopy.dashboard.toolSectionTitle}</h2>
        <p>{viCopy.dashboard.toolSectionDescription}</p>
      </div>
      <div class="tool-grid">
        {#each toolLinks as tool (tool.route)}
          <a class="tool-card" href={resolve(tool.route)}>
            <span>{tool.meta}</span>
            <strong>{tool.title}</strong>
            <small>{tool.description}</small>
          </a>
        {/each}
      </div>
    </section>

    <section class="workspace" aria-label={viCopy.dashboard.createPanelTitle}>
      <section class="form-panel" id="create-chart" aria-labelledby="create-chart-title">
        <div class="section-head">
          <h2 id="create-chart-title">{viCopy.dashboard.createPanelTitle}</h2>
          <p>{viCopy.dashboard.createPanelDescription}</p>
        </div>
        <BirthForm {model} />
      </section>

      <aside class="side-rail">
        <nav class="system-nav" id="systems" aria-label={viCopy.dashboard.systemNavTitle}>
          <h2 class="nav-title">{viCopy.dashboard.systemNavTitle}</h2>
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
      </aside>
    </section>

    <section class="promise" aria-labelledby="promise-title">
      <div class="section-head compact">
        <h2 id="promise-title">{viCopy.dashboard.railTitle}</h2>
      </div>
      <div class="promise-grid">
        {#each promiseCards as card (card.title)}
          <article class="promise-card">
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </article>
        {/each}
      </div>
    </section>
  </div>
</main>

<style>
  .dashboard-page {
    min-height: 100dvh;
    background:
      radial-gradient(circle at 15% 10%, rgb(255 255 255 / 0.92), transparent 24rem),
      linear-gradient(180deg, #f7f7f5 0%, var(--color-bg-primary) 46%, #ffffff 100%);
    color: var(--color-text-primary);
  }

  .shell {
    box-sizing: border-box;
    width: min(100%, 1220px);
    margin: 0 auto;
    padding: var(--space-md);
  }

  .topbar {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--space-lg);
    min-height: 72px;
    border-bottom: 1px solid rgb(26 26 26 / 0.1);
  }

  .brand {
    color: var(--color-text-primary);
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.4px;
    text-decoration: none;
  }

  .top-links {
    display: flex;
    justify-content: center;
    gap: var(--space-xs);
  }

  .top-links a {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 0 var(--space-md);
    border-radius: var(--radius-pill);
    color: var(--color-text-secondary);
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
  }

  .top-links a:hover {
    background: rgb(26 26 26 / 0.06);
    color: var(--color-text-primary);
  }

  .session {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: flex-end;
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

  /* Touch: link phụ ở header lên 44px khi con trỏ thô; ngưỡng AAA (WCAG 2.5.5), vượt AA 24px. */
  @media (pointer: coarse) {
    .session-cta {
      min-height: 44px;
    }
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(340px, 0.95fr);
    gap: clamp(28px, 5vw, 72px);
    align-items: center;
    min-height: min(720px, calc(100dvh - 72px));
    padding: clamp(40px, 8vw, 92px) 0 clamp(32px, 7vw, 72px);
  }

  .hero-copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
  }

  .eyebrow {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.125px;
  }

  h1 {
    max-width: 760px;
    margin: 0;
    font-size: clamp(44px, 7vw, 92px);
    font-weight: 850;
    line-height: 0.96;
    letter-spacing: -2.6px;
  }

  .hero-subtitle {
    max-width: 650px;
    margin: 0;
    color: var(--color-text-secondary);
    font-size: clamp(17px, 2vw, 21px);
    line-height: 1.55;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    margin-top: var(--space-xs);
  }

  .hero-primary,
  .hero-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    padding: 0 var(--space-lg);
    border-radius: var(--radius-pill);
    font-size: 15px;
    font-weight: 750;
    text-decoration: none;
  }

  .hero-primary {
    background: var(--color-text-primary);
    color: #ffffff;
  }

  .hero-secondary {
    border: 1px solid rgb(26 26 26 / 0.18);
    background: rgb(255 255 255 / 0.76);
    color: var(--color-text-primary);
  }

  .hero-primary:focus-visible,
  .hero-secondary:focus-visible,
  .brand:focus-visible,
  .top-links a:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }

  .chart-preview {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    border: 1px solid rgb(26 26 26 / 0.14);
    border-radius: 28px;
    background: #ffffff;
    padding: clamp(20px, 3vw, 34px);
    box-shadow: 0 24px 80px rgb(0 0 0 / 0.08);
  }

  .chart-orbit {
    position: relative;
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    border: 1px solid rgb(26 26 26 / 0.16);
    border-radius: 50%;
    background:
      linear-gradient(90deg, transparent calc(50% - 0.5px), rgb(26 26 26 / 0.13) 50%, transparent calc(50% + 0.5px)),
      linear-gradient(0deg, transparent calc(50% - 0.5px), rgb(26 26 26 / 0.13) 50%, transparent calc(50% + 0.5px)),
      radial-gradient(circle, transparent 0 26%, rgb(26 26 26 / 0.12) 26.3% 26.8%, transparent 27% 49%, rgb(26 26 26 / 0.1) 49.3% 49.8%, transparent 50%);
  }

  .chart-orbit::before,
  .chart-orbit::after {
    content: "";
    position: absolute;
    inset: 15%;
    border: 1px solid rgb(26 26 26 / 0.12);
    border-radius: 50%;
  }

  .chart-orbit::after {
    inset: 31%;
    background: var(--color-text-primary);
  }

  .orbit-label {
    position: absolute;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 58px;
    min-height: 36px;
    padding: 0 var(--space-sm);
    border: 1px solid rgb(26 26 26 / 0.14);
    border-radius: var(--radius-pill);
    background: #ffffff;
    font-size: 13px;
    font-weight: 750;
  }

  .orbit-label.primary {
    top: 14%;
    left: 10%;
  }

  .orbit-label.secondary {
    right: 8%;
    bottom: 18%;
  }

  .preview-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-sm);
  }

  .preview-grid div,
  .promise-card,
  .form-panel,
  .side-rail,
  .tool-card {
    border: 1px solid rgb(26 26 26 / 0.12);
    background: rgb(255 255 255 / 0.86);
  }

  .preview-grid div {
    min-height: 82px;
    padding: var(--space-md);
    border-radius: var(--radius-lg);
  }

  .preview-grid strong,
  .preview-grid span {
    display: block;
  }

  .preview-grid strong {
    font-size: 14px;
  }

  .preview-grid span {
    margin-top: 6px;
    color: var(--color-text-muted);
    font-size: 12px;
    line-height: 1.35;
  }

  .workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(320px, 390px);
    gap: var(--space-lg);
    align-items: start;
  }

  .tools {
    display: grid;
    grid-template-columns: minmax(260px, 0.42fr) minmax(0, 1fr);
    gap: var(--space-lg);
    align-items: stretch;
    padding: 0 0 clamp(32px, 5vw, 64px);
  }

  .tool-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-md);
  }

  .tool-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    min-height: 168px;
    padding: var(--space-lg);
    border-radius: 18px;
    color: var(--color-text-primary);
    text-decoration: none;
  }

  .tool-card span {
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .tool-card strong {
    font-size: 24px;
    font-weight: 780;
    letter-spacing: -0.02em;
    line-height: 1.08;
  }

  .tool-card small {
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 1.5;
  }

  .tool-card:hover {
    border-color: var(--color-text-primary);
    background: #ffffff;
  }

  .tool-card:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }

  .form-panel,
  .side-rail,
  .promise-card {
    border-radius: 24px;
  }

  .form-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
    padding: clamp(20px, 4vw, 38px);
  }

  .side-rail {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
    padding: var(--space-lg);
  }

  .section-head {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .section-head h2 {
    margin: 0;
    font-size: clamp(28px, 4vw, 48px);
    font-weight: 820;
    line-height: 1;
    letter-spacing: -1.4px;
  }

  .section-head p {
    max-width: 620px;
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 16px;
    line-height: 1.55;
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

  .promise {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    padding: clamp(44px, 7vw, 88px) 0;
  }

  .section-head.compact {
    max-width: 520px;
  }

  .promise-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-md);
  }

  .promise-card {
    min-height: 188px;
    padding: var(--space-lg);
  }

  .promise-card h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 760;
    letter-spacing: -0.25px;
  }

  .promise-card p {
    margin: var(--space-sm) 0 0;
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 1.55;
  }

  @media (max-width: 980px) {
    .topbar,
    .hero,
    .workspace,
    .tools {
      grid-template-columns: 1fr;
    }

    .top-links {
      justify-content: flex-start;
      order: 3;
      grid-column: 1 / -1;
      overflow-x: auto;
      padding-bottom: var(--space-xs);
    }

    .session {
      align-items: flex-end;
    }

    .hero {
      min-height: auto;
    }

    .promise-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .tool-grid {
      grid-template-columns: repeat(3, minmax(180px, 1fr));
      overflow-x: auto;
      padding-bottom: var(--space-xs);
    }
  }

  @media (max-width: 620px) {
    .shell {
      padding: var(--space-sm);
    }

    .topbar {
      min-height: 64px;
      gap: var(--space-sm);
    }

    .session {
      align-items: flex-start;
    }

    h1 {
      font-size: clamp(40px, 14vw, 58px);
      letter-spacing: -1.6px;
    }

    .preview-grid,
    .tool-grid,
    .promise-grid {
      grid-template-columns: 1fr;
      overflow: visible;
    }

    .form-panel,
    .side-rail,
    .chart-preview {
      border-radius: var(--radius-xl);
    }
  }
</style>
