<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Headphones,
    Loader2,
  } from 'lucide-svelte';
  import { destinyTimelineResponseSchema, type DestinyTimelineResponse, type DestinyMonthScore } from '@ziweiai/contracts';
  import { fetchJson } from '$lib/api-client/fetch-json';
  import { audioAdvisor } from '$lib/features/audio/audio-advisor.svelte';
  import { toast } from '$lib/stores/toast';

  interface Props {
    chartId: string;
    token?: string;
  }

  let { chartId, token }: Props = $props();

  let selectedYear = $state<2026 | 2027>(2026);
  let timeline = $state<DestinyTimelineResponse | null>(null);
  let isLoading = $state(false);
  let errorMessage = $state<string | null>(null);
  let selectedMonth = $state<DestinyMonthScore | null>(null);

  async function loadTimeline(year: number) {
    isLoading = true;
    errorMessage = null;
    try {
      const data = await fetchJson(
        `/charts/${chartId}/destiny-timeline?year=${year}`,
        destinyTimelineResponseSchema,
        {
          method: 'GET',
          token,
        },
      );
      timeline = data;
      // Mặc định chọn tháng may mắn nhất hoặc tháng đầu tiên
      const initialMonth = data.months.find((m) => m.month === data.luckiestMonth) || data.months[0];
      selectedMonth = initialMonth || null;
    } catch (err: any) {
      console.error('Failed to load destiny timeline:', err);
      errorMessage = err.message || 'Không thể nạp dòng thời gian vận hạn.';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadTimeline(selectedYear);
  });

  function handleYearChange(year: 2026 | 2027) {
    if (selectedYear === year) return;
    selectedYear = year;
    loadTimeline(year);
  }

  function handleReadMonthAudio() {
    if (!selectedMonth || !timeline) return;
    const text = `Khí vận ${selectedMonth.lunarMonthName} năm ${timeline.yearGanZhi}: ` +
      `Tháng can chi ${selectedMonth.ganZhi}, nguyệt hạn an tại cung ${selectedMonth.palaceName}. ` +
      `Điểm cát khí đạt ${selectedMonth.auspiciousScore}/100 điểm. ` +
      `${selectedMonth.highlights.join('. ')}. ` +
      `Lời khuyên hành động: ${selectedMonth.advice}`;
    audioAdvisor.play(text, `Vận ${selectedMonth.lunarMonthName} • ${timeline.yearGanZhi}`);
    toast.show(`🎧 Đang phát dự báo ${selectedMonth.lunarMonthName}...`, 'success');
  }

  function getLevelBadge(level: DestinyMonthScore['level']) {
    switch (level) {
      case 'dai_cat':
        return { text: 'Đại Cát', class: 'level-dai-cat' };
      case 'cat':
        return { text: 'Cát Lành', class: 'level-cat' };
      case 'binh_hoa':
        return { text: 'Bình Hòa', class: 'level-binh-hoa' };
      case 'tieu_hung':
        return { text: 'Tiểu Hung', class: 'level-tieu-hung' };
      case 'dai_hung':
        return { text: 'Đại Hung', class: 'level-dai-hung' };
    }
  }
</script>

