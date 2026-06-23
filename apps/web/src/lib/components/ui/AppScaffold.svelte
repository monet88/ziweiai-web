<script lang="ts">
  import type { Snippet } from 'svelte';

  // AppScaffold: khung layout nền cho các màn hình US-006..008. Header (eyebrow/title/
  // subtitle + slot action) + <main> semantic + container responsive. Bố cục 2 cột
  // (main + sidebar) bật ở >=1024px qua CSS media query — KHÔNG đo width bằng JS
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
    <div class="main-column">
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
      <main class="content">{@render children()}</main>
    </div>
    {#if sidebar}
      <aside class="sidebar">{@render sidebar()}</aside>
    {/if}
  </div>
</div>

<style>
  .screen {
    min-height: 100vh;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  .container {
    box-sizing: border-box;
    width: 100%;
    max-width: 1180px;
    margin: 0 auto;
    padding: var(--space-xl) var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .main-column {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    width: 100%;
  }

  .hero {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .hero-text {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .eyebrow {
    margin: 0;
    color: var(--color-accent-gold);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.8px;
  }

  .title {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 34px;
    font-weight: 600;
    letter-spacing: -1px;
    line-height: 1.18;
  }

  .subtitle {
    margin: 0;
    max-width: 560px;
    color: var(--color-text-secondary);
    font-size: 16px;
    line-height: 1.5;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .sidebar {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    width: 100%;
  }

  /* >=768px: hero title + action nằm cùng hàng. */
  @media (min-width: 768px) {
    .hero {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
    }
  }

  /* >=1024px: 2 cột main + sidebar (thay đo width bằng JS của RN). */
  @media (min-width: 1024px) {
    /* Khi có sidebar: căn giữa 2 cột, giới hạn độ rộng để form không bị bẹp ngang */
    .container.has-sidebar {
      flex-direction: row;
      align-items: flex-start;
      justify-content: center;
      gap: 100px;
    }

    .container.has-sidebar .main-column {
      flex: 0 1 560px;
      max-width: 560px;
    }

    .container.has-sidebar .sidebar {
      width: 360px;
      flex-shrink: 0;
    }

    /* Khi KHÔNG CÓ sidebar (trang chi tiết): thu nhỏ form và đẩy vào giữa màn hình */
    .container:not(.has-sidebar) .main-column {
      max-width: 640px;
      margin: 0 auto;
    }
  }
</style>
