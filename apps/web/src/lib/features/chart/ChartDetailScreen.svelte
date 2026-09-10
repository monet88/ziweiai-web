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
  import RoyalBaziDossierModal from '$lib/features/dossier/RoyalBaziDossierModal.svelte';
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
      {#if (showBoard || detail.chartSystem === 'ba-zi') && detail.snapshot}
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
          <div class="explanation-actions-row">
            <PrimaryButton
              label={explanation.hasResult ? copy.regenerateExplanation : explanationButtonLabel}
              loading={explanation.isPending}
              disabled={explanationBlocked}
              onclick={explanation.generate}
            />
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
        {:else if explanation.hasResult && explanation.renderedMarkdown}
          <div class="explanation-result-container">
            {#if explanation.isPending || explanation.isStreaming}
              <div class="streaming-hud-banner">
                <span class="pulse-dot"></span>
                <span class="streaming-hud-text">Khâm Thiên Giám đang truyền thiên cơ từng câu chữ...</span>
                <button type="button" class="streaming-abort-chip" onclick={explanation.abort}>Dừng sinh</button>
              </div>
            {/if}

            <!-- Bản Sớ Header (Chỉ xuất hiện khi in ra giấy hoặc lưu PDF) -->
            <header class="print-so-header">
              <div class="so-emblem">✦ VIOS KHÂM THIÊN GIÁM ✦</div>
              <h1 class="so-title">BẢN SỚ TỬ VI ĐẠI THÀNH LUẬN GIẢI</h1>
              <div class="so-subtitle">{pageTitle}</div>
              <div class="so-meta-grid">
                {#each summaryItems as item (item.label)}
                  <div class="so-meta-item">
                    <span class="lbl">{item.label}:</span>
                    <span class="val">{item.value}</span>
                  </div>
                {/each}
              </div>
              <div class="so-seal-row">
                <span class="so-seal-text">BẢO CHỨNG BỞI HỆ THỐNG TỬ VI TOÀN TẬP — VIOS ENGINE</span>
                <span class="so-date-text">XUẤT BẢN NGÀY: {new Date().toLocaleDateString('vi-VN')}</span>
              </div>
            </header>

            <AuspiciousSummaryCard markdown={explanation.renderedMarkdown} />
            <ExplanationToolbar
              markdown={explanation.renderedMarkdown}
              chartTitle={pageTitle}
              birthInfo={summaryItems.map((i) => `${i.label}: ${i.value}`).join(' · ')}
            />
            <article class="result surface-glass printable-content">
              <MarkdownView markdown={explanation.renderedMarkdown} />
              {#if explanation.isPending || explanation.isStreaming}
                <span class="live-streaming-cursor">▍</span>
              {/if}
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

  .explanation-actions-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: var(--space-md, 16px);
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

  .live-streaming-cursor {
    display: inline-block;
    color: #ffd700;
    font-size: 16px;
    font-weight: 700;
    margin-left: 4px;
    animation: blink-cursor 0.9s step-end infinite;
  }

  @keyframes blink-cursor {
    50% { opacity: 0; }
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

  :global([data-theme="light"]) .live-streaming-cursor {
    color: #b45309;
  }

  @media (min-width: 1080px) {
    .detail-page {
      gap: var(--space-xxl);
    }

    .section-title {
      font-size: 24px;
    }
  }

  .print-so-header {
    display: none;
  }

  /* Chế độ In Sớ / Xuất PDF (@media print) */
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

    /* Header Sớ In Trang Trọng */
    :global(body:not(.printing-deluxe-dossier)) .print-so-header {
      display: block !important;
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #b45309;
      page-break-after: avoid;
      break-after: avoid;
    }

    .so-emblem {
      font-size: 10.5pt;
      letter-spacing: 3px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 4px;
    }

    .so-title {
      font-size: 19pt;
      font-weight: 800;
      color: #78350f;
      margin: 0 0 6px 0;
      letter-spacing: 0.5px;
    }

    .so-subtitle {
      font-size: 12pt;
      font-weight: 600;
      color: #451a03;
      margin-bottom: 12px;
    }

    .so-meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px 12px;
      background: #fdfaf3;
      border: 1px solid #e7d8b8;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 8px;
      text-align: left;
      font-size: 9.5pt;
    }

    .so-meta-item .lbl {
      color: #78350f;
      font-weight: 600;
      margin-right: 4px;
    }

    .so-meta-item .val {
      color: #111827;
      font-weight: 700;
    }

    .so-seal-row {
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #6b7280;
      font-style: italic;
      padding: 0 4px;
    }

    :global(body:not(.printing-deluxe-dossier)) .result {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      color: #111827 !important;
      padding: 0 !important;
      overflow: visible !important;
      height: auto !important;
    }

    @page {
      size: A4 portrait;
      margin: 18mm 15mm 20mm 15mm;
    }
  }
</style>
