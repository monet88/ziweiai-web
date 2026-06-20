<script lang="ts">
  // PalaceCell: một ô cung trên bàn 12 cung. Hiển thị tên cung tiếng Việt, can-chi, đánh
  // dấu Thân/Lai Nhân, sao tách theo vùng (chủ tinh / phụ tinh / tạp diệu) và góc metadata
  // (Trường Sinh, đại vận, tuổi). Mọi nhãn đã dịch tiếng Việt ở `buildPalaceView` (US-003/006)
  // — component chỉ trình bày.
  //
  // Là <button> thật để chọn cung (a11y keyboard + focus ring); aria-pressed phản ánh trạng
  // thái đang chọn. `inAspect` làm nổi cung thuộc tam phương tứ chính của cung đang chọn.
  import type { PalaceView, StarTokenView } from '$lib/features/chart/palace-view-builder';
  import { getStarColors, getStarTitle } from '$lib/features/chart/star-color';
  import type { HighlightTier, PalaceFlowView } from '$lib/features/chart/palace-flow-flags';

  interface Props {
    palace: PalaceView;
    selected: boolean;
    /** Cung thuộc tam phương tứ chính của cung đang chọn (không phải chính cung). */
    inAspect?: boolean;
    /** Cung NGOÀI tam phương tứ chính của cung đang hover → làm mờ (preview tạm, US-011). */
    dimmed?: boolean;
    /** Flow-info vận hạn cho ô (US-014). null/undefined = ô không phải cung Mệnh tầng nào. */
    flowFlags?: PalaceFlowView | null;
    /** US-015: ô là cung Mệnh đại vận đang chọn (overlay panel vận hạn). Tách khỏi inAspect. */
    isInDecadal?: boolean;
    /** US-015: ô là cung Mệnh lưu niên đang chọn. */
    isInYearly?: boolean;
    /** US-015: ô là cung Mệnh lưu nguyệt đang chọn. */
    isInMonthly?: boolean;
    /** US-015: ô là cung Mệnh lưu nhật đang chọn. */
    isInDaily?: boolean;
    onSelect: (nameKey: string) => void;
    /** Báo cha cung đang hover (preview tam phương tứ chính); null khi rời chuột. */
    onHover?: (nameKey: string | null) => void;
  }

  let {
    palace,
    selected,
    inAspect = false,
    dimmed = false,
    flowFlags = null,
    isInDecadal = false,
    isInYearly = false,
    isInMonthly = false,
    isInDaily = false,
    onSelect,
    onHover,
  }: Props = $props();

  // US-015: viền highlight cung Mệnh vận của (các) tầng đang chọn ở panel. Một ô chỉ có 1
  // `outline` CSS, nên khi nhiều tầng cùng trỏ về 1 cung (hiếm) ta xếp chồng nhiều vòng bằng
  // box-shadow: mỗi tầng 1 ring spread tăng dần. Liệt kê ring ngoài cùng (spread lớn) TRƯỚC để
  // ring trong (spread nhỏ) vẽ đè lên trên → 4 vòng song song lồng nhau. Tách hẳn `inAspect`
  // (US-011 dùng border) + `:focus-visible` (dùng outline) → không đè nhau.
  const horoscopeRing = $derived(
    [
      isInDaily ? '0 0 0 8px var(--color-horoscope-daily)' : null,
      isInMonthly ? '0 0 0 6px var(--color-horoscope-monthly)' : null,
      isInYearly ? '0 0 0 4px var(--color-horoscope-yearly)' : null,
      isInDecadal ? '0 0 0 2px var(--color-horoscope-decadal)' : null,
    ]
      .filter((ring): ring is string => ring !== null)
      .join(', '),
  );

  // Nhãn Việt cố định cho 4 tầng vận hạn (US-014). Thứ tự hiển thị: Vận → Niên → Nguyệt → Nhật.
  const FLOW_TIER_LABELS: Record<HighlightTier, string> = {
    decadal: 'Vận',
    yearly: 'Niên',
    monthly: 'Nguyệt',
    daily: 'Nhật',
  };
  const FLOW_TIER_ORDER: HighlightTier[] = ['decadal', 'yearly', 'monthly', 'daily'];

  // Các tầng đang hoạt động trên ô này (đúng thứ tự), dùng cho thanh chỉ báo + chip footer.
  const activeTiers = $derived(flowFlags ? FLOW_TIER_ORDER.filter((tier) => flowFlags[tier]) : []);

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
  class:dimmed
  class:in-decadal={isInDecadal}
  class:in-yearly={isInYearly}
  class:in-monthly={isInMonthly}
  class:in-daily={isInDaily}
  style={horoscopeRing ? `box-shadow: ${horoscopeRing};` : ''}
  aria-pressed={selected}
  onclick={() => onSelect(palace.nameKey)}
  onmouseenter={() => onHover?.(palace.nameKey)}
  onmouseleave={() => onHover?.(null)}
  onfocus={() => onHover?.(palace.nameKey)}
  onblur={() => onHover?.(null)}
