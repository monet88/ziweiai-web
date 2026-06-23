<script lang="ts">
  // TarotScreen (US-017h): màn rút Tarot. Người dùng nhập câu hỏi + chọn kiểu trải bài → POST
  // /draws/tarot; kết quả render lưới lá bài (ảnh thật Rider-Waite, lá ngược xoay 180deg) + diễn
  // giải Markdown do LLM sinh. Tarot CHO PHÉP khách (không chặn anon ở UI). Nhãn toàn tiếng Việt.
  import { goto } from '$app/navigation';
  import { base, resolve } from '$app/paths';
  import { untrack } from 'svelte';
  import type { TarotSpread } from '@ziweiai/contracts';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { AppScaffold, PrimaryButton, NoticeBanner } from '$lib/components/ui';
  import MarkdownView from '$lib/features/explanation/MarkdownView.svelte';
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

<AppScaffold eyebrow={copy.heroEyebrow} title={copy.heroTitle} subtitle={copy.heroSubtitle}>
  {#snippet action()}
    <PrimaryButton label={copy.returnToDashboard} variant="surface" onclick={goToDashboard} />
  {/snippet}

  {#if model.result}
    {@const draw = model.result}
    <section class="result" aria-live="polite">
      <p class="result-eyebrow">{copy.resultTitle}</p>
      <ul class="card-grid">
        {#each draw.cards as card (card.position)}
          <li class="card">
            <img
              class="card-image"
              class:reversed={card.reversed}
              src={cardImageSrc(card.id)}
              alt={card.name}
              loading="lazy"
            />
            <p class="card-name">{card.name}</p>
            {#if card.reversed}
              <p class="card-orientation">{copy.reversedLabel}</p>
            {/if}
          </li>
        {/each}
      </ul>
      <MarkdownView markdown={draw.narrative} />
      <PrimaryButton label={copy.retakeButton} variant="surface" onclick={() => model.reset()} />
    </section>
  {:else}
    <section class="form">
      <NoticeBanner message={copy.safetyNotice} tone="info" />

      <div class="field">
        <label class="field-label" for="tarot-question">{copy.questionLabel}</label>
        <textarea
          id="tarot-question"
          class="question-input"
          rows="3"
          placeholder={copy.questionPlaceholder}
          value={model.question}
          disabled={model.isSubmitting}
          oninput={(event) => model.setQuestion((event.currentTarget as HTMLTextAreaElement).value)}
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
    </section>
  {/if}
</AppScaffold>

<style>
  .form,
  .result {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    max-width: 640px;
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
    outline: 2px solid var(--color-accent-gold-soft);
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
    border-color: var(--color-border-gold);
  }

  .spread-option.selected {
    border-color: var(--color-border-gold);
    background: var(--color-accent-gold-soft);
  }

  .spread-option:focus-visible {
    outline: 2px solid var(--color-accent-gold-soft);
    outline-offset: 1px;
  }

  .card-grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--space-md);
  }

  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    text-align: center;
  }

  .card-image {
    width: 100%;
    aspect-ratio: 100 / 171;
    object-fit: cover;
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
  }

  .card-image.reversed {
    transform: rotate(180deg);
  }

  .card-name {
    margin: 0;
    font-size: 13px;
    line-height: 1.3;
  }

  .card-orientation {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 12px;
  }

  .result-eyebrow {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 14px;
    text-transform: uppercase;
  }
</style>
