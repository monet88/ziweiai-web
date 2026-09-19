<script lang="ts">
  import { fade, slide } from 'svelte/transition';
  import type { Snippet } from 'svelte';

  interface Props {
    open: boolean;
    title?: string;
    onclose: () => void;
    children: Snippet;
  }

  let { open, title = '', onclose, children }: Props = $props();

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onclose();
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="backdrop" transition:fade={{ duration: 200 }} onclick={handleBackdropClick} role="dialog" aria-modal="true" tabindex="-1">
    <div class="sheet bottom-sheet-glass" transition:slide={{ duration: 250, axis: 'y' }}>
      <div class="drag-handle"></div>
      
      {#if title}
        <div class="header">
          <h3>{title}</h3>
        </div>
      {/if}
      
      <div class="content">
        {@render children()}
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 50; /* Higher than BottomNavigation */
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
    /* Extra padding at bottom for safe area */
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
  }
</style>
