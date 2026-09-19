<script lang="ts">
  import Spinner from './Spinner.svelte';
  import type { Snippet } from 'svelte';
  import { pressInteraction } from '$lib/animations/gsap';

  // PrimaryButton: <button type> thật + focus-visible ring (a11y). Khi loading khoá
  // click (disabled) và đổi con trỏ. Chỉ animate transform/opacity (compositor-friendly).
  interface Props {
    label?: string;
    variant?: 'primary' | 'surface' | 'utility';
    type?: 'button' | 'submit' | 'reset';
    loading?: boolean;
    disabled?: boolean;
    onclick?: (event: MouseEvent) => void;
    children?: Snippet;
  }

  let {
    label,
    variant = 'primary',
    type = 'button',
    loading = false,
    disabled = false,
    onclick,
    children,
  }: Props = $props();

  // Loading luôn khoá tương tác để tránh double-submit.
  const isDisabled = $derived(loading || disabled);
</script>

<button
  {type}
  class="button"
  class:surface={variant === 'surface'}
  class:utility={variant === 'utility'}
  disabled={isDisabled}
  aria-busy={loading}
  {onclick}
  use:pressInteraction
>
  {#if loading}
    <Spinner tone={variant === 'primary' ? 'dark' : 'primary'} />
  {:else if children}
    {@render children()}
  {:else}
    {label}
  {/if}
</button>

<style>
  .button {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 48px;
    padding: var(--space-sm) var(--space-xl);
    border: 1px solid transparent;
    border-radius: var(--radius-pill);
    background: var(--color-accent-primary);
    color: var(--color-text-on-primary);
    font-family: var(--font-sans);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
    transition: all var(--duration, 150ms) cubic-bezier(0.16, 1, 0.3, 1);
  }

  .button:hover:not(:disabled) {
    transform: translateY(-1.5px);
    box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.35), inset 0 1px 0 0 rgba(255, 255, 255, 0.3);
  }

  .button:active:not(:disabled) {
    transform: translateY(0.5px) scale(0.98);
  }

  :global([data-theme="dark"]) .button:not(.surface):not(.utility) {
    background: linear-gradient(135deg, #fce99f 0%, #d4af37 100%);
    color: #0f0c1b;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 20px rgba(212, 175, 55, 0.35), inset 0 1px 0 0 rgba(255, 255, 255, 0.4);
  }

  :global([data-theme="dark"]) .button:not(.surface):not(.utility):hover:not(:disabled) {
    box-shadow: 0 8px 30px rgba(212, 175, 55, 0.55), inset 0 1px 0 0 rgba(255, 255, 255, 0.6);
  }

  .button.surface {
    background: var(--glass-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--overlay-border);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-card);
  }

  .button.surface:hover:not(:disabled) {
    background: var(--glass-bg-strong);
    border-color: var(--overlay-border-strong);
  }

  /* utility: nút phụ vuông hơn (md 8px), gọn hơn nút chính */
  .button.utility {
    min-height: 36px;
    padding: var(--space-xs) var(--space-md);
    border-radius: var(--radius-md);
    background: var(--glass-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--overlay-border);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 600;
    box-shadow: none;
  }

  .button.utility:hover:not(:disabled) {
    background: var(--overlay-ink-wash);
    border-color: var(--color-accent-primary);
    transform: translateY(-1px);
  }

  @media (pointer: coarse) {
    .button.utility {
      min-height: 44px;
    }
  }

  .button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }

  .button:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }
</style>
