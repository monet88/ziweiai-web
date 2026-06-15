<script lang="ts">
  // PalaceCell: một ô cung trên bàn 12 cung. Hiển thị tên cung tiếng Việt, can-chi, đánh
  // dấu Thân/Mệnh-gốc, và danh sách sao (chính/phụ/tạp) kèm độ sáng + Tứ Hóa. Mọi nhãn
  // đã dịch tiếng Việt ở `buildPalaceViews` (US-003) — component chỉ trình bày.
  //
  // Là <button> thật để chọn cung (a11y keyboard + focus ring); aria-pressed phản ánh
  // trạng thái đang chọn.
  import type { PalaceView, StarTokenView } from '$lib/features/chart/palace-view-builder';

  interface Props {
    palace: PalaceView;
    selected: boolean;
    onSelect: (nameKey: string) => void;
  }

  let { palace, selected, onSelect }: Props = $props();

  // Gộp sao theo nhóm để render thành các hàng; bỏ token rỗng (legacy thiếu nhãn → '').
  const stars = $derived<StarTokenView[]>(
    [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars].filter(
      (star) => star.name.length > 0,
    ),
  );
</script>

<button
  type="button"
  class="cell"
  class:selected
  aria-pressed={selected}
  onclick={() => onSelect(palace.nameKey)}
>
  <header class="cell-head">
    <span class="palace-name">{palace.name}</span>
    {#if palace.stemBranch}
      <span class="stem-branch">{palace.stemBranch}</span>
    {/if}
  </header>

  {#if palace.isBodyPalace || palace.isOriginalPalace}
    <div class="tags">
      {#if palace.isBodyPalace}<span class="tag">Thân</span>{/if}
      {#if palace.isOriginalPalace}<span class="tag">Lai Nhân</span>{/if}
    </div>
  {/if}

  {#if stars.length > 0}
    <ul class="stars">
      {#each stars as star (star.key)}
        <li class="star" class:major={star.group === 'major'}>
          <span class="star-name">{star.name}</span>
          {#if star.brightness}<span class="star-meta">{star.brightness}</span>{/if}
          {#if star.mutagen}<span class="star-mutagen">{star.mutagen}</span>{/if}
        </li>
      {/each}
    </ul>
  {/if}

  {#if palace.decadalRange}
    <footer class="cell-foot">{palace.decadalRange}</footer>
  {/if}
</button>

<style>
  .cell {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    width: 100%;
    min-height: 116px;
    padding: var(--space-sm);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    text-align: left;
    cursor: pointer;
    transition: border-color 150ms ease;
  }

  .cell:hover {
    border-color: var(--color-border-gold);
  }

  .cell:focus-visible {
    outline: 2px solid var(--color-accent-gold-soft);
    outline-offset: 1px;
  }

  .cell.selected {
    border-color: var(--color-accent-gold);
    background: var(--color-bg-elevated);
  }

  .cell-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-xs);
  }

  .palace-name {
    font-size: 15px;
    font-weight: 600;
  }

  .stem-branch {
    color: var(--color-text-muted);
    font-size: 12px;
  }

  .tags {
    display: flex;
    gap: 4px;
  }

  .tag {
    padding: 1px 6px;
    border-radius: var(--radius-pill);
    background: var(--color-border-gold);
    color: var(--color-text-primary);
    font-size: 10px;
    font-weight: 600;
  }

  .stars {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .star {
    display: inline-flex;
    align-items: baseline;
    gap: 2px;
    color: var(--color-text-secondary);
    font-size: 12px;
  }

  .star.major {
    color: var(--color-accent-gold-soft);
    font-weight: 600;
  }

  .star-meta {
    color: var(--color-text-muted);
    font-size: 10px;
  }

  .star-mutagen {
    color: var(--color-accent-ai);
    font-size: 10px;
    font-weight: 600;
  }

  .cell-foot {
    margin-top: auto;
    color: var(--color-text-muted);
    font-size: 11px;
  }
</style>
