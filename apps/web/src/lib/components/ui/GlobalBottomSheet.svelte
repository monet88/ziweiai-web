<script lang="ts">
  import { sheetStore } from '$lib/stores/sheet.svelte';
  import { fade, scale } from 'svelte/transition';
  import { X, Compass } from 'lucide-svelte';

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      sheetStore.close();
    }
  }

  // Keyboard accessibility
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && sheetStore.isOpen) {
      sheetStore.close();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if sheetStore.isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="backdrop"
    transition:fade={{ duration: 200 }}
    onclick={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div
      class="sheet celestial-sheet"
      transition:scale={{ duration: 250, start: 0.95, opacity: 0 }}
    >
      <div class="drag-handle"></div>

      <button
        type="button"
        class="close-btn"
        onclick={() => sheetStore.close()}
        aria-label="Đóng cửa sổ"
      >
        <X class="close-icon" />
      </button>

      {#if sheetStore.title}
        <div class="header">
          <div class="header-badge">
            <Compass class="badge-icon" />
            <span>ViOS Celestial Engine</span>
          </div>
          <h3 class="sheet-title">{sheetStore.title}</h3>
          <p class="sheet-subtitle">Thiên Bàn Bản Mệnh • Khâm Thiên Thần Cơ Diệu Toán</p>
        </div>
      {/if}

      <div class="content">
        {#if sheetStore.component}
          <svelte:component this={sheetStore.component} {...sheetStore.props} />
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 60; /* Phải cao hơn BottomNavigation (40) và GlobalModal/Paywall */
    background: rgba(6, 4, 15, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .sheet {
    position: relative;
    width: 100%;
    max-height: 90vh;
    border-top-left-radius: 28px;
    border-top-right-radius: 28px;
    display: flex;
    flex-direction: column;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background: linear-gradient(180deg, rgba(22, 16, 42, 0.98) 0%, rgba(11, 8, 22, 0.99) 100%);
    border-top: 1px solid rgba(212, 175, 55, 0.4);
    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.6), 0 0 35px rgba(212, 175, 55, 0.15);
    color: var(--color-text-primary);
  }

  /* Desktop View: Centered Modal Dialog sang trọng */
  @media (min-width: 768px) {
    .backdrop {
      align-items: center;
      padding: var(--space-xl) var(--space-md);
    }

    .sheet {
      width: 100%;
      max-width: 620px;
      max-height: 88vh;
      border-radius: 28px;
      border: 1px solid rgba(212, 175, 55, 0.45);
      box-shadow:
        0 30px 90px rgba(0, 0, 0, 0.9),
        0 0 50px rgba(212, 175, 55, 0.22),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
      padding-bottom: 0;
    }

    .drag-handle {
      display: none;
    }
  }

  .drag-handle {
    width: 44px;
    height: 4px;
    background: rgba(212, 175, 55, 0.4);
    border-radius: 2px;
    margin: 12px auto 6px;
  }

  .close-btn {
    position: absolute;
    top: 18px;
    right: 18px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #e2d8b8;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 10;
  }

  .close-btn:hover {
    background: rgba(212, 175, 55, 0.2);
    color: #ffd700;
    border-color: rgba(212, 175, 55, 0.6);
    transform: rotate(90deg) scale(1.05);
  }

  :global(.close-icon) {
    width: 18px;
    height: 18px;
  }

  .header {
    padding: 20px 24px 14px;
    text-align: center;
    border-bottom: 1px solid rgba(212, 175, 55, 0.15);
    background: linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, transparent 100%);
  }

  .header-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 999px;
    background: rgba(212, 175, 55, 0.12);
    border: 1px solid rgba(212, 175, 55, 0.3);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #ffd700;
    margin-bottom: 8px;
  }

  :global(.badge-icon) {
    width: 12px;
    height: 12px;
    color: #ffd700;
  }

  .sheet-title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.01em;
    background: linear-gradient(135deg, #ffffff 0%, #fce99f 60%, #d4af37 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .sheet-subtitle {
    margin: 4px 0 0;
    font-size: 12px;
    color: rgba(226, 216, 184, 0.7);
    letter-spacing: 0.02em;
  }

  .content {
    padding: 20px 24px 24px;
    overflow-y: auto;
    flex: 1;
    -webkit-overflow-scrolling: touch;
  }

  /* Tùy chỉnh thanh cuộn thanh mảnh hoàng kim */
  .content::-webkit-scrollbar {
    width: 5px;
  }

  .content::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
  }

  .content::-webkit-scrollbar-thumb {
    background: rgba(212, 175, 55, 0.3);
    border-radius: 4px;
  }

  .content::-webkit-scrollbar-thumb:hover {
    background: rgba(212, 175, 55, 0.5);
  }

  /* Đồng bộ Theme Light Hoàng Gia */
  :global([data-theme="light"]) .sheet {
    background: linear-gradient(180deg, rgba(255, 253, 250, 0.98) 0%, rgba(248, 244, 235, 0.99) 100%);
    border-color: rgba(212, 175, 55, 0.5);
    box-shadow: 0 30px 90px rgba(212, 175, 55, 0.2), 0 0 40px rgba(212, 175, 55, 0.15);
  }

  :global([data-theme="light"]) .close-btn {
    background: rgba(255, 255, 255, 0.85);
    border-color: rgba(212, 175, 55, 0.35);
    color: #78350f;
  }

  :global([data-theme="light"]) .close-btn:hover {
    background: rgba(255, 255, 255, 0.95);
    border-color: #b45309;
    color: #451a03;
  }

  :global([data-theme="light"]) .header {
    border-bottom-color: rgba(212, 175, 55, 0.2);
    background: linear-gradient(180deg, rgba(212, 175, 55, 0.12) 0%, transparent 100%);
  }

  :global([data-theme="light"]) .header-badge {
    background: rgba(212, 175, 55, 0.18);
    border-color: rgba(212, 175, 55, 0.45);
    color: #854d0e;
  }

  :global([data-theme="light"]) .sheet-title {
    background: linear-gradient(135deg, #180d38 0%, #78350f 60%, #b45309 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  :global([data-theme="light"]) .sheet-subtitle {
    color: #57534e;
  }
</style>

