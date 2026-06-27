<script lang="ts">
  // LenormandScreen (US-037): màn rút bài Lenormand. Người dùng nhập câu hỏi + chọn bố cục →
  // POST /draws/lenormand; kết quả render danh sách lá (tên + từ khóa + nghĩa nền, theo vị trí
  // bố cục) + bài đọc Markdown do LLM sinh. Lenormand CHO PHÉP khách (không chặn anon ở UI).
  // Khác Tarot: KHÔNG có asset ảnh lá → hiển thị lá dạng thẻ chữ. Nhãn toàn tiếng Việt.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { untrack } from 'svelte';
  import type { LenormandSpread } from '@ziweiai/contracts';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { PrimaryButton, NoticeBanner } from '$lib/components/ui';
  import MarkdownView from '$lib/features/explanation/MarkdownView.svelte';
  import { createLenormandModel, type LenormandCopy } from './lenormand-model.svelte';

  interface Props {
    copy: LenormandCopy;
  }

  let { copy }: Props = $props();

  const auth = getAuthStore();
  const model = untrack(() => createLenormandModel({ auth, copy }));

  const spreadOptions: ReadonlyArray<{ value: LenormandSpread; label: string }> = untrack(() => [
    { value: 'single', label: copy.spreadSingle },
    { value: 'three', label: copy.spreadThree },
    { value: 'relationship', label: copy.spreadRelationship },
    { value: 'decision', label: copy.spreadDecision },
    { value: 'nine', label: copy.spreadNine },
  ]);

  function goToDashboard(): void {
    void goto(resolve('/'));
  }
</script>

<div class="lenormand-screen">
  <div class="shell">
    <header class="band">
      <button
        type="button"
        class="band-back"
        aria-label={copy.returnToDashboard}
        onclick={goToDashboard}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M14 6l-6 6 6 6"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <p class="band-eyebrow">{copy.heroEyebrow}</p>
      <h1 class="band-title">{copy.heroTitle}</h1>
      <p class="band-sub">{copy.heroSubtitle}</p>
    </header>

    <main class="content">
      {#if model.result}
        {@const draw = model.result}
        <section class="result" aria-live="polite">
          <p class="result-eyebrow">{copy.resultTitle} · {draw.spreadName}</p>
          <ul class="card-list">
            {#each draw.cards as card (card.position)}
              <li class="card">
                <p class="card-position">{card.positionLabel}</p>
                <p class="card-name">
                  {card.name}
                  <span class="orient" class:is-reversed={card.reversed}>
                    {card.reversed ? copy.orientationReversed : copy.orientationUpright}
                  </span>
                </p>
                <p class="card-keywords">{card.keywords.join(' · ')}</p>
                <p class="card-meaning">{card.meaning}</p>
              </li>
            {/each}
          </ul>

          <div class="reading">
            <p class="reading-title">{copy.readingTitle}</p>
            <MarkdownView markdown={draw.narrative} />
          </div>

          <NoticeBanner message={copy.safetyNotice} tone="info" />
          <PrimaryButton label={copy.retakeButton} variant="surface" onclick={() => model.reset()} />
        </section>
      {:else}
        <section class="form">
          <div class="field">
            <label class="field-label" for="lenormand-question">{copy.questionLabel}</label>
            <textarea
              id="lenormand-question"
              class="question-input"
              rows="3"
              placeholder={copy.questionPlaceholder}
              value={model.question}
              disabled={model.isSubmitting}
              oninput={(event) =>
                model.setQuestion((event.currentTarget as HTMLTextAreaElement).value)}
            ></textarea>
          </div>

          <div class="field">
            <span class="field-label">{copy.spreadLabel}</span>
            <div class="spread-options" role="radiogroup" aria-label={copy.spreadLabel}>
              {#each spreadOptions as option (option.value)}
                <button
                  type="button"
                  class="spread-option"
                  class:selected={model.spread === option.value}
                  role="radio"
                  aria-checked={model.spread === option.value}
                  tabindex={model.spread === option.value ? 0 : -1}
                  value={option.value}
                  disabled={model.isSubmitting}
                  onclick={() => model.setSpread(option.value)}
                >
                  {option.label}
                </button>
              {/each}
            </div>
          </div>

          {#if model.validationMessage}
            <NoticeBanner message={model.validationMessage} tone="danger" />
          {/if}
          {#if model.isError && model.errorMessage}
            <NoticeBanner message={model.errorMessage} tone="danger" />
          {/if}

          <PrimaryButton
            label={copy.submitButton}
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
  .lenormand-screen {
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
  }

  .field-label {
    font-size: 15px;
    font-weight: 600;
  }

  .question-input {
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    font-size: 15px;
    font-family: inherit;
    resize: vertical;
  }

  .question-input:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 1px;
  }

  .spread-options {
    display: flex;
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  .spread-option {
    flex: 1 1 0;
    min-width: 140px;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    font-size: 14px;
    cursor: pointer;
  }

  .spread-option:hover {
    border-color: var(--color-accent-primary);
  }

  .spread-option.selected {
    border-color: var(--color-accent-primary);
    background: var(--color-accent-primary-soft);
    color: var(--color-text-primary);
    font-weight: 600;
  }

  .spread-option:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 1px;
  }

  .card-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .card {
    padding: var(--space-md);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-hairline);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .card-position {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-muted);
    letter-spacing: 0.125px;
  }

  .card-name {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .orient {
    display: inline-block;
    padding: 2px 10px;
    border-radius: var(--radius-pill);
    border: 1px solid var(--color-accent-purple-deep);
    color: var(--color-accent-purple-deep);
    font-size: 11px;
    font-weight: 600;
  }

  .orient.is-reversed {
    border-color: var(--color-accent-danger);
    color: var(--color-accent-danger);
  }

  .card-keywords {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-accent-purple-deep);
  }

  .card-meaning {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: var(--color-text-secondary);
  }

  .result-eyebrow {
    margin: 0;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.125px;
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
