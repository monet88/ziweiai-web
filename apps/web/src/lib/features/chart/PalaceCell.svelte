<script lang="ts">
  // PalaceCell: một ô cung trên bàn 12 cung. Hiển thị tên cung tiếng Việt, can-chi, đánh
  // dấu Thân/Lai Nhân, sao tách theo vùng (chủ tinh / phụ tinh / tạp diệu) và góc metadata
  // (Trường Sinh, đại vận, tuổi). Mọi nhãn đã dịch tiếng Việt ở `buildPalaceView` (US-003/006)
  // — component chỉ trình bày.
  //
  // Là <button> thật để chọn cung (a11y keyboard + focus ring); aria-pressed phản ánh trạng
  // thái đang chọn. `inAspect` làm nổi cung thuộc tam phương tứ chính của cung đang chọn.
  import type { PalaceView, StarTokenView } from '$lib/features/chart/palace-view-builder';

  interface Props {
    palace: PalaceView;
    selected: boolean;
    /** Cung thuộc tam phương tứ chính của cung đang chọn (không phải chính cung). */
    inAspect?: boolean;
    onSelect: (nameKey: string) => void;
  }

  let { palace, selected, inAspect = false, onSelect }: Props = $props();

  // Bỏ token rỗng (legacy thiếu nhãn → ''). Mỗi nhóm render thành một vùng riêng.
  function visibleStars(stars: StarTokenView[]): StarTokenView[] {
    return stars.filter((star) => star.name.length > 0);
  }

  const majorStars = $derived(visibleStars(palace.majorStars));
  const minorStars = $derived(visibleStars(palace.minorStars));
  const adjectiveStars = $derived(visibleStars(palace.adjectiveStars));

  // Tuổi (nominal ages) hiển thị gọn; degrade khi snapshot thiếu (mảng rỗng).
  const agesLabel = $derived(palace.ages.length > 0 ? palace.ages.join(' · ') : null);
</script>

<button
  type="button"
  class="cell"
  class:selected
  class:in-aspect={inAspect}
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

  <div class="stars">
    {#if majorStars.length > 0}
      <ul class="star-row major-row">
        {#each majorStars as star (star.key)}
          <li class="star major">
            <span class="star-name">{star.name}</span>
            {#if star.brightness}<span class="star-meta">{star.brightness}</span>{/if}
            {#if star.mutagen}<span class="star-mutagen">{star.mutagen}</span>{/if}
          </li>
        {/each}
      </ul>
    {/if}

    {#if minorStars.length > 0}
      <ul class="star-row minor-row">
        {#each minorStars as star (star.key)}
          <li class="star minor">
            <span class="star-name">{star.name}</span>
            {#if star.brightness}<span class="star-meta">{star.brightness}</span>{/if}
            {#if star.mutagen}<span class="star-mutagen">{star.mutagen}</span>{/if}
          </li>
        {/each}
      </ul>
    {/if}

    {#if adjectiveStars.length > 0}
      <ul class="star-row adjective-row">
        {#each adjectiveStars as star (star.key)}
          <li class="star adjective">
            <span class="star-name">{star.name}</span>
            {#if star.mutagen}<span class="star-mutagen">{star.mutagen}</span>{/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  {#if palace.changsheng || palace.decadalRange || agesLabel}
    <footer class="cell-foot">
      {#if palace.changsheng}<span class="meta changsheng">{palace.changsheng}</span>{/if}
      {#if palace.decadalRange}<span class="meta decadal">{palace.decadalRange}</span>{/if}
      {#if agesLabel}<span class="meta ages">{agesLabel}</span>{/if}
    </footer>
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
    transition: border-color 150ms ease, background-color 150ms ease;
  }

  .cell:hover {
    border-color: var(--color-border-gold);
  }

  .cell:focus-visible {
    outline: 2px solid var(--color-accent-gold-soft);
    outline-offset: 1px;
  }

  /* Tam phương tứ chính: viền nhấn nhẹ, dưới mức cung đang chọn. */
  .cell.in-aspect {
    border-color: var(--color-accent-gold-soft);
    background: var(--color-bg-elevated);
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
    flex-direction: column;
    gap: var(--space-xs);
  }

  .star-row {
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

  /* Chủ tinh nổi bật tách khỏi phụ tinh / tạp diệu. */
  .star.major {
    color: var(--color-accent-gold-soft);
    font-weight: 600;
    font-size: 13px;
  }

  .star.adjective {
    color: var(--color-text-muted);
    font-size: 11px;
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
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    margin-top: auto;
    color: var(--color-text-muted);
    font-size: 11px;
  }

  .meta.changsheng {
    color: var(--color-accent-gold-soft);
  }
</style>
