<script lang="ts">
  // ChartDetailScreen: màn chi tiết lá số (US-006). Giữ model chi tiết + model luận giải.
  // Được +page.svelte bọc trong {#key chartId} → đổi lá số sẽ remount component này,
  // model mới khởi tạo với selectedPalaceKey = null (reset đúng, KHÔNG $effect ghi ngược).
  //
  // Bố cục: tải → bàn 12 cung (Tử Vi) hoặc thẻ tóm tắt (hệ khác) → chi tiết cung đang chọn
  // → khối luận giải AI (markdown sanitize qua MarkdownView). Mọi nhãn tiếng Việt qua viCopy.
  import { browser } from '$app/environment';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { AppScaffold, PrimaryButton, SummaryCard, NoticeBanner, FullScreenState, EmptyStateCard } from '$lib/components/ui';
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
  import AIExplanationLoader from '$lib/features/explanation/AIExplanationLoader.svelte';
  import BlurTeaserExplanation from '$lib/features/explanation/BlurTeaserExplanation.svelte';
  import { paywallStore } from '$lib/stores/paywall.svelte';
  import AssistantPanel from '$lib/features/assistant/AssistantPanel.svelte';
  import DailyFortuneCard from '$lib/features/fortune/DailyFortuneCard.svelte';
  import MonthlyFortuneCard from '$lib/features/fortune/MonthlyFortuneCard.svelte';
  import AnnualReportButton from '$lib/features/fortune/AnnualReportButton.svelte';
  import DestinyTimelineCard from '$lib/features/timeline/DestinyTimelineCard.svelte';
  import { createWalletModel } from '$lib/features/payment/wallet-model.svelte';
  import { createDossierModel } from '$lib/features/dossier/dossier-model.svelte';
  import DeluxePdfDossierModal from '$lib/features/dossier/DeluxePdfDossierModal.svelte';
  import RoyalBaziDossierModal from '$lib/features/dossier/RoyalBaziDossierModal.svelte';
  import RoyalPosterModal from '$lib/features/poster/RoyalPosterModal.svelte';
  import RoyalBaziPosterModal from '$lib/features/poster/RoyalBaziPosterModal.svelte';
  import RoyalLiuyaoPosterModal from '$lib/features/poster/RoyalLiuyaoPosterModal.svelte';
  import RoyalExplanationPdfModal from '$lib/features/explanation/RoyalExplanationPdfModal.svelte';
  import AstrologicalSynthesisModal from '$lib/features/synthesis/AstrologicalSynthesisModal.svelte';
  import EnhancedSocialShareModal from '$lib/features/poster/EnhancedSocialShareModal.svelte';
  import PalaceDeepDiveModal from './PalaceDeepDiveModal.svelte';
  import AstrologicalJournalModal from '../journal/AstrologicalJournalModal.svelte';
  import BlockedBirthTimeGuidance from './BlockedBirthTimeGuidance.svelte';
  import { resolvePalaceScope } from '$lib/features/explanation/explanation-model.svelte';
  import { revealElements, revealHexagramLines } from '$lib/motion/reveal';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  interface Props {
    chartId: string;
  }

  let { chartId }: Props = $props();
  let detailRoot: HTMLDivElement | undefined = $state();
  let isPosterModalOpen = $state(false);
  let isExplanationPdfModalOpen = $state(false);
  let isSynthesisModalOpen = $state(false);
  let isEnhancedShareModalOpen = $state(false);
  let isPalaceDeepDiveOpen = $state(false);
  let isJournalModalOpen = $state(false);

  const auth = getAuthStore();
  const queryClient = useQueryClient();
  const wallet = createWalletModel(auth);
  const dossier = createDossierModel({
    auth,
    getChartId: () => chartId,
    onUnlocked: () => {
      void wallet.refresh();
    },
  });

  $effect(() => {
    if (auth.user?.id && !auth.isAnonymous && chartId) {
      void dossier.checkStatus();
    }
  });

  $effect(() => {
    function handleBeforePrint() {
      if (!dossier.isModalOpen) {
        document.body.classList.add('printing-explanation-scroll');
      }
    }
    function handleAfterPrint() {
      document.body.classList.remove('printing-explanation-scroll');
    }
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      document.body.classList.remove('printing-explanation-scroll');
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  });

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
    detail.selectedPalace ? `Luận giải Cung ${detail.selectedPalace.name}` : copy.generateOverviewExplanation,
  );

  $effect(() => {
    if (explanation.hasResult) {
      void wallet.refresh();
    }
  });

  let isExplanationUnlocked = $state(false);

  $effect(() => {
    if (browser) {
      const hasSavedInDb = detail.explanationResults.length > 0;
      const isCached = localStorage.getItem(`vios_unlocked_explanation_${chartId}`) === 'true';
      if (hasSavedInDb || isCached || explanation.hasResult || explanation.isStreaming) {
        isExplanationUnlocked = true;
      }
    }
  });

  function handleUnlockExplanation() {
    if (isExplanationUnlocked && explanation.hasResult) {
      explanation.generate();
      return;
    }

    if (wallet.balance < 10) {
      paywallStore.open({
        featureId: 'deep_explanation',
        featureName: 'Mở Khóa Toàn Bộ Thiên Cơ',
        requiredXu: 10,
        suggestedPackageXu: 50,
        message: 'Mở khóa toàn bộ luận giải thiên cơ chuyên sâu yêu cầu 10 XU (chỉ 10.000đ). Vui lòng nạp XU để tiếp tục.'
      });
      return;
    }

    if (browser) {
      localStorage.setItem(`vios_unlocked_explanation_${chartId}`, 'true');
    }
    isExplanationUnlocked = true;
    explanation.generate();
  }

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

  function handleShare() {
    isEnhancedShareModalOpen = true;
  }
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
</svelte:head>

