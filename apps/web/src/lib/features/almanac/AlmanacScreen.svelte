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
    min-height: 100dvh;
    overflow-x: hidden;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  .shell {
    box-sizing: border-box;
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 0 var(--space-lg) var(--space-xxl);
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .band {
    position: relative;
    margin-top: var(--space-lg);
    padding: var(--space-xl) var(--space-lg) var(--space-lg);
    border-radius: var(--radius-lg);
    text-align: center;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-hairline);
  }

  .band-back {
    position: absolute;
    top: var(--space-md);
    left: var(--space-md);
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .band-back svg {
    width: 22px;
    height: 22px;
  }

  .band-back:hover {
    background: var(--color-bg-surface);
  }

  .band-back:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }

  .band-eyebrow {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.125px;
  }

  .band-title {
    margin: 6px 0 0;
    font-size: 26px;
    font-weight: 700;
    line-height: 1.23;
    letter-spacing: -0.625px;
    color: var(--color-text-primary);
  }

  .band-sub {
    margin: var(--space-sm) auto 0;
    max-width: 460px;
    color: var(--color-text-muted);
    font-size: 14px;
    line-height: 1.55;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .form,
  .result {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    flex: 1;
  }

  .field-label {
    font-size: 15px;
    font-weight: 600;
  }

  .topic-select,
  .date-input {
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    font-size: 15px;
    font-family: inherit;
  }

  .topic-select:focus-visible,
  .date-input:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 1px;
  }

  .date-row {
    display: flex;
    gap: var(--space-md);
  }

  .result-eyebrow {
    margin: 0;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.125px;
  }

  .day-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .day-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-lg);
    border-radius: var(--radius-lg);
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-hairline);
  }

  .day-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-sm);
  }

  .day-date {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .day-weekday {
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .day-score {
    margin-left: auto;
    padding: 2px 10px;
    border-radius: var(--radius-pill);
    border: 1px solid var(--color-accent-primary);
    color: var(--color-accent-primary);
    font-size: 12px;
    font-weight: 600;
  }

  .day-grid {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(140px, 100%), 1fr));
    gap: 4px var(--space-md);
  }

  .day-grid div {
    display: flex;
    gap: 4px;
    font-size: 13px;
    line-height: 1.5;
  }

  .day-grid dt {
    margin: 0;
    color: var(--color-text-muted);
    font-weight: 600;
  }

  .day-grid dd {
    margin: 0;
    color: var(--color-text-primary);
  }

  .day-line {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
  }

  .line-name {
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .day-line.highlight {
    color: var(--color-accent-primary);
  }

  .day-line.caution {
    color: var(--color-text-primary);
  }

  .reading {
    padding: var(--space-lg);
    border-radius: var(--radius-lg);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-hairline);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .reading-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
</style>
