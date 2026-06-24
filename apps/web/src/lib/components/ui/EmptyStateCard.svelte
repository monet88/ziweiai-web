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
  /* ex-empty-state-card (DESIGN.md): khung điềm tĩnh, canh giữa, bo góc rộng.
     DESIGN.md gọi nền canvas-soft (#f6f5f4) — nhưng trang ở app này đã là #f6f5f4,
     nên vai trò "khung tách nhẹ khỏi nền trang" tương đương là --color-bg-elevated
     (#efedea, nền nhấn dịu), không phải bg-primary (sẽ tàng hình trên trang). */
  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-xxl) var(--space-lg);
    text-align: center;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-xl);
  }

  .title {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 18px;
    font-weight: 600;
  }

  .description {
    margin: 0;
    max-width: 42ch;
    color: var(--color-text-secondary);
    font-size: 15px;
    line-height: 1.5;
  }

  .action {
    margin-top: var(--space-sm);
  }
</style>
