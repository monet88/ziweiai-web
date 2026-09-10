<script lang="ts">
  import type { Snippet } from 'svelte';
  import { resolve } from '$app/paths';
  import WalletIndicator from '$lib/features/payment/WalletIndicator.svelte';
  import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
  import { fadeUp } from '$lib/animations/gsap';
  import { ArrowLeft, Compass } from 'lucide-svelte';

  // AppScaffold: khung layout nền cho các màn hình subpages.
  // Đồng bộ chuẩn ngôn ngữ thiết kế Celestial Luxury của ViOS.
  interface Props {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    action?: Snippet;
    sidebar?: Snippet;
    children: Snippet;
    /** default = monochrome light product; mystical = dark glass chart surfaces */
    tone?: 'default' | 'mystical';
  }

  let { eyebrow, title, subtitle, action, sidebar, children, tone = 'default' }: Props = $props();
</script>

<div class="screen" class:theme-mystical={tone === 'mystical'} data-tone={tone}>
  <div class="container" class:has-sidebar={Boolean(sidebar)} use:fadeUp={{ duration: 0.8, y: 30 }}>
    <!-- Top Nav Bar Hoàng Gia -->
    <div class="top-nav-bar">
      <a href={resolve('/')} class="vios-back-btn">
        <ArrowLeft class="back-icon" />
        <span>Trang Chủ ViOS</span>
      </a>

      <div class="nav-actions">
        <ThemeToggle />
        <WalletIndicator />
      </div>
    </div>

    <!-- Hero Header Hoàng Gia -->
    <header class="hero">
      <div class="hero-text">
        {#if eyebrow}
          <div class="eyebrow-badge">
            <Compass class="badge-icon" />
            <span>{eyebrow}</span>
          </div>
        {/if}
        <h1 class="title">{title}</h1>
        {#if subtitle}
          <p class="subtitle">{subtitle}</p>
        {/if}
      </div>
      {#if action}
        <div class="hero-action-slot">
          {@render action()}
        </div>
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
    position: relative;
    min-height: 100dvh;
    background:
      radial-gradient(ellipse 70% 35% at 50% 0%, rgba(212, 175, 55, 0.16), transparent 70%),
      radial-gradient(ellipse 55% 30% at 85% 15%, rgba(192, 132, 252, 0.12), transparent 60%),
      radial-gradient(ellipse 60% 40% at 15% 35%, rgba(212, 175, 55, 0.08), transparent 55%),
      linear-gradient(180deg, #090615 0%, #130c2b 30%, #070512 100%);
    color: #f7eed8;
    overflow-x: hidden;
  }

  .container {
    box-sizing: border-box;
    width: 100%;
    max-width: 1180px;
    margin: 0 auto;
    padding: 20px var(--space-lg) 64px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  /* Top Nav Bar */
  .top-nav-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 12px;
  }

  .vios-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #e8dcc4;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .vios-back-btn:hover {
    background: rgba(212, 175, 55, 0.18);
    border-color: rgba(212, 175, 55, 0.6);
    color: #ffd700;
    transform: translateX(-2px);
    box-shadow: 0 0 16px rgba(212, 175, 55, 0.2);
  }

  :global(.back-icon) {
    width: 15px;
    height: 15px;
    color: #ffd700;
    transition: transform 0.2s ease;
  }

  .vios-back-btn:hover :global(.back-icon) {
    transform: translateX(-2px);
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(22, 16, 42, 0.65);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid rgba(212, 175, 55, 0.25);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
  }

  /* Hero Header */
  .hero {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.18);
  }

  @media (min-width: 768px) {
    .hero {
      flex-direction: row;
      align-items: flex-end;
      justify-content: space-between;
    }
  }

  .hero-text {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }

  .eyebrow-badge {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 999px;
    background: rgba(212, 175, 55, 0.12);
    border: 1px solid rgba(212, 175, 55, 0.35);
    color: #ffd700;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  :global(.badge-icon) {
    width: 12px;
    height: 12px;
    color: #ffd700;
  }

  .title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: clamp(26px, 4vw, 36px);
    font-weight: 800;
    letter-spacing: -0.01em;
    line-height: 1.25;
    background: linear-gradient(135deg, #ffffff 0%, #fce99f 50%, #d4af37 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-wrap: balance;
  }

  .subtitle {
    margin: 0;
    max-width: 65ch;
    color: rgba(226, 216, 184, 0.8);
    font-size: 15px;
    line-height: 1.6;
    text-wrap: pretty;
  }

  .hero-action-slot {
    flex-shrink: 0;
  }

  .body-layout {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 32px;
    width: 100%;
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

  @media (min-width: 1080px) {
    .container {
      max-width: 1120px;
    }

    .container:not(.has-sidebar) {
      max-width: 840px;
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

  @media (max-width: 520px) {
    .container {
      padding-inline: var(--space-md);
      padding-top: var(--space-md);
      gap: 20px;
    }

    .vios-back-btn span {
      font-size: 12px;
    }

    .subtitle {
      font-size: 13.5px;
    }
  }

  @media (max-width: 374px) {
    .container {
      padding-inline: 12px;
      padding-top: 14px;
      gap: 16px;
    }
  }

  /* Đồng bộ Theme Light Hoàng Gia */
  :global([data-theme="light"]) .screen {
    background:
      radial-gradient(ellipse 75% 50% at 15% 0%, rgba(212, 175, 55, 0.1), transparent 60%),
      radial-gradient(ellipse 60% 45% at 85% 10%, rgba(168, 85, 247, 0.08), transparent 55%),
      linear-gradient(180deg, #faf8f5 0%, #f4f0e6 100%);
    color: #1a162b;
  }

  :global([data-theme="light"]) .vios-back-btn {
    background: rgba(255, 255, 255, 0.85);
    border-color: rgba(212, 175, 55, 0.4);
    color: #451a03;
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.12);
  }

  :global([data-theme="light"]) .vios-back-btn:hover {
    background: rgba(255, 255, 255, 0.95);
    border-color: #b45309;
    color: #78350f;
    box-shadow: 0 4px 16px rgba(212, 175, 55, 0.25);
  }

  :global([data-theme="light"]) :global(.back-icon) {
    color: #b45309;
  }

  :global([data-theme="light"]) .nav-actions {
    background: rgba(255, 255, 255, 0.85);
    border-color: rgba(212, 175, 55, 0.35);
    box-shadow: 0 4px 16px rgba(212, 175, 55, 0.12);
  }

  :global([data-theme="light"]) .hero {
    border-bottom-color: rgba(212, 175, 55, 0.25);
  }

  :global([data-theme="light"]) .eyebrow-badge {
    background: rgba(212, 175, 55, 0.18);
    border-color: rgba(212, 175, 55, 0.5);
    color: #854d0e;
  }

  :global([data-theme="light"]) :global(.badge-icon) {
    color: #854d0e;
  }

  :global([data-theme="light"]) .title {
    background: linear-gradient(135deg, #180d38 0%, #78350f 60%, #b45309 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  :global([data-theme="light"]) .subtitle {
    color: #57534e;
  }

  @media print {
    .screen {
      min-height: 0 !important;
      height: auto !important;
      overflow: visible !important;
      position: static !important;
      background: #ffffff !important;
    }

    .container {
      max-width: 100% !important;
      padding: 0 !important;
      gap: 0 !important;
      transform: none !important;
    }

    .top-nav-bar {
      display: none !important;
    }
  }
</style>

