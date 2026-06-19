<script lang="ts">
  // ZiweiHoroscopePanel: panel vận hạn 4 tầng (US-015) — đại vận → lưu niên → lưu nguyệt →
  // lưu nhật. Port state machine taibu `ZiweiHoroscopePanel.tsx` sang runes. Nhận model đã
  // dựng ở parent (ChartDetailScreen) — parent cũng đọc model.overlay truyền vào <PalaceGrid>
  // → một nguồn reactive duy nhất, KHÔNG $effect ghi ngược (bất biến §3).
  //
  // Mỗi vùng dưới chỉ hiện khi tầng trên đã chọn (model.*Selected). Chip value parse từ key đã
  // định dạng ở helper (`decadal-<i>`/`yearly-<year>`/`monthly-<m>`/`daily-<d>`) — key là hợp
  // đồng nội bộ giữa helper + panel. Mọi nhãn tiếng Việt qua viCopy + translateZiweiKey (fail-fast).
  import { viCopy } from '$lib/i18n/vi';
  import type { HoroscopePanelModel } from '$lib/features/chart/horoscope-panel-model.svelte';
  import HoroscopeSection from './HoroscopeSection.svelte';
  import HoroscopeChip from './HoroscopeChip.svelte';

  interface Props {
    model: HoroscopePanelModel;
  }

  let { model }: Props = $props();

  const copy = viCopy.horoscope;
</script>

<aside class="panel" aria-label={copy.panelTitle}>
  <h2 class="panel__title">{copy.panelTitle}</h2>

  {#if !model.hasDecadalData}
    <p class="panel__hint">{copy.unavailableHint}</p>
  {:else}
    {#if model.isError}
      <p class="panel__error" role="alert">{copy.error}</p>
    {:else if model.isFetching}
      <p class="panel__status">{copy.loading}</p>
    {/if}

    <HoroscopeSection
      title={copy.decadal.title}
      chips={model.decadalChips}
      ariaLabel={copy.decadal.title}
    >
      {#snippet chip(item)}
        <HoroscopeChip
          primary={item.primary}
          secondary={item.secondary}
          selected={item.selected}
          tier="decadal"
          onClick={() => model.selectDecadal(item.value)}
        />
      {/snippet}
    </HoroscopeSection>

    <HoroscopeSection
      title={copy.yearly.title}
      chips={model.yearlyChips}
      ariaLabel={copy.yearly.title}
      emptyHint={copy.yearly.emptyHint}
    >
      {#snippet chip(item)}
        <HoroscopeChip
          primary={item.primary}
          secondary={item.secondary}
          selected={item.selected}
          tier="yearly"
          onClick={() => model.selectYearlyByYear(item.value)}
        />
      {/snippet}
    </HoroscopeSection>

    {#if model.yearlySelected}
      <HoroscopeSection
        title={copy.monthly.title}
        chips={model.monthlyChips}
        ariaLabel={copy.monthly.title}
        emptyHint={copy.monthly.emptyHint}
      >
        {#snippet chip(item)}
          <HoroscopeChip
            primary={item.primary}
            secondary={item.secondary}
            selected={item.selected}
            tier="monthly"
            onClick={() => model.selectMonthly(item.value)}
          />
        {/snippet}
      </HoroscopeSection>
    {/if}

    {#if model.monthlySelected}
      <HoroscopeSection
        title={copy.daily.title}
        chips={model.dailyChips}
        ariaLabel={copy.daily.title}
        emptyHint={copy.daily.emptyHint}
      >
        {#snippet chip(item)}
          <HoroscopeChip
            primary={item.primary}
            secondary={item.secondary}
            selected={item.selected}
            tier="daily"
            onClick={() => model.selectDaily(item.value)}
          />
        {/snippet}
      </HoroscopeSection>
    {/if}
  {/if}
</aside>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-md);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-lg);
    background: var(--color-bg-surface);
  }

  .panel__title {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 16px;
    font-weight: 600;
  }

  .panel__hint,
  .panel__status,
  .panel__error {
    margin: 0;
    font-size: 13px;
  }

  .panel__hint,
  .panel__status {
    color: var(--color-text-muted);
  }

  .panel__error {
    color: var(--color-danger, #c0564a);
  }
</style>