<section class="destiny-timeline-card surface-glass" aria-labelledby="timeline-title">
  <!-- Header Section -->
  <header class="card-header">
    <div class="header-left">
      <div class="badge-gem">✦</div>
      <div>
        <h3 id="timeline-title" class="title-text">
          Dòng Thời Gian Vận Hạn 12 Tháng
        </h3>
        <p class="subtitle-text">
          Khảo sát tiết tấu Cát - Hung chi tiết theo từng lưu nguyệt
        </p>
      </div>
    </div>

    <!-- Year Toggle Pill -->
    <div class="year-toggle-group" role="group" aria-label="Chọn năm xem vận hạn">
      <button
        type="button"
        class="year-btn"
        class:active={selectedYear === 2026}
        onclick={() => handleYearChange(2026)}
      >
        <span>2026 Bính Ngọ</span>
      </button>
      <button
        type="button"
        class="year-btn"
        class:active={selectedYear === 2027}
        onclick={() => handleYearChange(2027)}
      >
        <span>2027 Đinh Mùi</span>
      </button>
    </div>
  </header>

  <!-- Body Content -->
  {#if isLoading}
    <div class="loading-state">
      <Loader2 size={30} class="spinner text-gold" />
      <p>Hội đồng Chiêm Tinh đang tính toán 12 lưu nguyệt năm {selectedYear}...</p>
    </div>
  {:else if errorMessage}
    <div class="error-state">
      <p>{errorMessage}</p>
      <button type="button" class="btn-retry" onclick={() => loadTimeline(selectedYear)}>
        Thử lại
      </button>
    </div>
  {:else if timeline}
    <!-- Annual Highlights Bar -->
    <div class="annual-summary-grid">
      <div class="summary-pill lucky">
        <div class="pill-icon">🌟</div>
        <div class="pill-content">
          <span class="pill-label">Tháng Đại Cát Nhất</span>
          <strong class="pill-value">Tháng {timeline.luckiestMonth} ÂL</strong>
        </div>
      </div>

      <div class="summary-pill cautious">
        <div class="pill-icon">🛡️</div>
        <div class="pill-content">
          <span class="pill-label">Tháng Cần Cẩn Trọng</span>
          <strong class="pill-value">Tháng {timeline.cautiousMonth} ÂL</strong>
        </div>
      </div>

      <div class="summary-pill average">
        <div class="pill-icon">📊</div>
        <div class="pill-content">
          <span class="pill-label">Điểm Vận Bình Quân</span>
          <strong class="pill-value">{timeline.averageScore}/100</strong>
        </div>
      </div>
    </div>

    <p class="annual-overview-text">
      "{timeline.annualOverview}"
    </p>

    <!-- 12-Month Interactive Bar Chart -->
    <div class="chart-container">
      <div class="chart-bars-track">
        {#each timeline.months as m (m.month)}
          {@const isSelected = selectedMonth?.month === m.month}
          <button
            type="button"
            class="bar-column"
            class:selected={isSelected}
            onclick={() => (selectedMonth = m)}
            aria-label="Tháng {m.month} - {m.lunarMonthName} ({m.auspiciousScore} điểm)"
          >
            <!-- Score Tooltip / Pill -->
            <span class="score-pill {m.level}">
              {m.auspiciousScore}
            </span>

            <!-- Vertical Bar with Dynamic Height -->
            <div class="bar-tube">
              <div
                class="bar-fill {m.level}"
                style="height: {Math.max(22, m.auspiciousScore)}%"
              ></div>
            </div>

            <!-- Month Label & Gan Zhi -->
            <div class="month-info">
              <span class="month-num">T{m.month}</span>
              <span class="gan-zhi-tag">{m.ganZhi.split(' ')[1] || m.ganZhi}</span>
            </div>
          </button>
        {/each}
      </div>
    </div>

    <!-- Selected Month Detailed Inspection Card -->
    {#if selectedMonth}
      {@const levelBadge = getLevelBadge(selectedMonth.level)}
      <div class="month-detail-panel">
        <div class="detail-head">
          <div class="detail-title-group">
            <span class="lunar-badge">{selectedMonth.lunarMonthName} ({selectedMonth.solarMonth})</span>
            <h4 class="detail-title">
              Can Chi: {selectedMonth.ganZhi} • Cung Nguyệt Hạn: <span class="text-gold">{selectedMonth.palaceName}</span>
            </h4>
          </div>

          <div class="detail-head-actions">
            <span class="badge-level {levelBadge.class}">{levelBadge.text} • {selectedMonth.auspiciousScore}đ</span>
            <button
              type="button"
              class="btn-audio-month"
              onclick={handleReadMonthAudio}
              title="Lắng nghe lời khuyên vận tháng bằng giọng đọc AI"
            >
              <Headphones size={14} />
              <span>Nghe Vận Tháng</span>
            </button>
          </div>
        </div>

        <!-- Highlights & Mutagens -->
        <div class="highlights-row">
          {#each selectedMonth.highlights as h (h)}
            <span class="tag-highlight">✦ {h}</span>
          {/each}
        </div>

        <!-- Actionable Advice -->
        <div class="advice-box">
          <p class="advice-text">
            <strong>Phương Hướng Hành Động: </strong>
            {selectedMonth.advice}
          </p>
        </div>
      </div>
    {/if}
  {/if}
</section>

<style>
  .destiny-timeline-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 18px;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    margin-top: 16px;
    margin-bottom: 16px;
    width: 100%;
    box-sizing: border-box;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .badge-gem {
    color: #fbbf24;
    font-size: 20px;
  }

  .title-text {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
    color: #fef08a;
  }

  .subtitle-text {
    margin: 2px 0 0 0;
    font-size: 12.5px;
    color: #9ca3af;
  }

  /* Year Toggle Group */
  .year-toggle-group {
    display: flex;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 10px;
    padding: 3px;
    gap: 4px;
  }

  .year-btn {
    padding: 6px 14px;
    font-size: 12.5px;
    font-weight: 600;
    color: #d1d5db;
    background: transparent;
    border: none;
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .year-btn:hover {
    color: #fef08a;
  }

  .year-btn.active {
    background: linear-gradient(135deg, #d4af37 0%, #aa8010 100%);
    color: #0d0f18;
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.35);
  }

  /* Loading and Error States */
  .loading-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 36px 16px;
    gap: 12px;
    color: #9ca3af;
    font-size: 13.5px;
    text-align: center;
  }

  .text-gold {
    color: #fbbf24;
  }

  .btn-retry {
    padding: 6px 16px;
    border-radius: 8px;
    background: rgba(212, 175, 55, 0.2);
    border: 1px solid #d4af37;
    color: #fef08a;
    cursor: pointer;
  }

  /* Annual Summary Grid */
  .annual-summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
  }

  .summary-pill {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .summary-pill.lucky {
    border-color: rgba(212, 175, 55, 0.4);
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(15, 23, 42, 0.6) 100%);
  }

  .summary-pill.cautious {
    border-color: rgba(239, 68, 68, 0.35);
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%);
  }

  .pill-icon {
    font-size: 18px;
  }

  .pill-content {
    display: flex;
    flex-direction: column;
  }

  .pill-label {
    font-size: 11px;
    color: #9ca3af;
  }

  .pill-value {
    font-size: 14px;
    color: #f3f4f6;
  }

  .annual-overview-text {
    margin: 0;
    font-size: 13px;
    color: #d1d5db;
    line-height: 1.5;
    font-style: italic;
    border-left: 2px solid rgba(212, 175, 55, 0.6);
    padding-left: 12px;
  }

  /* 12-Month Interactive Chart */
  .chart-container {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 6px;
  }

  .chart-bars-track {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    min-width: 580px;
    height: 160px;
    padding: 24px 8px 8px 8px;
    box-sizing: border-box;
    background: rgba(0, 0, 0, 0.25);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .bar-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    height: 100%;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    position: relative;
    transition: transform 0.15s ease;
  }

  .bar-column:hover {
    transform: translateY(-2px);
  }

  .bar-column.selected .bar-tube {
    box-shadow: 0 0 14px rgba(255, 215, 0, 0.5);
    border-color: #ffd700;
  }

  .score-pill {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 4px;
    margin-bottom: 4px;
  }

  .score-pill.dai_cat, .score-pill.cat { color: #fef08a; }
  .score-pill.binh_hoa { color: #c7d2fe; }
  .score-pill.tieu_hung, .score-pill.dai_hung { color: #fca5a5; }

  .bar-tube {
    width: 100%;
    max-width: 28px;
    height: 80px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    align-items: flex-end;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: border-color 0.2s ease;
  }

  .bar-fill {
    width: 100%;
    border-radius: 4px;
    transition: height 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .bar-fill.dai_cat {
    background: linear-gradient(to top, #b45309, #f59e0b, #fef08a);
  }

  .bar-fill.cat {
    background: linear-gradient(to top, #047857, #10b981, #6ee7b7);
  }

  .bar-fill.binh_hoa {
    background: linear-gradient(to top, #3730a3, #6366f1, #a5b4fc);
  }

  .bar-fill.tieu_hung, .bar-fill.dai_hung {
    background: linear-gradient(to top, #881337, #e11d48, #fda4af);
  }

  .month-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 6px;
  }

  .month-num {
    font-size: 11px;
    font-weight: 700;
    color: #e5e7eb;
  }

  .gan-zhi-tag {
    font-size: 9px;
    color: #9ca3af;
  }

  /* Month Detail Panel */
  .month-detail-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%);
    border: 1px solid rgba(212, 175, 55, 0.35);
  }

  .detail-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }

  .lunar-badge {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: #fbbf24;
    letter-spacing: 0.5px;
  }

  .detail-title {
    margin: 2px 0 0 0;
    font-size: 14.5px;
    font-weight: 700;
    color: #f3f4f6;
  }

  .detail-head-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .badge-level {
    font-size: 11.5px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
  }

  .badge-level.level-dai-cat, .badge-level.level-cat {
    background: rgba(46, 204, 113, 0.2);
    border: 1px solid #2ecc71;
    color: #2ecc71;
  }

  .badge-level.level-binh-hoa {
    background: rgba(99, 102, 241, 0.2);
    border: 1px solid #818cf8;
    color: #c7d2fe;
  }

  .badge-level.level-tieu-hung, .badge-level.level-dai-hung {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid #ef4444;
    color: #fca5a5;
  }

  .btn-audio-month {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: 8px;
    background: rgba(147, 51, 234, 0.25);
    border: 1px solid rgba(168, 85, 247, 0.5);
    color: #e9d5ff;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-audio-month:hover {
    background: rgba(147, 51, 234, 0.4);
    box-shadow: 0 0 10px rgba(168, 85, 247, 0.4);
  }

  .highlights-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tag-highlight {
    font-size: 11.5px;
    color: #e0e7ff;
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 8px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .advice-box {
    background: rgba(0, 0, 0, 0.3);
    padding: 10px 14px;
    border-radius: 8px;
    border-left: 3px solid #ffd700;
  }

  .advice-text {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: #e5e7eb;
  }

  /* Dual-Theme: Light Mode */
  :global([data-theme="light"]) .destiny-timeline-card {
    background: #ffffff;
    border-color: rgba(180, 83, 9, 0.25);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  }

  :global([data-theme="light"]) .title-text { color: #78350f; }
  :global([data-theme="light"]) .subtitle-text { color: #6b7280; }
  :global([data-theme="light"]) .year-toggle-group { background: #f3f4f6; border-color: #d1d5db; }
  :global([data-theme="light"]) .year-btn { color: #4b5563; }
  :global([data-theme="light"]) .year-btn.active {
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    color: #ffffff;
  }
  :global([data-theme="light"]) .annual-overview-text { color: #374151; }
  :global([data-theme="light"]) .summary-pill { background: #f9fafb; border-color: #e5e7eb; }
  :global([data-theme="light"]) .pill-value { color: #111827; }
  :global([data-theme="light"]) .chart-bars-track { background: #f9fafb; border-color: #e5e7eb; }
  :global([data-theme="light"]) .bar-tube { background: #f3f4f6; border-color: #e5e7eb; }
  :global([data-theme="light"]) .month-num { color: #1f2937; }
  :global([data-theme="light"]) .month-detail-panel {
    background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
    border-color: rgba(180, 83, 9, 0.3);
  }
  :global([data-theme="light"]) .detail-title { color: #111827; }
  :global([data-theme="light"]) .advice-box { background: #ffffff; }
  :global([data-theme="light"]) .advice-text { color: #374151; }
</style>
