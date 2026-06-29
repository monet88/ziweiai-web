<script lang="ts">
  import type { Snippet } from 'svelte';

  // AppScaffold: khung layout nền cho các màn hình US-006..008. Header (eyebrow/title/
  // subtitle + slot action) + <main> semantic + container responsive. Bố cục 2 cột
  // (main + sidebar) bật ở >=1080px qua CSS media query — KHÔNG đo width bằng JS
  // (useWindowDimensions của RN → media query).
  interface Props {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    action?: Snippet;
    sidebar?: Snippet;
    children: Snippet;
  }

  let { eyebrow, title, subtitle, action, sidebar, children }: Props = $props();
</script>

<div class="screen">
  <div class="container" class:has-sidebar={Boolean(sidebar)}>
    <header class="hero">
      <div class="hero-text">
        {#if eyebrow}
          <p class="eyebrow">{eyebrow}</p>
        {/if}
        <h1 class="title">{title}</h1>
        {#if subtitle}
          <p class="subtitle">{subtitle}</p>
        {/if}
      </div>
      {#if action}
        <div class="hero-action">{@render action()}</div>
      {/if}
    </header>

    <div class="body-layout">
      <main class="content">{@render children()}</main>
      {#if sidebar}
        <aside class="sidebar">{@render sidebar()}</aside>
      {/if}
    </div>
  </div>
</div>

<style>
  .screen {
    min-height: 100dvh;
    background:
      linear-gradient(180deg, var(--color-bg-surface) 0%, var(--color-bg-primary) 260px),
      var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  .container {
    box-sizing: border-box;
    width: 100%;
    max-width: 1180px;
    margin: 0 auto;
    padding: 28px var(--space-lg) 56px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .body-layout {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 32px;
    width: 100%;
  }

  .hero {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    padding-bottom: 28px;
    border-bottom: 1px solid var(--color-border-hairline);
  }

  .hero-text {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }

  .eyebrow {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--text-eyebrow);
    font-weight: 700;
    letter-spacing: var(--tracking-eyebrow);
  }

  .title {
    margin: 0;
    color: var(--color-text-primary);
    max-width: 13ch;
    font-size: var(--text-h1);
    font-weight: 700;
    letter-spacing: 0;
    line-height: var(--text-h1-line);
    text-wrap: balance;
  }

  .subtitle {
    margin: 0;
    max-width: 62ch;
    color: var(--color-text-secondary);
    font-size: var(--text-body);
    line-height: var(--text-body-line);
    text-wrap: pretty;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 28px;
    min-width: 0;
  }

  .sidebar {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 28px;
    width: 100%;
    min-width: 0;
  }

  .hero-action {
    display: flex;
    align-items: flex-start;
    flex-shrink: 0;
  }

  /* >=768px: hero title + action nằm cùng hàng. */
  @media (min-width: 768px) {
    .hero {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
    }

    .container {
      padding-top: 40px;
      padding-bottom: 72px;
    }
  }

  /* >=1080px (DESIGN.md desktop): 2 cột main + sidebar (thay đo width bằng JS của RN). */
  @media (min-width: 1080px) {
    .container {
      max-width: 1120px;
    }

    .container:not(.has-sidebar) {
      max-width: 820px;
    }

    .container.has-sidebar .body-layout {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
      gap: 48px;
    }

    .container.has-sidebar .content {
      flex: 1;
      max-width: 700px;
    }

    .container.has-sidebar .sidebar {
      width: 360px;
      flex-shrink: 0;
    }
  }

  /* >=1440px: Mở rộng trên màn hình Ultrawide để tránh bị "chìm" và "kì cục" */
  @media (min-width: 1440px) {
    .container {
      max-width: 1280px;
    }

    .container:not(.has-sidebar) {
      max-width: 880px;
    }

    .container.has-sidebar .content {
      max-width: 780px;
    }

    .container.has-sidebar .sidebar {
      width: 420px;
    }
  }

  @media (max-width: 520px) {
    .container {
      padding-inline: var(--space-md);
      padding-top: var(--space-lg);
      gap: 28px;
    }

    .hero {
      padding-bottom: var(--space-lg);
    }

    .title {
      max-width: none;
    }
  }
</style>
