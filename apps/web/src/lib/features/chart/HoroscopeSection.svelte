<script lang="ts">
  // HoroscopeSection: 1 vùng trong panel vận hạn (US-015) — header + chip strip cuộn ngang.
  // role="group" + aria-label cho mỗi vùng (KHÔNG ép tab semantics: 4 vùng là phân cấp chọn
  // mốc, không phải tab thay thế nội dung). Khi chưa có chip (tầng trên chưa chọn) → hiện
  // emptyHint thay vì strip rỗng. Chip render qua snippet để parent gắn onClick theo tầng.
  import type { Snippet } from 'svelte';
  import type { HoroscopeChip } from '$lib/features/chart/horoscope-chips';

  interface Props {
    title: string;
    chips: HoroscopeChip[];
    ariaLabel: string;
    /** Gợi ý khi vùng chưa có chip (tầng trên chưa chọn). Bỏ qua nếu có chip. */
    emptyHint?: string;
    /** Render 1 chip — parent truyền HoroscopeChip component + onClick gắn tầng. */
    chip: Snippet<[HoroscopeChip]>;
  }

  let { title, chips, ariaLabel, emptyHint, chip }: Props = $props();
</script>

<section class="section" role="group" aria-label={ariaLabel}>
  <h3 class="section__title">{title}</h3>
  {#if chips.length > 0}
    <div class="section__strip">
      {#each chips as item (item.key)}
        {@render chip(item)}
      {/each}
    </div>
  {:else if emptyHint}
    <p class="section__empty">{emptyHint}</p>
  {/if}
</section>

<style>
  .section {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .section__title {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 600;
  }

  /* Chip strip cuộn ngang riêng từng vùng — mobile vuốt ngang, desktop tràn thì cuộn. */
  .section__strip {
    display: flex;
    gap: var(--space-xs);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: var(--space-xs);
  }

  .section__empty {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 12px;
  }
</style>
