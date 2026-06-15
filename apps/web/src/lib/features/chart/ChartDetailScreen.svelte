<script lang="ts">
  // ChartDetailScreen: màn chi tiết lá số (US-006). Giữ model chi tiết + model luận giải.
  // Được +page.svelte bọc trong {#key chartId} → đổi lá số sẽ remount component này,
  // model mới khởi tạo với selectedPalaceKey = null (reset đúng, KHÔNG $effect ghi ngược).
  //
  // Bố cục: tải → bàn 12 cung (Tử Vi) hoặc thẻ tóm tắt (hệ khác) → chi tiết cung đang chọn
  // → khối luận giải AI (markdown sanitize qua MarkdownView). Mọi nhãn tiếng Việt qua viCopy.
  import { getAuthStore } from '$lib/auth/auth-context';
  import { AppScaffold, PrimaryButton, SummaryCard, NoticeBanner, FullScreenState, EmptyStateCard } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import { createChartDetailModel } from '$lib/features/chart/chart-detail-model.svelte';
  import { createExplanationModel } from '$lib/features/explanation/explanation-model.svelte';
  import { shouldRenderZiweiBoard } from '$lib/features/chart/chart-detail-view-state';
  import { formatCenterSummaryItems, formatChartSummaryItems, formatPillarItems } from '$lib/features/chart/chart-display';
  import { getChartDetailSelectionHint } from '$lib/features/chart/chart-explanation-intent';
  import PalaceGrid from '$lib/features/chart/PalaceGrid.svelte';
  import MarkdownView from '$lib/features/explanation/MarkdownView.svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  interface Props {
    chartId: string;
  }

  let { chartId }: Props = $props();

  const auth = getAuthStore();

  // getChartId là getter reactive (Svelte 5): model luôn đọc chartId mới nhất trong
  // queryKey/queryFn mà không cần snapshot lúc mount. +page.svelte vẫn bọc {#key chartId}
  // để reset selectedPalaceKey khi đổi lá số.
  const detail = createChartDetailModel({ auth, getChartId: () => chartId });

  // chartSnapshotId cho luận giải = chartRecord.id (route chartId). Dashboard điều hướng
  // bằng response.chartRecord.id, và createExplanationRequest.chartSnapshotId là id bản ghi.
  const explanation = createExplanationModel({
    auth,
    getChartSnapshotId: () => detail.chartId,
    getSelectedPalaceKey: () => detail.selectedPalaceKey,
  });

  const copy = viCopy.chart;

  const showBoard = $derived(shouldRenderZiweiBoard(detail.chartSystem, detail.palaces.length));
  const summaryItems = $derived(detail.snapshot ? formatChartSummaryItems(detail.snapshot.summary) : []);
  const centerItems = $derived(detail.snapshot ? formatCenterSummaryItems(detail.snapshot.summary) : []);
  const pillarItems = $derived(detail.snapshot ? formatPillarItems(detail.snapshot) : []);
  const selectionHint = $derived(getChartDetailSelectionHint(copy, detail.selectedPalace?.name ?? null));

  const explanationButtonLabel = $derived(
    detail.selectedPalace ? copy.generatePalaceExplanation : copy.generateOverviewExplanation,
  );
</script>

<AppScaffold
  eyebrow={copy.heroEyebrow}
  title={copy.heroTitle}
  subtitle={copy.heroSubtitle}
>
  {#snippet action()}
    <PrimaryButton
      label={viCopy.bazi.returnToDashboard}
      variant="surface"
      onclick={() => goto(resolve('/'))}
    />
  {/snippet}

  {#if detail.isPending}
    <FullScreenState title={copy.loadingChartTitle} message={copy.loadingChartMessage} />
  {:else if detail.isError || !detail.snapshot}
    <NoticeBanner tone="danger" message={copy.chartNotAvailableFallback} />
  {:else}
    {#if showBoard}
      <section class="board-section" aria-labelledby="palace-board-title">
        <h2 class="section-title" id="palace-board-title">{copy.twelvePalaceTitle}</h2>
        <PalaceGrid
          palaces={detail.palaces}
          selectedPalaceKey={detail.selectedPalaceKey}
          onSelect={detail.selectPalace}
        >
          {#snippet center()}
            <h3 class="center-title">{copy.centerSummaryTitle}</h3>
            <dl class="center-list">
              {#each centerItems as item (item.label)}
                <div class="center-row">
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              {/each}
            </dl>
          {/snippet}
        </PalaceGrid>
      </section>
    {:else if detail.palaces.length === 0 && detail.chartSystem === 'zi-wei-dou-shu'}
      <EmptyStateCard
        title={copy.twelvePalaceUnavailableTitle}
        description={copy.twelvePalaceUnavailableDescription}
      />
    {:else}
      <SummaryCard title={copy.chartSummary} items={summaryItems} />
      {#if pillarItems.length > 0}
        <SummaryCard title={copy.pillarsTitle} items={pillarItems} />
      {/if}
    {/if}

    <section class="explanation-section" aria-labelledby="explanation-title">
      <h2 class="section-title" id="explanation-title">{copy.explanationTitle}</h2>
      <p class="hint">{selectionHint}</p>

      <PrimaryButton
        label={explanation.hasResult ? copy.regenerateExplanation : explanationButtonLabel}
        loading={explanation.isPending}
        onclick={explanation.generate}
      />

      {#if explanation.isPending && !explanation.hasResult}
        <p class="status">{viCopy.explanation.statusPending}</p>
      {:else if explanation.isError && explanation.errorMessage}
        <NoticeBanner tone="danger" message={explanation.errorMessage} />
      {:else if explanation.hasResult && explanation.renderedMarkdown}
        <article class="result">
          <MarkdownView markdown={explanation.renderedMarkdown} />
        </article>
      {:else}
        <EmptyStateCard title={copy.noExplanationTitle} description={copy.noExplanationDescription} />
      {/if}
    </section>
  {/if}
</AppScaffold>

<style>
  .section-title {
    margin: 0 0 var(--space-md);
    color: var(--color-text-primary);
    font-size: 18px;
    font-weight: 600;
  }

  .board-section,
  .explanation-section {
    display: flex;
    flex-direction: column;
  }

  .center-title {
    margin: 0 0 var(--space-sm);
    color: var(--color-accent-gold-soft);
    font-size: 14px;
    font-weight: 600;
  }

  .center-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin: 0;
  }

  .center-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .center-row dt {
    color: var(--color-text-muted);
    font-size: 11px;
  }

  .center-row dd {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 13px;
  }

  .hint {
    margin: 0 0 var(--space-md);
    color: var(--color-text-muted);
    font-size: 14px;
    line-height: 1.5;
  }

  .status {
    margin: var(--space-md) 0 0;
    color: var(--color-text-muted);
    font-size: 14px;
  }

  .result {
    margin-top: var(--space-md);
    padding: var(--space-lg);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-lg);
    background: var(--color-bg-surface);
  }
</style>
