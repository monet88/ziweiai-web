<script lang="ts">
  import type { Snippet } from 'svelte';

  // SummaryCard: thẻ bề mặt liệt kê cặp nhãn/giá trị. Slot-based để màn hình chi tiết
  // (US-006..007) bơm nội dung tùy biến; mặc định render danh sách items label/value.
  // variant="glass" bật glassmorphism + viền gradient 1px (Phase 11 Ticket 2).
  interface SummaryItem {
    label: string;
    value: string;
  }

  interface Props {
    title?: string;
    items?: readonly SummaryItem[];
    children?: Snippet;
    /** default = solid surface; glass = frosted + gradient border */
    variant?: 'default' | 'glass';
  }

  let { title, items, children, variant = 'default' }: Props = $props();
</script>

<section class="card" class:glass={variant === 'glass'} data-reveal={variant === 'glass' ? '' : undefined}>
  {#if title}
    <h2 class="title">{title}</h2>
  {/if}

  {#if children}
    {@render children()}
  {:else if items}
    <dl class="list">
      {#each items as item (item.label)}
        <div class="row" data-reveal-line={variant === 'glass' ? '' : undefined}>
          <dt class="label">{item.label}</dt>
          <dd class="value">{item.value}</dd>
        </div>
      {/each}
    </dl>
  {/if}
</section>

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-lg);
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-lg);
  }

  .card.glass {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    background: var(--glass-bg);
    border-color: transparent;
    backdrop-filter: blur(var(--glass-blur)) saturate(145%);
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(145%);
    box-shadow:
      var(--glass-shadow),
      inset 0 1px 0 var(--glass-highlight);
  }

  .card.glass::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: var(--glass-gradient);
    pointer-events: none;
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
  }

  .title {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 17px;
    font-weight: 600;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    margin: 0;
  }

  .row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .label {
    color: var(--color-text-muted);
    font-size: 13px;
  }

  .value {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 15px;
    line-height: 22px;
  }

  @media (prefers-reduced-transparency: reduce) {
    .card.glass {
      background: var(--color-bg-elevated);
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }
  }
</style>
