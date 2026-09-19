<script lang="ts">
  // AlmanacScreen (US-040 / backlog #48): màn Hoàng lịch chọn ngày tốt. Người dùng chọn việc cần
  // làm + khoảng ngày → POST /almanac/select; kết quả render danh sách ngày đã chấm điểm (can chi +
  // trực + sao + nghi/kỵ + thần sát + Bành Tổ + xung/sát) + bài luận Markdown do LLM sinh. Hoàng lịch
  // CHO PHÉP khách (không chặn anon ở UI). Nhãn toàn tiếng Việt.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { untrack } from 'svelte';
  import type { AlmanacTopic } from '@ziweiai/contracts';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { PrimaryButton, NoticeBanner } from '$lib/components/ui';
  import MarkdownView from '$lib/features/explanation/MarkdownView.svelte';
  import { createAlmanacModel, type AlmanacCopy } from './almanac-model.svelte';

  interface Props {
    copy: AlmanacCopy;
  }

  let { copy }: Props = $props();

  const auth = getAuthStore();
  const model = untrack(() => createAlmanacModel({ auth, copy }));

  // Danh sách việc cần chọn ngày (value khớp AlmanacTopic ở contract). Tĩnh nên bọc untrack.
  const topicOptions: ReadonlyArray<{ value: AlmanacTopic; label: string }> = untrack(() => [
    { value: 'marriage', label: copy.topicMarriage },
    { value: 'move', label: copy.topicMove },
    { value: 'opening', label: copy.topicOpening },
    { value: 'contract', label: copy.topicContract },
    { value: 'travel', label: copy.topicTravel },
    { value: 'medical', label: copy.topicMedical },
    { value: 'study', label: copy.topicStudy },
    { value: 'custom', label: copy.topicCustom },
  ]);

  function goToDashboard(): void {
    void goto(resolve('/'));
  }
</script>