<AppScaffold
  eyebrow={detail.isOwner ? copy.heroEyebrow : `${copy.heroEyebrow} · Lá số được chia sẻ`}
  title={copy.heroTitle}
  subtitle={copy.heroSubtitle}
  tone="mystical"
  wide={true}
>
  {#snippet action()}
    <div class="chart-header-actions">
      {#if (showBoard || detail.chartSystem === 'ba-zi' || detail.chartSystem === 'liu-yao') && detail.snapshot}
        <button
          type="button"
          class="btn-royal-poster"
          onclick={() => (isPosterModalOpen = true)}
          title="Xuất ảnh Lá Số / Quẻ Dịch Hoàng Gia chuẩn poster ngọc bảo để lưu trữ và chia sẻ"
        >
          <span class="poster-icon">🖼️</span>
          <span class="poster-text">Xuất Poster</span>
        </button>
        <button
          type="button"
          class="btn-royal-dossier"
          disabled={dossier.isChecking || dossier.isUnlocking}
          onclick={() => dossier.openOrUnlock(wallet.balance)}
          title={detail.chartSystem === 'ba-zi'
            ? 'Xuất bản Hồ Sơ Mệnh Lý Bát Tự Hoàng Gia (17 Trang Chuẩn In A4 Vector)'
            : 'Xuất bản Hồ Sơ Mệnh Lý Hoàng Gia (19 Trang Chuẩn In A4 Vector)'}
        >
          <span class="dossier-crown">👑</span>
          <span class="dossier-text">{detail.chartSystem === 'ba-zi' ? 'Hồ Sơ Bát Tự' : 'Hồ Sơ Hoàng Gia'}</span>
          <span class="dossier-badge">{dossier.isUnlocked ? 'Đã Mở' : '50 XU'}</span>
        </button>
        <button
          type="button"
          class="btn-royal-synthesis"
          onclick={() => (isSynthesisModalOpen = true)}
          title="Khai mở Đại Bản Luận Giải Tổng Hợp Tam Hợp (Thiên Đạo Tử Vi - Địa Đạo Bát Tự - Nhân Đạo Thần Số)"
        >
          <span class="synthesis-icon">✨</span>
          <span class="synthesis-text">Luận Giải Tam Hợp</span>
          <span class="synthesis-badge">VIP</span>
        </button>
        <button
          type="button"
          class="btn-royal-journal"
          onclick={() => (isJournalModalOpen = true)}
          title="Nhật Ký Vận Mệnh ViOS - Ghi chép chiêm nghiệm & đo lường chỉ số hòa hợp năng lượng"
        >
          <span class="journal-icon">📔</span>
          <span class="journal-text">Nhật Ký</span>
        </button>
      {/if}
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
      {#if !detail.isOwner}
        <NoticeBanner
          tone="info"
          message="Bạn đang xem lá số được chia sẻ qua liên kết an toàn. Bạn có thể tra cứu chi tiết cung sao, vận hạn và đọc các bài luận giải đã lập sẵn."
        />
      {/if}

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
            {#if detail.selectedPalace}
              <div class="palace-deepdive-bar">
                <div class="palace-bar-info">
                  <span class="palace-bar-badge">Cung Vị:</span>
                  <span class="palace-bar-name">Cung {detail.selectedPalace.name} ({detail.selectedPalace.stemBranch})</span>
                </div>
                <button
                  type="button"
                  class="btn-palace-deepdive-action"
                  onclick={() => (isPalaceDeepDiveOpen = true)}
                >
                  <span>🔍</span>
                  <span>Khám Phá Cung 360°</span>
                </button>
              </div>
            {/if}
            <ZiweiHoroscopePanel model={horoscope} />
          </div>
        </section>
      {:else if detail.palaces.length === 0 && detail.chartSystem === 'zi-wei-dou-shu'}
        {#if explanationBlocked || detail.snapshot?.birth.originalInput.time.isUnknown}
          <BlockedBirthTimeGuidance chartSystem={detail.chartSystem} chartId={detail.chartId} />
        {:else}
          <EmptyStateCard
            title={copy.twelvePalaceUnavailableTitle}
            description={copy.twelvePalaceUnavailableDescription}
          />
        {/if}
      {:else if (detail.chartSystem === 'ba-zi' || detail.chartSystem === 'mangpai') && (detail.snapshot?.pillars?.length ?? 0) === 0 && !detail.snapshot?.bazi}
        {#if explanationBlocked || detail.snapshot?.birth.originalInput.time.isUnknown}
          <BlockedBirthTimeGuidance chartSystem={detail.chartSystem} chartId={detail.chartId} />
        {:else}
          <EmptyStateCard
            title={copy.baziUnavailableTitle}
            description={copy.baziUnavailableDescription}
          />
        {/if}
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
          {#if detail.isOwner}
            <DestinyTimelineCard chartId={detail.chartId} token={auth.getAccessToken() || undefined} />
            <AnnualReportButton {auth} chartId={detail.chartId} initialReport={detail.latestAnnualReport} />
          {/if}
        </section>
      {/if}

      <section class="explanation-section" data-reveal aria-labelledby="explanation-title">
        <div class="explanation-section-header">
          <h2 class="section-title" id="explanation-title">{copy.explanationTitle}</h2>
          <span class="pricing-badge-chip">⚡ 10 XU / lượt (Lượt đầu miễn phí)</span>
        </div>
        {#if detail.isOwner}
          <p class="hint">
            {explanationHint}
            {#if !detail.selectedPalace}
              <span class="hint-monetization"> — Chạm vào một cung để xem chuyên sâu (10 XU/cung)</span>
            {/if}
          </p>
          <div class="explanation-actions-row">
            <PrimaryButton
              label={explanation.hasResult ? `${copy.regenerateExplanation} (10 XU)` : `${explanationButtonLabel} (10 XU)`}
              loading={explanation.isPending}
              disabled={explanationBlocked}
              onclick={handleUnlockExplanation}
            />
            <div class="wallet-balance-indicator">
              <span class="wallet-icon">🪙</span>
              <span class="wallet-text">Ví: <strong>{wallet.balance} XU</strong></span>
              {#if wallet.balance < 10}
                <a href="/pricing" class="topup-pill">+ Nạp XU</a>
              {/if}
            </div>
            {#if explanation.isPending}
              <button
                type="button"
                class="btn-abort-stream"
                onclick={explanation.abort}
                title="Dừng sinh luận giải"
              >
                <span class="stop-icon">■</span>
                <span>Dừng luận giải</span>
              </button>
            {/if}
          </div>
        {/if}
        {#if explanationBlocked}
          <NoticeBanner tone="warning" message={copy.explanationBlockedDescription} />
        {:else if explanation.isPending && !explanation.hasResult}
          <AIExplanationLoader isPending={explanation.isPending} />
        {:else if explanation.isError && explanation.errorMessage}
          <NoticeBanner tone="danger" message={explanation.errorMessage} />
        {:else}
          <div class="explanation-result-container">
            {#if explanation.isPending || explanation.isStreaming}
              <div class="streaming-hud-banner">
                <span class="pulse-dot"></span>
                <span class="streaming-hud-text">Khâm Thiên Giám đang truyền thiên cơ từng câu chữ...</span>
                <button type="button" class="streaming-abort-chip" onclick={explanation.abort}>Dừng sinh</button>
              </div>
            {/if}

            <BlurTeaserExplanation
              markdown={explanation.renderedMarkdown}
              chartSystem={detail.chartSystem}
              snapshot={detail.snapshot}
              pageTitle={pageTitle}
              isUnlocked={isExplanationUnlocked}
              isPending={explanation.isPending}
              isStreaming={explanation.isStreaming}
              isBlocked={explanationBlocked}
              userBalance={wallet.balance}
              summaryItems={summaryItems}
              onUnlock={handleUnlockExplanation}
              onAbort={explanation.abort}
              onOpenRoyalPdfModal={() => (isExplanationPdfModalOpen = true)}
            />
          </div>
        {/if}
      </section>

      {#if detail.isOwner}
        <section class="assistant-section" data-reveal aria-labelledby="assistant-title">
          <AssistantPanel
            chartSnapshotId={detail.chartId}
            activePalaceScope={resolvePalaceScope(detail.selectedPalaceKey)}
            activePalaceName={detail.selectedPalace?.name ?? null}
            onConversationCreated={() => {
              /* no-op: panel tự quản lý conversation id; có thể mở rộng để lưu vào chart-detail cache */
            }}
          />
        </section>
      {:else}
        <section class="assistant-section" data-reveal aria-labelledby="assistant-title">
          <NoticeBanner
            tone="info"
            message="Tính năng đàm thoại chuyên sâu với Trợ lý AI chỉ dành cho chủ sở hữu lá số. Hãy tạo lá số của riêng bạn để được tư vấn và giải đáp chi tiết!"
          />
        </section>
      {/if}
    </div>
  {/if}
</AppScaffold>

{#if isPosterModalOpen && detail.snapshot}
  {#if detail.chartSystem === 'liu-yao'}
    <RoyalLiuyaoPosterModal
      snapshot={detail.snapshot}
      chartId={detail.chartId}
      userName={auth.user?.email ? auth.user.email.split('@')[0] : 'Đương Số'}
      onClose={() => (isPosterModalOpen = false)}
    />
  {:else if detail.chartSystem === 'ba-zi'}
    <RoyalBaziPosterModal
      snapshot={detail.snapshot}
      chartId={detail.chartId}
      userName={auth.user?.email ? auth.user.email.split('@')[0] : 'Đương Số'}
      onClose={() => (isPosterModalOpen = false)}
    />
  {:else}
    <RoyalPosterModal
      snapshot={detail.snapshot}
      chartId={detail.chartId}
      userName={auth.user?.email ? auth.user.email.split('@')[0] : 'Đương Số'}
      onClose={() => (isPosterModalOpen = false)}
    />
  {/if}
{/if}

{#if dossier.isModalOpen && detail.snapshot}
  {#if detail.chartSystem === 'ba-zi'}
    <RoyalBaziDossierModal
      snapshot={detail.snapshot}
      chartId={detail.chartId}
      userName={auth.user?.email ? auth.user.email.split('@')[0] : 'Đương Số'}
      onClose={dossier.closeModal}
    />
  {:else}
    <DeluxePdfDossierModal
      snapshot={detail.snapshot}
      chartId={detail.chartId}
      userName={auth.user?.email ? auth.user.email.split('@')[0] : 'Đương Số'}
      onClose={dossier.closeModal}
    />
  {/if}
{/if}

{#if isExplanationPdfModalOpen && explanation.renderedMarkdown && detail.snapshot}
  <RoyalExplanationPdfModal
    markdown={explanation.renderedMarkdown}
    chartTitle={pageTitle}
    birthInfo={summaryItems.map((i) => `${i.label}: ${i.value}`).join(' · ')}
    chartId={detail.chartId}
    userName={auth.user?.email ? auth.user.email.split('@')[0] : 'Đương Số'}
    onClose={() => (isExplanationPdfModalOpen = false)}
  />
{/if}

{#if isSynthesisModalOpen}
  <AstrologicalSynthesisModal
    {chartId}
    chartTitle={pageTitle}
    onClose={() => (isSynthesisModalOpen = false)}
    onOpenShareModal={() => (isEnhancedShareModalOpen = true)}
  />
{/if}

{#if isEnhancedShareModalOpen}
  <EnhancedSocialShareModal
    title={pageTitle}
    subtitle={copy.heroSubtitle}
    path={`/share/charts/${chartId}`}
    quote="Mời bạn khám phá bản đồ vận mệnh Tử Vi Hoàng Gia cùng ViOS!"
    onClose={() => (isEnhancedShareModalOpen = false)}
  />
{/if}

{#if isPalaceDeepDiveOpen && detail.selectedPalace}
  <PalaceDeepDiveModal
    palace={detail.selectedPalace}
    allPalaces={detail.palaces}
    open={isPalaceDeepDiveOpen}
    onClose={() => (isPalaceDeepDiveOpen = false)}
  />
{/if}

{#if isJournalModalOpen}
  <AstrologicalJournalModal
    token={auth.getAccessToken() || undefined}
    open={isJournalModalOpen}
    onClose={() => (isJournalModalOpen = false)}
  />
{/if}

<style>
  .chart-header-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  @media (min-width: 960px) {
    .chart-header-actions {
      justify-content: flex-end;
    }
  }

  .btn-royal-poster {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 13px;
    background: linear-gradient(135deg, #241a0d 0%, #120e07 100%);
    border: 1px solid rgba(245, 158, 11, 0.5);
    border-radius: var(--radius-md, 6px);
    color: #fef3c7;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
    transition: all 0.2s ease;
  }

  .btn-royal-poster:hover {
    background: linear-gradient(135deg, #382711 0%, #1d160a 100%);
    border-color: #ffd700;
    color: #ffd700;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);
  }

  .poster-icon {
    font-size: 14px;
  }

  :global([data-theme="light"]) .btn-royal-poster {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-color: #d97706;
    color: #92400e;
    box-shadow: 0 2px 6px rgba(217, 119, 6, 0.15);
  }

  :global([data-theme="light"]) .btn-royal-poster:hover {
    background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
    border-color: #b45309;
    color: #78350f;
  }

  .btn-royal-dossier {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 13px;
    background: linear-gradient(135deg, #2b1f0c 0%, #171108 100%);
    border: 1px solid #d4af37;
    border-radius: var(--radius-md, 6px);
    color: #faf6ed;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.25);
    transition: all 0.2s ease;
  }

  .btn-royal-dossier:hover:not(:disabled) {
    background: linear-gradient(135deg, #3d2c12 0%, #20170a 100%);
    border-color: #ffe082;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(212, 175, 55, 0.4);
  }

  .btn-royal-dossier:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .dossier-crown {
    font-size: 14px;
  }

  .dossier-text {
    letter-spacing: 0.3px;
  }

  .dossier-badge {
    background: linear-gradient(135deg, #d4af37 0%, #aa821c 100%);
    color: #1a140a;
    font-size: 10px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
    margin-left: 2px;
  }

  .btn-royal-synthesis {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 13px;
    background: linear-gradient(135deg, #2e1065 0%, #17072b 100%);
    border: 1px solid rgba(168, 85, 247, 0.6);
    border-radius: var(--radius-md, 6px);
    color: #f3e8ff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(168, 85, 247, 0.25);
    transition: all 0.2s ease;
  }

  .btn-royal-synthesis:hover {
    background: linear-gradient(135deg, #4c1d95 0%, #2e1065 100%);
    border-color: #d8b4fe;
    color: #ffffff;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(168, 85, 247, 0.45);
  }

  .synthesis-badge {
    background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
    color: #ffffff;
    font-size: 10px;
    font-weight: 800;
    padding: 2px 5px;
    border-radius: 4px;
    margin-left: 2px;
  }

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

  .explanation-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 6px;
  }

  .pricing-badge-chip {
    font-size: 11.5px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 999px;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.35);
    color: #c7d2fe;
    letter-spacing: 0.3px;
  }

  .hint-monetization {
    color: #fbbf24;
    font-weight: 600;
  }

  .explanation-actions-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: var(--space-md, 16px);
  }

  .wallet-balance-indicator {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #9ca3af;
    background: rgba(0, 0, 0, 0.25);
    padding: 7px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .wallet-balance-indicator .topup-pill {
    color: #fbbf24;
    font-weight: 700;
    text-decoration: none;
    padding: 2px 8px;
    background: rgba(251, 191, 36, 0.15);
    border-radius: 6px;
    border: 1px solid rgba(251, 191, 36, 0.35);
    transition: all 0.2s ease;
  }

  .wallet-balance-indicator .topup-pill:hover {
    background: rgba(251, 191, 36, 0.3);
    color: #fef08a;
  }

  .btn-abort-stream {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 18px;
    border-radius: var(--radius-md, 8px);
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #fca5a5;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-abort-stream:hover {
    background: rgba(239, 68, 68, 0.28);
    border-color: #ef4444;
    color: #fee2e2;
  }

  .streaming-hud-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    background: linear-gradient(135deg, rgba(30, 24, 48, 0.85) 0%, rgba(18, 14, 32, 0.95) 100%);
    border: 1px solid rgba(212, 175, 55, 0.4);
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #fbbf24;
    box-shadow: 0 0 10px #fbbf24;
    animation: pulse-dot-anim 1.2s infinite ease-in-out;
  }

  @keyframes pulse-dot-anim {
    0%, 100% { transform: scale(0.6); opacity: 0.4; }
    50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 12px #fbbf24; }
  }

  .streaming-hud-text {
    font-size: 13px;
    font-weight: 600;
    color: #fef08a;
    flex: 1;
  }

  .streaming-abort-chip {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid rgba(239, 68, 68, 0.45);
    color: #fca5a5;
    padding: 4px 12px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .streaming-abort-chip:hover {
    background: rgba(239, 68, 68, 0.35);
    color: #fee2e2;
  }

  .explanation-result-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-md, 16px);
  }

  :global([data-theme="light"]) .btn-abort-stream {
    background: #fee2e2;
    border-color: rgba(239, 68, 68, 0.35);
    color: #b91c1c;
  }

  :global([data-theme="light"]) .btn-abort-stream:hover {
    background: #fecaca;
    color: #991b1b;
  }

  :global([data-theme="light"]) .streaming-hud-banner {
    background: linear-gradient(135deg, #ffffff 0%, #fef3c7 100%);
    border-color: rgba(180, 83, 9, 0.3);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  }

  :global([data-theme="light"]) .streaming-hud-text {
    color: #78350f;
  }

  :global([data-theme="light"]) .pulse-dot {
    background-color: #b45309;
    box-shadow: 0 0 10px #b45309;
  }

  :global([data-theme="light"]) .pricing-badge-chip {
    background: #eef2ff;
    border-color: #c7d2fe;
    color: #3730a3;
  }

  :global([data-theme="light"]) .hint-monetization {
    color: #92400e;
  }

  :global([data-theme="light"]) .wallet-balance-indicator {
    background: #f9fafb;
    border-color: #e5e7eb;
    color: #4b5563;
  }

  :global([data-theme="light"]) .wallet-balance-indicator .topup-pill {
    background: #fef3c7;
    border-color: #f59e0b;
    color: #92400e;
  }

  @media (min-width: 1080px) {
    .detail-page {
      gap: var(--space-xxl);
    }

    .section-title {
      font-size: 24px;
    }
  }



  /* Chế độ In Sớ / Xuất PDF (@media print) */
  .btn-royal-journal {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.45rem 0.85rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #fef08a;
    background: linear-gradient(135deg, rgba(161, 98, 7, 0.4) 0%, rgba(113, 63, 18, 0.6) 100%);
    border: 1px solid rgba(234, 179, 8, 0.5);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .btn-royal-journal:hover {
    background: linear-gradient(135deg, rgba(202, 138, 4, 0.5) 0%, rgba(133, 77, 14, 0.7) 100%);
    border-color: rgba(250, 204, 21, 0.8);
    transform: translateY(-1px);
  }
  .palace-deepdive-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    margin-top: 0.75rem;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(217, 119, 6, 0.35);
    border-radius: 0.75rem;
  }
  .palace-bar-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .palace-bar-badge {
    font-size: 0.75rem;
    color: #a1a1aa;
  }
  .palace-bar-name {
    font-size: 0.875rem;
    font-weight: 700;
    color: #fef08a;
  }
  .btn-palace-deepdive-action {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.35rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #18181b;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .btn-palace-deepdive-action:hover {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    transform: scale(1.03);
  }

  @media print {
    :global(html),
    :global(body) {
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Mở khóa phân trang container cha khi KHÔNG IN DOSSIER */
    :global(body:not(.printing-deluxe-dossier)) {
      background: #ffffff !important;
      color: #111827 !important;
      overflow: visible !important;
      height: auto !important;
      min-height: 0 !important;
    }

    :global(body:not(.printing-deluxe-dossier) .app-content-wrapper),
    :global(body:not(.printing-deluxe-dossier) .screen),
    :global(body:not(.printing-deluxe-dossier) .container),
    :global(body:not(.printing-deluxe-dossier) .body-layout),
    :global(body:not(.printing-deluxe-dossier) .content),
    :global(body:not(.printing-deluxe-dossier)) .detail-page {
      overflow: visible !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      position: static !important;
      padding: 0 !important;
      margin: 0 !important;
      background: #ffffff !important;
      color: #111827 !important;
      transform: none !important;
      border: none !important;
      box-shadow: none !important;
    }

    /* Ẩn các khối không cần in khi in Sớ */
    :global(body:not(.printing-deluxe-dossier) nav),
    :global(body:not(.printing-deluxe-dossier) header.hero),
    :global(body:not(.printing-deluxe-dossier) .top-nav-bar),
    :global(body:not(.printing-deluxe-dossier) .mobile-bottom-nav),
    :global(body:not(.printing-deluxe-dossier) .explanation-toolbar),
    :global(body:not(.printing-deluxe-dossier) .assistant-section),
    :global(body:not(.printing-deluxe-dossier) .fortune-section),
    :global(body:not(.printing-deluxe-dossier) .board-section),
    :global(body:not(.printing-deluxe-dossier) .toast-container),
    :global(body:not(.printing-deluxe-dossier) button) {
      display: none !important;
    }

    :global(body:not(.printing-deluxe-dossier)) .explanation-section {
      border: none !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: visible !important;
      height: auto !important;
    }

    :global(body:not(.printing-deluxe-dossier)) .section-title,
    :global(body:not(.printing-deluxe-dossier)) .hint {
      display: none !important;
    }

    :global(body:not(.printing-deluxe-dossier)) .explanation-result-container {
      overflow: visible !important;
      height: auto !important;
    }



    @page {
      size: A4 portrait;
      margin: 18mm 15mm 20mm 15mm;
    }
  }
</style>
