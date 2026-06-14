<script lang="ts">
  // NoticeBanner: dải thông báo theo tone (info/warning/danger). Slot-based để chứa
  // nội dung tuỳ ý; message là lối tắt cho chuỗi đơn. Màu lấy từ tokens var(--*).
  // A11y: danger dùng role="alert" (thông báo ngay), còn lại role="status".
  import type { Snippet } from 'svelte';

  interface Props {
    message?: string;
    tone?: 'info' | 'warning' | 'danger';
    children?: Snippet;
  }

  let { message, tone = 'info', children }: Props = $props();
</script>

<div
  class="banner"
  class:warning={tone === 'warning'}
  class:danger={tone === 'danger'}
  role={tone === 'danger' ? 'alert' : 'status'}
>
  {#if children}
    {@render children()}
  {:else}
    <p class="text">{message}</p>
  {/if}
</div>

<style>
  .banner {
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-accent-ai);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
  }

  .banner.warning {
    border-color: var(--color-accent-gold-soft);
  }

  .banner.danger {
    border-color: var(--color-accent-danger);
  }

  .text {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 1.5;
  }
</style>
