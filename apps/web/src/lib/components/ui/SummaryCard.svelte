<script lang="ts">
  import type { Snippet } from 'svelte';

  // SummaryCard: thẻ bề mặt liệt kê cặp nhãn/giá trị. Slot-based để màn hình chi tiết
  // (US-006..007) bơm nội dung tùy biến; mặc định render danh sách items label/value.
  interface SummaryItem {
    label: string;
    value: string;
  }

  interface Props {
    title?: string;
    items?: readonly SummaryItem[];
    children?: Snippet;
  }

  let { title, items, children }: Props = $props();
</script>

<section class="card">
  {#if title}
    <h2 class="title">{title}</h2>
  {/if}

  {#if children}
    {@render children()}
  {:else if items}
    <dl class="list">
      {#each items as item (item.label)}
        <div class="row">
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
</style>
