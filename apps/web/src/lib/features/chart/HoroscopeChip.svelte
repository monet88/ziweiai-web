<script lang="ts">
  // HoroscopeChip: 1 nút chip trong panel vận hạn (US-015). Thuần trình bày — nhãn primary
  // (năm/tháng/ngày/tên cung) + secondary (tuổi / can-chi / tên cung Mệnh vận đích) đã dịch
  // tiếng Việt ở helper `horoscope-chips` (fail-fast translateZiweiKey). aria-pressed phản ánh
  // trạng thái chọn; toggle do cha xử lý (reducer selectX). Mỗi tầng tô màu accent riêng để
  // khớp overlay trên bàn (đại vận vàng/tím, lưu niên xanh, lưu nguyệt tím, lưu nhật hồng).
  import type { HighlightTier } from '$lib/features/chart/palace-flow-flags';

  interface Props {
    primary: string;
    secondary: string;
    selected: boolean;
    /** Tầng vận hạn → màu accent khi selected (khớp --color-horoscope-*). */
    tier: HighlightTier;
    onClick: () => void;
  }

  let { primary, secondary, selected, tier, onClick }: Props = $props();
</script>

<button
  type="button"
  class="chip chip--{tier}"
  class:selected
  aria-pressed={selected}
  onclick={onClick}
>
  <span class="chip__primary">{primary}</span>
  <span class="chip__secondary">{secondary}</span>
</button>

<style>
  .chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    min-width: 56px;
    padding: var(--space-xs) var(--space-sm);
    border: 1.5px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: border-color 150ms ease, background-color 150ms ease, color 150ms ease;
  }

  .chip:hover {
    border-color: var(--color-accent-primary);
  }

  .chip:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 1px;
  }

  @media (prefers-reduced-motion: reduce) {
    .chip {
      transition: none;
    }
  }

  .chip__primary {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .chip__secondary {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  /* Selected: viền + nền theo màu tầng tương ứng (khớp outline overlay trên bàn). */
  .chip.selected {
    background: var(--color-bg-elevated);
  }

  .chip--decadal.selected {
    border-color: var(--color-horoscope-decadal);
  }
  .chip--yearly.selected {
    border-color: var(--color-horoscope-yearly);
  }
  .chip--monthly.selected {
    border-color: var(--color-horoscope-monthly);
  }
  .chip--daily.selected {
    border-color: var(--color-horoscope-daily);
  }
</style>