>
  {#if activeTiers.length > 0}
    <div class="flow-bar" aria-hidden="true">
      {#each activeTiers as tier (tier)}
        <span class="flow-bar__seg flow-bar__seg--{tier}"></span>
      {/each}
    </div>
  {/if}

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
          {@const colors = getStarColors(star)}
          {@const title = getStarTitle(star)}
          <li class="star major" class:malefic={colors.isMalefic} style="{colors.nameColor ? `--star-name-color: ${colors.nameColor};` : ''}{colors.brightnessColor ? `--star-brightness-color: ${colors.brightnessColor};` : ''}{colors.mutagenColor ? `--star-mutagen-color: ${colors.mutagenColor};` : ''}" title={title}>
            <span class="star-name" style={colors.nameColor ? 'color: var(--star-name-color);' : ''}>{star.name}</span>
            {#if star.brightness}<span class="star-meta" style={colors.brightnessColor ? 'color: var(--star-brightness-color);' : ''}>{star.brightness}</span>{/if}
            {#if star.mutagen}<span class="star-mutagen" style={colors.mutagenColor ? 'color: var(--star-mutagen-color);' : ''}>{star.mutagen}</span>{/if}
          </li>
        {/each}
      </ul>
    {/if}

    {#if minorStars.length > 0}
      <ul class="star-row minor-row">
        {#each minorStars as star (star.key)}
          {@const colors = getStarColors(star)}
          {@const title = getStarTitle(star)}
          <li class="star minor" class:malefic={colors.isMalefic} style="{colors.nameColor ? `--star-name-color: ${colors.nameColor};` : ''}{colors.brightnessColor ? `--star-brightness-color: ${colors.brightnessColor};` : ''}{colors.mutagenColor ? `--star-mutagen-color: ${colors.mutagenColor};` : ''}" title={title}>
            <span class="star-name" style={colors.nameColor ? 'color: var(--star-name-color);' : ''}>{star.name}</span>
            {#if star.brightness}<span class="star-meta" style={colors.brightnessColor ? 'color: var(--star-brightness-color);' : ''}>{star.brightness}</span>{/if}
            {#if star.mutagen}<span class="star-mutagen" style={colors.mutagenColor ? 'color: var(--star-mutagen-color);' : ''}>{star.mutagen}</span>{/if}
          </li>
        {/each}
      </ul>
    {/if}

    {#if adjectiveStars.length > 0}
      <ul class="star-row adjective-row">
        {#each adjectiveStars as star (star.key)}
          {@const colors = getStarColors(star)}
          {@const title = getStarTitle(star)}
          <li class="star adjective" class:malefic={colors.isMalefic} style="{colors.nameColor ? `--star-name-color: ${colors.nameColor};` : ''}{colors.mutagenColor ? `--star-mutagen-color: ${colors.mutagenColor};` : ''}" title={title}>
            <span class="star-name" style={colors.nameColor ? 'color: var(--star-name-color);' : ''}>{star.name}</span>
            {#if star.mutagen}<span class="star-mutagen" style={colors.mutagenColor ? 'color: var(--star-mutagen-color);' : ''}>{star.mutagen}</span>{/if}
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

  {#if activeTiers.length > 0 && flowFlags}
    <footer class="flow-info">
      {#each activeTiers as tier (tier)}
        <span class="flow-chip flow-chip--{tier}">
          <span class="flow-chip__label">{FLOW_TIER_LABELS[tier]}</span>
          <span class="flow-chip__value">{flowFlags[tier]?.stemBranch}</span>
          {#if tier === 'decadal' && flowFlags.decadal?.agesRange}
            <span class="flow-chip__ages">{flowFlags.decadal.agesRange}</span>
          {/if}
        </span>
      {/each}
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
    transition: border-color 150ms ease, background-color 150ms ease, opacity 150ms ease;
  }

  .cell:hover {
    border-color: var(--color-border-gold);
  }

  /* Hover-preview (US-011): cung NGOÀI tam phương tứ chính của cung đang hover mờ đi để làm
     nổi trọng tâm. Chỉ là tăng cường trực quan — không khoá tương tác chuột/bàn phím.
     Chỉ bật trên thiết bị hover thật (chuột): trên touch, tap fire mouseenter → tránh mờ
     "dính" (sticky hover) vì tap đã đồng thời chọn cung (selected) như trạng thái bền. */
  @media (hover: hover) {
    .cell.dimmed {
      opacity: 0.35;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cell {
      transition: none;
    }
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

  /* US-014: thanh chỉ báo vận hạn ở mép trên ô — chia đều theo số tầng đang có,
     mỗi mảnh nền màu của tầng tương ứng. Trang trí thuần → aria-hidden ở template. */
  .flow-bar {
    display: flex;
    gap: 1px;
    height: 3px;
    margin: -2px -2px 2px;
    border-radius: var(--radius-pill);
    overflow: hidden;
  }

  .flow-bar__seg {
    flex: 1;
  }

  .flow-bar__seg--decadal {
    background: var(--color-flow-decadal);
  }
  .flow-bar__seg--yearly {
    background: var(--color-flow-yearly);
  }
  .flow-bar__seg--monthly {
    background: var(--color-flow-monthly);
  }
  .flow-bar__seg--daily {
    background: var(--color-flow-daily);
  }

  /* Dòng flow-info ở đáy ô: chip mỗi tầng với nhãn Việt + can-chi (+ dải tuổi cho đại vận). */
  .flow-info {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: var(--space-xs);
  }

  .flow-chip {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    padding: 1px 6px;
    border-radius: var(--radius-pill);
    font-size: 10px;
    line-height: 1.5;
  }

  .flow-chip__label {
    font-weight: 600;
  }

  .flow-chip__ages {
    color: var(--color-text-muted);
  }

  .flow-chip--decadal {
    background: var(--color-flow-decadal-soft);
    color: var(--color-flow-decadal);
  }
  .flow-chip--yearly {
    background: var(--color-flow-yearly-soft);
    color: var(--color-flow-yearly);
  }
  .flow-chip--monthly {
    background: var(--color-flow-monthly-soft);
    color: var(--color-flow-monthly);
  }
  .flow-chip--daily {
    background: var(--color-flow-daily-soft);
    color: var(--color-flow-daily);
  }
</style>
