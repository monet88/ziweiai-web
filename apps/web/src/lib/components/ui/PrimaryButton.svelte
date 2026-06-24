<script lang="ts">
  import Spinner from './Spinner.svelte';
  import type { Snippet } from 'svelte';

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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    padding: var(--space-sm) var(--space-lg);
    border: 1px solid transparent;
    border-radius: var(--radius-pill);
    background: var(--color-accent-primary);
    color: var(--color-text-on-primary);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity var(--duration, 150ms) ease;
  }

  .button.surface {
    background: var(--color-bg-surface);
    border-color: var(--color-border-hairline);
    color: var(--color-text-primary);
  }

  /* utility (DESIGN.md button-utility): nút phụ vuông hơn (md 8px, KHÔNG pill),
     nền surface + viền hairline, gọn hơn nút chính. Dùng cho retry / hành động phụ
     không phải CTA. */
  .button.utility {
    min-height: 36px;
    padding: var(--space-xs) var(--space-md);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
    border-color: var(--color-border-hairline);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 600;
  }

  .button.utility:hover:not(:disabled) {
    border-color: var(--color-accent-primary);
  }

  .button:disabled {
    opacity: 0.7;
    cursor: progress;
  }

  .button:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }
</style>
