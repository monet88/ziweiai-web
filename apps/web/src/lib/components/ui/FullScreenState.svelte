<script lang="ts">
  import Spinner from './Spinner.svelte';

  // Trạng thái toàn màn hình (thay FullScreenState RN): spinner lớn + tiêu đề + mô tả.
  // Dùng cho lúc kiểm tra phiên / tải lá số trước khi có nội dung.
  interface Props {
    title: string;
    message?: string;
  }

  let { title, message }: Props = $props();
</script>

<main class="screen">
  <Spinner size="lg" label={title} />
  <h1 class="title">{title}</h1>
  {#if message}
    <p class="message">{message}</p>
  {/if}
</main>

<style>
  .screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: var(--space-md);
    padding: var(--space-xl);
    background: var(--color-bg-primary);
  }

  .title {
    margin: 0;
    font-size: 1.375rem;
    font-weight: 600;
    text-align: center;
    color: var(--color-text-primary);
  }

  .message {
    margin: 0;
    max-width: 360px;
    font-size: 0.9375rem;
    line-height: 1.5;
    text-align: center;
    color: var(--color-text-secondary);
  }
</style>
