<script lang="ts">
  import { themeStore } from '$lib/stores/theme.svelte';
  import { Sun, Moon } from 'lucide-svelte';
</script>

<button
  type="button"
  class="theme-toggle"
  onclick={() => themeStore.toggle()}
  aria-label={themeStore.current === 'light' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
  title={themeStore.current === 'light' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
>
  {#if themeStore.current === 'light'}
    <Moon size={18} />
  {:else}
    <Sun size={18} />
  {/if}
</button>

<style>
  .theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid var(--overlay-border-strong);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .theme-toggle:hover {
    background: var(--overlay-surface-veil);
    border-color: var(--color-accent-primary);
  }

  .theme-toggle:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }

  @media (pointer: coarse) {
    .theme-toggle {
      width: 44px;
      height: 44px;
    }
  }
</style>