<div class="almanac-screen">
  <div class="shell">
    <header class="band">
      <button type="button" class="band-back" aria-label={copy.returnToDashboard} onclick={goToDashboard}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M14 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <p class="band-eyebrow">{copy.heroEyebrow}</p>
      <h1 class="band-title">{copy.heroTitle}</h1>
      <p class="band-sub">{copy.heroSubtitle}</p>
    </header>

    <main class="content">
      {#if model.result}
        {@const selection = model.result}
        <section class="result" aria-live="polite">
          <p class="result-eyebrow">{copy.resultTitle}</p>

          <ul class="day-list">
            {#each selection.days as day (day.date)}
              <li class="day-card">
                <div class="day-head">
                  <span class="day-date">{day.date}</span>
                  <span class="day-weekday">{day.weekday}</span>
                  <span class="day-score">{copy.scoreLabel}: {day.score}/100</span>
                </div>
                <dl class="day-grid">
                  <div><dt>{copy.lunarLabel}</dt><dd>{day.lunarDate}</dd></div>
                  <div><dt>{copy.ganzhiLabel}</dt><dd>{day.ganzhi.day}</dd></div>
                  <div><dt>{copy.dayOfficerLabel}</dt><dd>{day.dayOfficer}</dd></div>
                  <div><dt>{copy.twelveStarLabel}</dt><dd>{day.twelveStar}</dd></div>
                  <div><dt>{copy.twentyEightStarLabel}</dt><dd>{day.twentyEightStar}</dd></div>
                  <div><dt>{copy.nineStarLabel}</dt><dd>{day.nineStar}</dd></div>
                  <div><dt>{copy.clashLabel}</dt><dd>{day.clash}</dd></div>
                </dl>
                <p class="day-line"><span class="line-name">{copy.recommendsLabel}:</span> {day.recommends.length > 0 ? day.recommends.join(', ') : copy.noData}</p>
                <p class="day-line"><span class="line-name">{copy.avoidsLabel}:</span> {day.avoids.length > 0 ? day.avoids.join(', ') : copy.noData}</p>
                <p class="day-line"><span class="line-name">{copy.godsLabel}:</span> {day.gods.length > 0 ? day.gods.join(', ') : copy.noData}</p>
                <p class="day-line"><span class="line-name">{copy.pengZuLabel}:</span> {day.pengZu}</p>
                {#if day.highlights.length > 0}
                  <p class="day-line highlight"><span class="line-name">{copy.highlightsLabel}:</span> {day.highlights.join('; ')}</p>
                {/if}
                {#if day.cautions.length > 0}
                  <p class="day-line caution"><span class="line-name">{copy.cautionsLabel}:</span> {day.cautions.join('; ')}</p>
                {/if}
              </li>
            {/each}
          </ul>

          <div class="reading">
            <p class="reading-title">{copy.readingTitle}</p>
            <MarkdownView markdown={selection.narrative} />
          </div>

          <NoticeBanner message={copy.safetyNotice} tone="info" />
          <PrimaryButton label={copy.retakeButton} variant="surface" onclick={() => model.reset()} />
        </section>
      {:else}
        <section class="form">
          <div class="field">
            <label class="field-label" for="almanac-topic">{copy.topicLabel}</label>
            <select
              id="almanac-topic"
              class="topic-select"
              value={model.topic}
              disabled={model.isSubmitting}
              onchange={(event) => model.setTopic((event.currentTarget as HTMLSelectElement).value as AlmanacTopic)}
            >
              {#each topicOptions as option (option.value)}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>

          <div class="date-row">
            <div class="field">
              <label class="field-label" for="almanac-start">{copy.startDateLabel}</label>
              <input
                id="almanac-start"
                type="date"
                class="date-input"
                value={model.startDate}
                disabled={model.isSubmitting}
                oninput={(event) => model.setStartDate((event.currentTarget as HTMLInputElement).value)}
              />
            </div>
            <div class="field">
              <label class="field-label" for="almanac-end">{copy.endDateLabel}</label>
              <input
                id="almanac-end"
                type="date"
                class="date-input"
                value={model.endDate}
                disabled={model.isSubmitting}
                oninput={(event) => model.setEndDate((event.currentTarget as HTMLInputElement).value)}
              />
            </div>
          </div>

          {#if model.validationMessage}
            <NoticeBanner message={model.validationMessage} tone="danger" />
          {/if}
          {#if model.isError && model.errorMessage}
            <NoticeBanner message={model.errorMessage} tone="danger" />
          {/if}

          <PrimaryButton
            label={model.isSubmitting ? copy.loadingLabel : copy.submitButton}
            loading={model.isSubmitting}
            onclick={() => model.submit()}
          />
          <NoticeBanner message={copy.safetyNotice} tone="info" />
        </section>
      {/if}
    </main>
  </div>
</div>

<style>
  .almanac-screen {
    min-height: 100vh;
    box-sizing: border-box;
    overflow-x: hidden;
    background-color: #090615;
    background-image: 
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(120, 50, 255, 0.22), transparent 70%),
      radial-gradient(circle at 15% 30%, rgba(212, 175, 55, 0.12), transparent 45%),
      radial-gradient(circle at 85% 70%, rgba(147, 51, 234, 0.15), transparent 50%);
    background-attachment: fixed;
    color: #f7eed8;
    padding-bottom: 60px;
  }

  .shell {
    box-sizing: border-box;
    width: 100%;
    max-width: 760px;
    margin: 0 auto;
    padding: 24px 20px 60px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .band {
    position: relative;
    padding: 36px 24px 28px;
    border-radius: 24px;
    text-align: center;
    background: rgba(18, 12, 38, 0.7);
    border: 1px solid rgba(212, 175, 55, 0.3);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(212, 175, 55, 0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .band-back {
    position: absolute;
    top: 18px;
    left: 18px;
    width: 38px;
    height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(212, 175, 55, 0.12);
    border: 1px solid rgba(212, 175, 55, 0.35);
    color: #ffd700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .band-back svg {
    width: 20px;
    height: 20px;
  }

  .band-back:hover {
    background: rgba(212, 175, 55, 0.25);
    border-color: #ffd700;
    box-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
    transform: scale(1.05);
  }

  .band-back:focus-visible {
    outline: 2px solid #ffd700;
    outline-offset: 2px;
  }

  .band-eyebrow {
    margin: 0;
    display: inline-block;
    color: #ffd700;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 3px 12px;
    border-radius: 999px;
    background: rgba(212, 175, 55, 0.12);
    border: 1px solid rgba(212, 175, 55, 0.3);
    margin-bottom: 8px;
  }

  .band-title {
    margin: 8px 0 0;
    font-family: 'Cinzel', 'Noto Serif', serif;
    font-size: 30px;
    font-weight: 800;
    line-height: 1.25;
    letter-spacing: 0.02em;
    background: linear-gradient(135deg, #ffffff 0%, #fce99f 40%, #d4af37 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 2px 10px rgba(212, 175, 55, 0.25));
  }

  .band-sub {
    margin: 12px auto 0;
    max-width: 520px;
    color: #dfd4b8;
    font-size: 14px;
    line-height: 1.6;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .form,
  .result {
    display: flex;
    flex-direction: column;
    gap: 24px;
    background: rgba(18, 12, 38, 0.75);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 24px;
    padding: 32px 28px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(212, 175, 55, 0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
  }

  .field-label {
    font-size: 14px;
    font-weight: 700;
    color: #fce99f;
    letter-spacing: 0.02em;
  }

  .topic-select,
  .date-input {
    border: 1.5px solid rgba(212, 175, 55, 0.25);
    border-radius: 16px;
    padding: 14px 18px;
    background: rgba(10, 7, 22, 0.6);
    color: #ffffff;
    font-size: 15px;
    font-family: inherit;
    transition: all 0.2s ease;
  }

  .topic-select:focus,
  .date-input:focus {
    outline: none;
    border-color: #ffd700;
    box-shadow: 0 0 18px rgba(212, 175, 55, 0.25);
    background: rgba(15, 10, 30, 0.8);
  }

  .date-row {
    display: flex;
    gap: 16px;
  }

  .result-eyebrow {
    margin: 0;
    text-align: center;
    color: #ffd700;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .day-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .day-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 22px;
    border-radius: 20px;
    background: rgba(10, 7, 22, 0.7);
    border: 1px solid rgba(212, 175, 55, 0.25);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }

  .day-card:hover {
    border-color: rgba(212, 175, 55, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(212, 175, 55, 0.15);
  }

  .day-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.15);
  }

  .day-date {
    font-family: 'Cinzel', 'Noto Serif', serif;
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
  }

  .day-weekday {
    font-size: 13px;
    color: #e6ca65;
    font-weight: 600;
  }

  .day-score {
    margin-left: auto;
    padding: 3px 12px;
    border-radius: 999px;
    border: 1px solid rgba(212, 175, 55, 0.4);
    background: rgba(212, 175, 55, 0.15);
    color: #ffd700;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 0 12px rgba(212, 175, 55, 0.2);
  }

  .day-grid {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 8px 16px;
    background: rgba(18, 12, 38, 0.5);
    padding: 14px;
    border-radius: 14px;
  }

  .day-grid div {
    display: flex;
    gap: 6px;
    font-size: 13px;
    line-height: 1.5;
  }

  .day-grid dt {
    margin: 0;
    color: #dfd4b8;
    font-weight: 600;
  }

  .day-grid dd {
    margin: 0;
    color: #ffd700;
    font-weight: 600;
  }

  .day-line {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: #dfd4b8;
  }

  .line-name {
    font-weight: 700;
    color: #fce99f;
  }

  .day-line.highlight {
    color: #ffd700;
    font-weight: 600;
  }

  .day-line.caution {
    color: #f87171;
  }

  .reading {
    padding: 24px;
    border-radius: 20px;
    background: rgba(10, 7, 22, 0.6);
    border: 1px solid rgba(212, 175, 55, 0.2);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .reading-title {
    margin: 0;
    font-family: 'Cinzel', 'Noto Serif', serif;
    font-size: 20px;
    font-weight: 700;
    color: #fce99f;
  }

  @media (max-width: 640px) {
    .shell {
      padding: 16px 14px 40px;
    }

    .band {
      padding: 30px 16px 20px;
    }

    .band-title {
      font-size: 24px;
    }

    .date-row {
      flex-direction: column;
      gap: 12px;
    }

    .form,
    .result {
      padding: 20px 16px;
      border-radius: 18px;
    }

    .day-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Đồng bộ Theme Light Hoàng Gia */
  :global([data-theme="light"]) .almanac-screen {
    background:
      radial-gradient(ellipse 75% 50% at 15% 0%, rgba(212, 175, 55, 0.1), transparent 60%),
      radial-gradient(ellipse 60% 45% at 85% 10%, rgba(168, 85, 247, 0.08), transparent 55%),
      linear-gradient(180deg, #faf8f5 0%, #f4f0e6 100%);
    color: #1a162b;
  }

  :global([data-theme="light"]) .band {
    background: rgba(255, 255, 255, 0.88);
    border-color: rgba(212, 175, 55, 0.45);
    box-shadow: 0 16px 40px rgba(212, 175, 55, 0.12);
  }

  :global([data-theme="light"]) .band-back {
    background: rgba(255, 255, 255, 0.85);
    border-color: rgba(212, 175, 55, 0.4);
    color: #78350f;
  }

  :global([data-theme="light"]) .band-back:hover {
    background: rgba(255, 255, 255, 0.95);
    border-color: #b45309;
    color: #451a03;
  }

  :global([data-theme="light"]) .band-eyebrow {
    background: rgba(212, 175, 55, 0.18);
    border-color: rgba(212, 175, 55, 0.5);
    color: #854d0e;
  }

  :global([data-theme="light"]) .band-title {
    background: linear-gradient(135deg, #180d38 0%, #78350f 60%, #b45309 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  :global([data-theme="light"]) .band-sub {
    color: #57534e;
  }

  :global([data-theme="light"]) .form,
  :global([data-theme="light"]) .result {
    background: rgba(255, 255, 255, 0.88);
    border-color: rgba(212, 175, 55, 0.45);
    box-shadow: 0 16px 40px rgba(212, 175, 55, 0.12);
  }

  :global([data-theme="light"]) .field-label {
    color: #78350f;
  }

  :global([data-theme="light"]) .topic-select,
  :global([data-theme="light"]) .date-input {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(212, 175, 55, 0.35);
    color: #1c1917;
  }

  :global([data-theme="light"]) .day-card {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(212, 175, 55, 0.3);
  }

  :global([data-theme="light"]) .day-head {
    border-bottom-color: rgba(212, 175, 55, 0.2);
  }

  :global([data-theme="light"]) .day-date {
    color: #180d38;
  }

  :global([data-theme="light"]) .day-weekday {
    color: #854d0e;
  }

  :global([data-theme="light"]) .day-score {
    background: rgba(212, 175, 55, 0.18);
    color: #854d0e;
    border-color: rgba(212, 175, 55, 0.4);
  }

  :global([data-theme="light"]) .day-grid {
    background: rgba(248, 246, 240, 0.85);
  }

  :global([data-theme="light"]) .day-grid dt {
    color: #57534e;
  }

  :global([data-theme="light"]) .day-grid dd {
    color: #854d0e;
  }

  :global([data-theme="light"]) .day-line {
    color: #292524;
  }

  :global([data-theme="light"]) .line-name {
    color: #78350f;
  }

  :global([data-theme="light"]) .reading {
    background: rgba(248, 246, 240, 0.85);
    border-color: rgba(212, 175, 55, 0.25);
  }

  :global([data-theme="light"]) .reading-title {
    color: #78350f;
  }
</style>
