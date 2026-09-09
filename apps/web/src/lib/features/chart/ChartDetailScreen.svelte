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
  import AuspiciousSummaryCard from '$lib/features/explanation/AuspiciousSummaryCard.svelte';
  import ExplanationToolbar from '$lib/features/explanation/ExplanationToolbar.svelte';
  import AssistantPanel from '$lib/features/assistant/AssistantPanel.svelte';
  import DailyFortuneCard from '$lib/features/fortune/DailyFortuneCard.svelte';
  import MonthlyFortuneCard from '$lib/features/fortune/MonthlyFortuneCard.svelte';
  import AnnualReportButton from '$lib/features/fortune/AnnualReportButton.svelte';
  import { createWalletModel } from '$lib/features/payment/wallet-model.svelte';
  import { createDossierModel } from '$lib/features/dossier/dossier-model.svelte';
  import DeluxePdfDossierModal from '$lib/features/dossier/DeluxePdfDossierModal.svelte';
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
  eyebrow={detail.isOwner ? copy.heroEyebrow : `${copy.heroEyebrow} · Lá số được chia sẻ`}
  title={copy.heroTitle}
  subtitle={copy.heroSubtitle}
  tone="mystical"
>
  {#snippet action()}
    <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
      {#if showBoard && detail.snapshot}
        <button
          type="button"
          class="btn-royal-dossier"
          disabled={dossier.isChecking || dossier.isUnlocking}
          onclick={() => dossier.openOrUnlock(wallet.balance)}
          title="Xuất bản Hồ Sơ Mệnh Lý Hoàng Gia (19 Trang Chuẩn In A4 Vector)"
        >
          <span class="dossier-crown">👑</span>
          <span class="dossier-text">Hồ Sơ Hoàng Gia</span>
          <span class="dossier-badge">{dossier.isUnlocked ? 'Đã Mở' : '50 XU'}</span>
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
          {#if detail.isOwner}
            <AnnualReportButton {auth} chartId={detail.chartId} initialReport={detail.latestAnnualReport} />
          {/if}
        </section>
      {/if}

      <section class="explanation-section" data-reveal aria-labelledby="explanation-title">
        <h2 class="section-title" id="explanation-title">{copy.explanationTitle}</h2>
        {#if detail.isOwner}
          <p class="hint">{explanationHint}</p>
          <PrimaryButton
            label={explanation.hasResult ? copy.regenerateExplanation : explanationButtonLabel}
            loading={explanation.isPending}
            disabled={explanationBlocked}
            onclick={explanation.generate}
          />
        {/if}
        {#if explanationBlocked}
          <NoticeBanner tone="warning" message={copy.explanationBlockedDescription} />
        {:else if explanation.isPending && !explanation.hasResult}
          <AIExplanationLoader isPending={explanation.isPending} />
        {:else if explanation.isError && explanation.errorMessage}
          <NoticeBanner tone="danger" message={explanation.errorMessage} />
        {:else if explanation.hasResult && explanation.renderedMarkdown}
          <div class="explanation-result-container">
            <AuspiciousSummaryCard markdown={explanation.renderedMarkdown} />
            <ExplanationToolbar
              markdown={explanation.renderedMarkdown}
              chartTitle={pageTitle}
              birthInfo={summaryItems.map((i) => `${i.label}: ${i.value}`).join(' · ')}
            />
            <article class="result surface-glass printable-content">
              <MarkdownView markdown={explanation.renderedMarkdown} />
            </article>
          </div>
        {:else}
          <EmptyStateCard
            title={copy.noExplanationTitle}
            description={detail.isOwner ? copy.noExplanationDescription : 'Lá số này hiện chưa có bài luận giải AI từ người tạo.'}
          />
        {/if}
      </section>

      {#if detail.isOwner}
        <section class="assistant-section" data-reveal aria-labelledby="assistant-title">
          <AssistantPanel
            chartSnapshotId={detail.chartId}
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

{#if dossier.isModalOpen && detail.snapshot}
  <DeluxePdfDossierModal
    snapshot={detail.snapshot}
    chartId={detail.chartId}
    userName={auth.user?.email ? auth.user.email.split('@')[0] : 'Đương Số'}
    onClose={dossier.closeModal}
  />
{/if}

<style>
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
    margin-top: 0;
    padding: var(--space-xl, 24px);
    border-radius: var(--radius-xl, 20px);
    border: 1px solid rgba(212, 175, 55, 0.25);
  }

  .explanation-result-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-md, 16px);
  }

  :global([data-theme="light"]) .result {
    background: #ffffff;
    border-color: rgba(180, 83, 9, 0.18);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
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
  @media print {
    :global(body) {
      background: #ffffff !important;
      color: #000000 !important;
    }

    :global(nav),
    :global(header),
    :global(.mobile-bottom-nav),
    :global(.explanation-toolbar),
    :global(.assistant-section),
    :global(.fortune-section),
    :global(button) {
      display: none !important;
    }

    .board-section,
    .explanation-section {
      border: none !important;
      padding: 0 !important;
    }

    .result {
      background: #ffffff !important;
      border: 1px solid #d1d5db !important;
      box-shadow: none !important;
      color: #111827 !important;
      padding: 0 !important;
    }
  }
</style>
