<script lang="ts">
  import PrimaryButton from './PrimaryButton.svelte';

  // EmptyStateCard: trạng thái rỗng có hành động tùy chọn (vd "Lập lá số đầu tiên").
  // Action dùng PrimaryButton để thừa hưởng a11y + loading state.
  interface Props {
    title: string;
    description?: string;
    actionLabel?: string;
    loading?: boolean;
    onaction?: () => void;
  }

  let { title, description, actionLabel, loading = false, onaction }: Props = $props();
</script>

<section class="card">
  <h2 class="title">{title}</h2>
  {#if description}
    <p class="description">{description}</p>
  {/if}
  {#if actionLabel && onaction}
    <div class="action">
      <PrimaryButton label={actionLabel} {loading} onclick={onaction} />
    </div>
  {/if}
</section>

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-lg);
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-lg);
  }

  .title {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 18px;
    font-weight: 600;
  }

  .description {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 21px;
  }

  .action {
    margin-top: var(--space-sm);
  }
</style>
