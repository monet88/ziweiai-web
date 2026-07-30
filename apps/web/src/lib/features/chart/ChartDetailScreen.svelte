<script lang="ts">
  // ChartDetailScreen: màn chi tiết lá số (US-006). Giữ model chi tiết + model luận giải.
  // Được +page.svelte bọc trong {#key chartId} → đổi lá số sẽ remount component này,
  // model mới khởi tạo với selectedPalaceKey = null (reset đúng, KHÔNG $effect ghi ngược).
  //
  // Bố cục: tải → bàn 12 cung (Tử Vi) hoặc thẻ tóm tắt (hệ khác) → chi tiết cung đang chọn
  // → khối luận giải AI (markdown sanitize qua MarkdownView). Mọi nhãn tiếng Việt qua viCopy.
  import { getAuthStore } from '$lib/auth/auth-context';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { AppScaffold, PrimaryButton, SummaryCard, NoticeBanner, FullScreenState, EmptyStateCard } from '$lib/components/ui';
  import { authModalStore } from '$lib/stores/auth-modal.svelte';
  import { viCopy } from '$lib/i18n/vi';
  import { createChartDetailModel } from '$lib/features/chart/chart-detail-model.svelte';
  import { createExplanationModel } from '$lib/features/explanation/explanation-model.svelte';
  import { shouldRenderZiweiBoard, getChartDetailState } from '$lib/features/chart/chart-detail-view-state';
  import { formatCenterSummaryItems, formatChartSummaryItems } from '$lib/features/chart/chart-display';
  import { getChartDetailSelectionHint } from '$lib/features/chart/chart-explanation-intent';
  import PalaceGrid from '$lib/features/chart/PalaceGrid.svelte';
  import ZiweiHoroscopePanel from '$lib/features/chart/ZiweiHoroscopePanel.svelte';
  import { createHoroscopePanelModel } from '$lib/features/chart/horoscope-panel-model.svelte';
  import BaziDetailCard from '$lib/features/chart/BaziDetailCard.svelte';
  import MangpaiDetailCard from '$lib/features/chart/MangpaiDetailCard.svelte';
  import MeihuaDetailCard from '$lib/features/chart/MeihuaDetailCard.svelte';
  import LiuyaoDetailCard from '$lib/features/chart/LiuyaoDetailCard.svelte';
  import DaliurenDetailCard from '$lib/features/chart/DaliurenDetailCard.svelte';
  import QimenDetailCard from '$lib/features/chart/QimenDetailCard.svelte';
  import MarkdownView from '$lib/features/explanation/MarkdownView.svelte';
  import AIExplanationLoader from '$lib/features/explanation/AIExplanationLoader.svelte';
  import AssistantPanel from '$lib/features/assistant/AssistantPanel.svelte';
  import DailyFortuneCard from '$lib/features/fortune/DailyFortuneCard.svelte';
  import MonthlyFortuneCard from '$lib/features/fortune/MonthlyFortuneCard.svelte';
  import AnnualReportButton from '$lib/features/fortune/AnnualReportButton.svelte';
  import { createWalletModel } from '$lib/features/payment/wallet-model.svelte';
  import { appendReferralQuery, sanitizeReferralCode } from '$lib/features/referral/append-referral-query';
  import { revealElements, revealHexagramLines } from '$lib/motion/reveal';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { supabase } from '$lib/supabase/supabase-client';

  interface Props {
    chartId: string;
  }

  let { chartId }: Props = $props();
  let detailRoot: HTMLDivElement | undefined = $state();

  const auth = getAuthStore();
  const queryClient = useQueryClient();
  const wallet = createWalletModel(auth);

  // getChartId là getter reactive (Svelte 5): model luôn đọc chartId mới nhất trong
  // queryKey/queryFn mà không cần snapshot lúc mount. +page.svelte vẫn bọc {#key chartId}
  // để reset selectedPalaceKey khi đổi lá số.
  const detail = createChartDetailModel({ auth, getChartId: () => chartId });

  // chartSnapshotId cho luận giải = chartRecord.id (route chartId). Dashboard điều hướng
  // bằng response.chartRecord.id, và createExplanationRequest.chartSnapshotId là id bản ghi.
  const explanation = createExplanationModel({
    auth,
    queryClient,
    getChartSnapshotId: () => detail.chartId,
    getSelectedPalaceKey: () => detail.selectedPalaceKey,
    getExplanationResults: () => detail.explanationResults,
  });

  const copy = viCopy.chart;

  // US-015: model panel vận hạn — parent sở hữu, đọc overlay truyền vào <PalaceGrid> + truyền
  // model cho <ZiweiHoroscopePanel>. Một nguồn reactive duy nhất, KHÔNG $effect ghi ngược.
  const horoscope = createHoroscopePanelModel({
    auth,
    getChartId: () => detail.chartId,
    getSnapshot: () => detail.snapshot,
    getPalaces: () => detail.palaces,
  });

  const showBoard = $derived(shouldRenderZiweiBoard(detail.chartSystem, detail.palaces.length));
  const detailState = $derived(getChartDetailState(detail.chartSystem, detail.palaces.length));
  const summaryItems = $derived(detail.snapshot ? formatChartSummaryItems(detail.snapshot.summary) : []);
  const centerItems = $derived(detail.snapshot ? formatCenterSummaryItems(detail.snapshot.summary) : []);
  const selectionHint = $derived(getChartDetailSelectionHint(copy, detail.selectedPalace?.name ?? null));
  const explanationHint = $derived(showBoard ? selectionHint : copy.overviewExplanationGenericHint);
  const explanationBlocked = $derived(detail.snapshot?.calculationConfidence.blocksExactReading ?? false);

  const explanationButtonLabel = $derived(
    detail.selectedPalace ? copy.generatePalaceExplanation : copy.generateOverviewExplanation,
  );

  // Phase 11 Ticket 3: dynamic document title / description from chart system + birth extras.
  const systemTitleByKey: Record<string, string> = {
    'zi-wei-dou-shu': 'Lá số Tử Vi',
    'ba-zi': 'Lá số Bát Tự',
    mangpai: 'Lá số Mạnh Phái',
    'mei-hua-yi-shu': 'Quẻ Mai Hoa',
    'liu-yao': 'Quẻ Lục Hào',
    'da-liu-ren': 'Quẻ Đại Lục Nhâm',
    'qi-men-dun-jia': 'Kỳ Môn Độn Giáp',
  };

  const pageTitle = $derived.by(() => {
    if (!detail.snapshot) {
      return `${copy.heroTitle} | Tử Vi Toàn Tập`;
    }
    const base = systemTitleByKey[detail.chartSystem ?? ''] ?? copy.heroTitle;
    const birth = detail.snapshot.birth?.originalInput;
    const year = birth?.date?.year;
    const sex = birth?.sexOrGenderForChart;
    const gender =
      sex === 'male' ? 'Nam Mạng' : sex === 'female' ? 'Nữ Mạng' : null;
    const bits = [base];
    if (gender) bits.push(gender);
    if (year) bits.push(String(year));
    return `${bits.join(' · ')} | Tử Vi Toàn Tập`;
  });

  const pageDescription = $derived.by(() => {
    if (!detail.snapshot) {
      return copy.heroSubtitle ?? 'Lập lá số và luận giải AI trên Tử Vi Toàn Tập.';
    }
    const base = systemTitleByKey[detail.chartSystem ?? ''] ?? 'lá số';
    return `Xem ${base.toLowerCase()} trên Tử Vi Toàn Tập. Luận giải AI, vận hạn và chia sẻ an toàn.`;
  });

  // Áp đại vận mặc định khi snapshot Tử Vi sẵn sàng. ensureDefault có guard `locked` (chỉ
  // áp 1 lần + dừng nếu user đã tương tác) nên gọi lại an toàn; đọc snapshot/palaces trong
  // effect → tự rerun khi data tới muộn. KHÔNG ghi ngược selection ngoài lần default này.
  $effect.pre(() => {
    if (showBoard) {
      horoscope.ensureDefault();
    }
  });

  // Phase 11 Ticket 2: GSAP entrance for sections + hexagram line rows when snapshot ready.
  $effect(() => {
    if (!detailRoot || detail.isPending || detail.isError || !detail.snapshot) {
      return;
    }
    // Read snapshot id so remount/new chart re-triggers reveal.
    void detail.chartId;
    const cleanupReveal = revealElements(detailRoot);
    const cleanupLines = revealHexagramLines(detailRoot);
    return () => {
      cleanupReveal();
      cleanupLines();
    };
  });

  async function handleShare() {
    if (auth.isAnonymous) {
      authModalStore.open('Vui lòng đăng ký tài khoản để có thể chia sẻ lá số của bạn.');
      return;
    }
    
    let referralCode = wallet.referralCode;
    // Avoid race: wallet query may still be loading when user taps Chia Sẻ.
    if (!referralCode && auth.user?.id && !auth.isAnonymous) {
      const { data } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('user_id', auth.user.id)
        .maybeSingle();
      referralCode = sanitizeReferralCode(data?.referral_code ?? null);
    }

    const shareUrl = appendReferralQuery(
      `${window.location.origin}/share/charts/${detail.chartId}`,
      referralCode,
    );
    if (navigator.share) {
      try {
        await navigator.share({
          title: pageTitle,
          text: pageDescription,
          url: shareUrl
        });
        return;
      } catch {
        // ignore aborts
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Đã copy link chia sẻ!');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  }
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
</svelte:head>

<AppScaffold
  eyebrow={copy.heroEyebrow}
  title={copy.heroTitle}
  subtitle={copy.heroSubtitle}
  tone="mystical"
>
  {#snippet action()}
    <div style="display: flex; gap: 8px;">
      <PrimaryButton
        label="Chia Sẻ"
        variant="primary"
        onclick={handleShare}
      />
      <PrimaryButton
        label={viCopy.bazi.returnToDashboard}
        variant="surface"
        onclick={() => goto(resolve('/'))}
      />
    </div>
  {/snippet}

  {#if detail.isPending}
    <FullScreenState title={copy.loadingChartTitle} message={copy.loadingChartMessage} />
  {:else if detail.isError || !detail.snapshot}
    <NoticeBanner tone="danger" message={copy.chartNotAvailableFallback} />
  {:else}
    <div class="detail-page" bind:this={detailRoot}>
      {#if showBoard}
        <section class="board-section" data-reveal aria-labelledby="palace-board-title">
          <h2 class="section-title" id="palace-board-title">{copy.twelvePalaceTitle}</h2>
          <div class="board-layout board-glass surface-glass">
            <PalaceGrid
              palaces={detail.palaces}
              selectedPalaceKey={detail.selectedPalaceKey}
              onSelect={detail.selectPalace}
              chartId={detail.chartId}
              horoscopeOverlay={horoscope.overlay}
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
            <ZiweiHoroscopePanel model={horoscope} />
          </div>
        </section>
      {:else if detail.palaces.length === 0 && detail.chartSystem === 'zi-wei-dou-shu'}
        <EmptyStateCard
          title={copy.twelvePalaceUnavailableTitle}
          description={copy.twelvePalaceUnavailableDescription}
        />
      {:else if detailState === 'pillars'}
        <BaziDetailCard snapshot={detail.snapshot} />
      {:else if detailState === 'mangpai'}
        <MangpaiDetailCard snapshot={detail.snapshot} />
      {:else if detailState === 'hexagram'}
        <MeihuaDetailCard snapshot={detail.snapshot} />
      {:else if detailState === 'liuyao'}
        <LiuyaoDetailCard snapshot={detail.snapshot} />
      {:else if detailState === 'daliuren'}
        <DaliurenDetailCard snapshot={detail.snapshot} />
      {:else if detailState === 'qimen'}
        <QimenDetailCard snapshot={detail.snapshot} />
      {:else}
        <SummaryCard variant="glass" title={copy.chartSummary} items={summaryItems} />
      {/if}

      {#if showBoard}
        <section class="fortune-section" data-reveal aria-labelledby="fortune-title">
          <h2 class="section-title" id="fortune-title">{viCopy.fortune.sectionTitle}</h2>
          <div class="fortune-grid">
            <DailyFortuneCard {auth} chartId={detail.chartId} />
            <MonthlyFortuneCard {auth} chartId={detail.chartId} />
          </div>
          <AnnualReportButton {auth} chartId={detail.chartId} />
        </section>
      {/if}

      <section class="explanation-section" data-reveal aria-labelledby="explanation-title">
        <h2 class="section-title" id="explanation-title">{copy.explanationTitle}</h2>
        <p class="hint">{explanationHint}</p>

        <PrimaryButton
          label={explanation.hasResult ? copy.regenerateExplanation : explanationButtonLabel}
          loading={explanation.isPending}
          disabled={explanationBlocked}
          onclick={explanation.generate}
        />
        {#if explanationBlocked}
          <NoticeBanner tone="warning" message={copy.explanationBlockedDescription} />
        {:else if explanation.isPending && !explanation.hasResult}
          <AIExplanationLoader isPending={explanation.isPending} />
        {:else if explanation.isError && explanation.errorMessage}
          <NoticeBanner tone="danger" message={explanation.errorMessage} />
        {:else if explanation.hasResult && explanation.renderedMarkdown}
          <article class="result surface-glass">
            <MarkdownView markdown={explanation.renderedMarkdown} />
          </article>
        {:else}
          <EmptyStateCard title={copy.noExplanationTitle} description={copy.noExplanationDescription} />
        {/if}
      </section>

      <section class="assistant-section" data-reveal aria-labelledby="assistant-title">
        <AssistantPanel
          chartSnapshotId={detail.chartId}
          onConversationCreated={() => {
            /* no-op: panel tự quản lý conversation id; có thể mở rộng để lưu vào chart-detail cache */
          }}
        />
      </section>
    </div>
  {/if}
</AppScaffold>

<style>
  .detail-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }

  .section-title {
    margin: 0 0 var(--space-lg);
    color: var(--color-text-primary);
    font-size: 22px;
    font-weight: 750;
    line-height: 1.15;
    letter-spacing: 0;
  }

  .board-section,
  .fortune-section,
  .explanation-section,
  .assistant-section {
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--overlay-border);
    padding-top: var(--space-xl);
  }

  /* Phan tu dau trong .detail-page nam ngay duoi hero (da co border-bottom): bo vien/padding
     tren de tranh duong ke kep. */
  .detail-page > :first-child {
    border-top: none;
    padding-top: 0;
  }

  /* US-016: section vận hạn — hai card (ngày/tháng) song song trên desktop, xếp dọc mobile;
     nút báo cáo năm bên dưới. */
  .fortune-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-md);
    margin-bottom: var(--space-md);
  }

  @media (min-width: 768px) {
    .fortune-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  /* US-015: bàn 12 cung + panel vận hạn xếp dọc 1 cột ở MỌI bề rộng. Bàn Tử Vi là bàn vuông
     4x4 (min-width 560px) nên khi ép vào cột hẹp của split 2 cột nó tràn ra và bị panel đè
     lên các cung bên phải. Cho bàn chiếm trọn bề ngang ở trên, panel vận hạn nằm dưới —
     bàn có đủ chỗ vẽ, panel dàn chip (đại vận/lưu niên) ngang thoải mái. */
  .board-layout {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .board-glass {
    padding: var(--space-md);
    border-radius: var(--radius-xl);
  }

  .center-title {
    margin: 0 0 var(--space-sm);
    color: var(--color-text-primary);
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

  .result {
    margin-top: var(--space-md);
    padding: var(--space-lg);
    border-radius: var(--radius-xl);
  }

  @media (min-width: 1080px) {
    .detail-page {
      gap: var(--space-xxl);
    }

    .section-title {
      font-size: 24px;
    }
  }
</style>
