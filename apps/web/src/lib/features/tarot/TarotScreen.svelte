<script lang="ts">
  // TarotScreen (US-017h): màn rút Tarot. Người dùng nhập câu hỏi + chọn kiểu trải bài → POST
  // /draws/tarot; kết quả render lưới lá bài (ảnh thật Rider-Waite, lá ngược xoay 180deg) + diễn
  // giải Markdown do LLM sinh. Tarot CHO PHÉP khách (không chặn anon ở UI). Nhãn toàn tiếng Việt.
  import { goto } from '$app/navigation';
  import { base, resolve } from '$app/paths';
  import { untrack } from 'svelte';
  import type { TarotSpread } from '@ziweiai/contracts';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { PrimaryButton, NoticeBanner } from '$lib/components/ui';
  import MarkdownView from '$lib/features/explanation/MarkdownView.svelte';
  import TarotCardBack from './TarotCardBack.svelte';
  import { createTarotModel, type TarotCopy } from './tarot-model.svelte';

  interface Props {
    copy: TarotCopy;
  }

  let { copy }: Props = $props();

  const auth = getAuthStore();
  // copy là prop tĩnh do route truyền literal (copy={viCopy.tarot}); model tạo một lần lúc mount nên
  // dùng giá trị hiện tại là đúng — bọc untrack để Svelte 5 không cảnh báo state_referenced_locally.
  const model = untrack(() => createTarotModel({ auth, copy }));

  // copy là prop tĩnh (route truyền literal) nên nhãn không đổi sau mount → bọc untrack để Svelte 5
  // không cảnh báo state_referenced_locally.
  const spreadOptions: ReadonlyArray<{ value: TarotSpread; label: string }> = untrack(() => [
    { value: 'three-card', label: copy.spreadThreeCard },
    { value: 'celtic-cross', label: copy.spreadCelticCross },
  ]);

  function goToDashboard(): void {
    void goto(resolve('/'));
  }

  // Ảnh lá nằm trong static/tarot/<id>.jpg (id khớp deck backend: major_00..21, {suit}_{rank}).
  // Đây là asset tĩnh động (id từ server) chứ không phải route → dùng `base` (không phải `resolve`,
  // vốn chỉ nhận route literal đã biết) để ghép URL tôn trọng base path khi deploy.
  function cardImageSrc(cardId: string): string {
    return `${base}/tarot/${cardId}.jpg`;
  }
</script>

<div class="tarot-screen">
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
          <p class="result-eyebrow">{copy.resultTitle}</p>
          <ul class="card-grid">
            {#each draw.cards as card (card.position)}
              <li class="card">
                <div class="card-frame">
                  <img
                    class="card-image"
                    class:reversed={card.reversed}
                    src={cardImageSrc(card.id)}
                    alt={card.name}
                    loading="lazy"
                  />
                </div>
                <p class="card-name">{card.name}</p>
                <span class="orient" class:is-reversed={card.reversed}>
                  {card.reversed ? copy.orientationReversed : copy.orientationUpright}
                </span>
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
            <label class="field-label" for="tarot-question">{copy.questionLabel}</label>
            <textarea
              id="tarot-question"
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

          <div class="deck">
            <span class="fan fan-left" aria-hidden="true"><TarotCardBack /></span>
            <span class="fan fan-right" aria-hidden="true"><TarotCardBack /></span>
            <button
              type="button"
              class="deck-draw"
              aria-label={copy.submitButton}
              aria-busy={model.isSubmitting}
              disabled={model.isSubmitting}
              onclick={() => model.submit()}
            >
              <TarotCardBack>
                {#if model.isSubmitting}
                  <span class="spinner" aria-hidden="true"></span>
                {:else}
                  <span class="draw-cta">{copy.tapToDraw}</span>
                  <span class="draw-hint">{copy.tapToDrawHint}</span>
                {/if}
              </TarotCardBack>
            </button>
          </div>

          <p class="breathe">{copy.breatheLine}</p>
          <NoticeBanner message={copy.safetyNotice} tone="info" />
        </section>
      {/if}
    </main>
  </div>
</div>

<style>
  .tarot-screen {
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
    background: linear-gradient(
      160deg,
      var(--color-tarot-band-top) 0%,
      var(--color-tarot-band-mid) 48%,
      var(--color-tarot-band-bottom) 100%
    );
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
    background: var(--color-bg-elevated);
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

  .deck {
    position: relative;
    width: 240px;
    max-width: 70%;
    margin: var(--space-sm) auto 0;
    display: flex;
    justify-content: center;
  }

  .fan {
    position: absolute;
    top: 8px;
    width: 86%;
    opacity: 0.45;
    filter: saturate(0.8);
    pointer-events: none;
  }

  .fan-left {
    left: -16%;
    transform: rotate(-9deg);
    transform-origin: bottom center;
  }

  .fan-right {
    right: -16%;
    transform: rotate(9deg);
    transform-origin: bottom center;
  }

  .deck-draw {
    position: relative;
    z-index: 1;
    width: 100%;
    padding: 0;
    border: none;
    border-radius: var(--radius-lg);
    background: transparent;
    cursor: pointer;
    transition:
      transform 140ms ease,
      filter 140ms ease;
  }

  .deck-draw:hover:not(:disabled) {
    transform: translateY(-4px);
    filter: drop-shadow(0 8px 18px color-mix(in srgb, var(--color-text-primary) 18%, transparent));
  }

  .deck-draw:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 4px;
    border-radius: var(--radius-lg);
  }

  .deck-draw:disabled {
    opacity: 0.7;
    cursor: progress;
  }

  .draw-cta {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0;
    color: var(--color-text-primary);
  }

  .draw-hint {
    font-size: 12px;
    letter-spacing: 0.125px;
    color: var(--color-text-muted);
  }

  .spinner {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-pill);
    border: 3px solid color-mix(in srgb, var(--color-accent-primary) 30%, transparent);
    border-top-color: var(--color-accent-primary);
    animation: spin 720ms linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation-duration: 0ms;
    }
    .deck-draw:hover:not(:disabled) {
      transform: none;
    }
  }

  .breathe {
    margin: 0;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 14px;
    font-style: italic;
  }

  .card-grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: var(--space-md);
    justify-items: center;
  }

  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    text-align: center;
    width: 100%;
    max-width: 200px;
  }

  .card-frame {
    width: 100%;
    border-radius: var(--radius-md);
    padding: 4px;
    background: var(--color-tarot-glow);
    border: 1px solid var(--color-border-hairline);
  }

  .card-image {
    display: block;
    width: 100%;
    aspect-ratio: 100 / 171;
    object-fit: cover;
    border-radius: var(--radius-xs);
    background: var(--color-bg-surface);
  }

  .card-image.reversed {
    transform: rotate(180deg);
  }

  .card-name {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--color-text-primary);
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
