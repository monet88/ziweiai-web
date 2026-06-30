<script lang="ts">
  // DreamScreen (US-038): màn Giải mộng. Người dùng mô tả giấc mơ → POST /dreams/interpret; kết quả
  // render danh sách biểu tượng khớp được (tên + nghĩa nền) + luận giải Markdown do LLM sinh. Cho
  // phép khách (không chặn anon ở UI). Nhãn toàn tiếng Việt.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { untrack } from 'svelte';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { PrimaryButton, NoticeBanner } from '$lib/components/ui';
  import MarkdownView from '$lib/features/explanation/MarkdownView.svelte';
  import { createDreamModel, type DreamCopy } from './dream-model.svelte';

  interface Props {
    copy: DreamCopy;
  }

  let { copy }: Props = $props();

  const auth = getAuthStore();
  const model = untrack(() => createDreamModel({ auth, copy }));

  function goToDashboard(): void {
    void goto(resolve('/'));
  }
</script>

<div class="dream-screen">
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
        {@const interpretation = model.result}
        <section class="result" aria-live="polite">
          {#if interpretation.symbols.length > 0}
            <div class="symbols">
              <p class="symbols-title">{copy.symbolsTitle}</p>
              <ul class="symbol-list">
                {#each interpretation.symbols as symbol (symbol.keywords[0])}
                  <li class="symbol">
                    <p class="symbol-name">{symbol.keywords.join(' / ')}</p>
                    <span class="symbol-category">{symbol.category}</span>
                    <p class="symbol-meaning">{symbol.meaning}</p>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}

          <div class="reading">
            <p class="reading-title">{copy.readingTitle}</p>
            <MarkdownView markdown={interpretation.narrative} />
          </div>

          <NoticeBanner message={copy.safetyNotice} tone="info" />
          <PrimaryButton label={copy.retakeButton} variant="surface" onclick={() => model.reset()} />
        </section>
      {:else}
        <section class="form">
          <div class="field">
            <label class="field-label" for="dream-input">{copy.dreamLabel}</label>
            <textarea
              id="dream-input"
              class="dream-input"
              rows="5"
              placeholder={copy.dreamPlaceholder}
              value={model.dream}
              disabled={model.isSubmitting}
              oninput={(event) =>
                model.setDream((event.currentTarget as HTMLTextAreaElement).value)}
            ></textarea>
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
  .dream-screen {
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
    letter-spacing: 0;
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

  .dream-input {
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    font-size: 15px;
    font-family: inherit;
    resize: vertical;
  }

  .dream-input:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 1px;
  }

  .symbols {
    padding: var(--space-lg);
    border-radius: var(--radius-lg);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-hairline);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .symbols-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }

  .symbol-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .symbol {
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-hairline);
  }

  .symbol-name {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }

  .symbol-category {
    display: inline-block;
    margin: 4px 0;
    padding: 2px 10px;
    border-radius: var(--radius-pill);
    border: 1px solid var(--color-accent-purple-deep);
    color: var(--color-accent-purple-deep);
    font-size: 11px;
    font-weight: 600;
  }

  .symbol-meaning {
    margin: 4px 0 0;
    color: var(--color-text-muted);
    font-size: 14px;
    line-height: 1.5;
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
  }
</style>
