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
    max-width: 720px;
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
  }

  .field-label {
    font-size: 14px;
    font-weight: 700;
    color: #fce99f;
    letter-spacing: 0.02em;
  }

  .dream-input {
    border: 1.5px solid rgba(212, 175, 55, 0.25);
    border-radius: 16px;
    padding: 14px 18px;
    background: rgba(10, 7, 22, 0.6);
    color: #ffffff;
    font-size: 15px;
    font-family: inherit;
    resize: vertical;
    transition: all 0.2s ease;
  }

  .dream-input:focus {
    outline: none;
    border-color: #ffd700;
    box-shadow: 0 0 18px rgba(212, 175, 55, 0.25);
    background: rgba(15, 10, 30, 0.8);
  }

  .symbols {
    padding: 24px;
    border-radius: 20px;
    background: rgba(10, 7, 22, 0.6);
    border: 1px solid rgba(212, 175, 55, 0.2);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .symbols-title {
    margin: 0;
    font-family: 'Cinzel', 'Noto Serif', serif;
    font-size: 18px;
    font-weight: 700;
    color: #fce99f;
  }

  .symbol-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 14px;
  }

  .symbol {
    padding: 16px;
    border-radius: 16px;
    background: rgba(18, 12, 38, 0.8);
    border: 1px solid rgba(212, 175, 55, 0.2);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .symbol-name {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #ffd700;
  }

  .symbol-category {
    display: inline-block;
    align-self: flex-start;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid rgba(168, 85, 247, 0.4);
    background: rgba(168, 85, 247, 0.15);
    color: #c084fc;
    font-size: 11px;
    font-weight: 600;
  }

  .symbol-meaning {
    margin: 4px 0 0;
    color: #dfd4b8;
    font-size: 13px;
    line-height: 1.55;
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

    .form,
    .result {
      padding: 20px 16px;
      border-radius: 18px;
    }

    .symbol-list {
      grid-template-columns: 1fr;
    }
  }

  /* Đồng bộ Theme Light Hoàng Gia */
  :global([data-theme="light"]) .dream-screen {
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

  :global([data-theme="light"]) .dream-input {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(212, 175, 55, 0.35);
    color: #1c1917;
  }

  :global([data-theme="light"]) .symbols {
    background: rgba(248, 246, 240, 0.85);
    border-color: rgba(212, 175, 55, 0.3);
  }

  :global([data-theme="light"]) .symbols-title {
    color: #78350f;
  }

  :global([data-theme="light"]) .symbol {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(212, 175, 55, 0.25);
  }

  :global([data-theme="light"]) .symbol-name {
    color: #b45309;
  }

  :global([data-theme="light"]) .symbol-meaning {
    color: #44403c;
  }

  :global([data-theme="light"]) .reading {
    background: rgba(248, 246, 240, 0.85);
    border-color: rgba(212, 175, 55, 0.25);
  }

  :global([data-theme="light"]) .reading-title {
    color: #78350f;
  }
</style>
