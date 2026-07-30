<script lang="ts">
  import { sheetStore } from '$lib/stores/sheet.svelte';
  import { fade, slide } from 'svelte/transition';

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
  <div class="backdrop" transition:fade={{ duration: 200 }} onclick={handleBackdropClick} role="dialog" aria-modal="true" tabindex="-1">
    <div class="sheet bottom-sheet-glass" transition:slide={{ duration: 250, axis: 'y' }}>
      <div class="drag-handle"></div>
      
      {#if sheetStore.title}
        <div class="header">
          <h3>{sheetStore.title}</h3>
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
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: flex-end;
  }

  .sheet {
    width: 100%;
    max-height: 90vh;
    border-top-left-radius: var(--radius-xl);
    border-top-right-radius: var(--radius-xl);
    display: flex;
    flex-direction: column;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .drag-handle {
    width: 36px;
    height: 4px;
    background: var(--color-border-strong);
    border-radius: 2px;
    margin: var(--space-sm) auto;
  }

  .header {
    padding: 0 var(--space-md) var(--space-sm);
    text-align: center;
  }

  h3 {
    margin: 0;
    font-size: var(--text-h3);
    color: var(--color-text-primary);
  }

  .content {
    padding: var(--space-md);
    overflow-y: auto;
    flex: 1;
    /* Để form có thể scroll thoải mái bên trong sheet */
    -webkit-overflow-scrolling: touch;
  }
</style>
