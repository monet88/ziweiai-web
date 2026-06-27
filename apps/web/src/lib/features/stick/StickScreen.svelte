<script lang="ts">
  // StickScreen (US-039 / backlog #47): màn Xin xăm. Người dùng nhập câu hỏi → POST /draws/stick;
  // kết quả render thẻ quẻ (số + tên + mức + thơ quẻ + nghĩa + lời khuyên + tích + giải lĩnh vực) +
  // bài luận Markdown do LLM sinh. Xin xăm CHO PHÉP khách (không chặn anon ở UI). Nhãn toàn tiếng Việt.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { untrack } from 'svelte';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { PrimaryButton, NoticeBanner } from '$lib/components/ui';
  import MarkdownView from '$lib/features/explanation/MarkdownView.svelte';
  import { createStickModel, type StickCopy } from './stick-model.svelte';

  interface Props {
    copy: StickCopy;
  }

  let { copy }: Props = $props();

  const auth = getAuthStore();
  const model = untrack(() => createStickModel({ auth, copy }));

  // Nhãn lĩnh vực hiển thị (khớp field detailedInterpretations trả về). Tĩnh nên bọc untrack.
  const fieldOrder: ReadonlyArray<{ key: string; label: string }> = untrack(() => [
    { key: 'career', label: copy.fieldCareer },
    { key: 'wealth', label: copy.fieldWealth },
    { key: 'marriage', label: copy.fieldMarriage },
    { key: 'health', label: copy.fieldHealth },
    { key: 'business', label: copy.fieldBusiness },
    { key: 'travel', label: copy.fieldTravel },
    { key: 'lawsuit', label: copy.fieldLawsuit },
  ]);

  function goToDashboard(): void {
    void goto(resolve('/'));
  }

  // Lấy các cặp [nhãn, nội dung] có dữ liệu từ detailedInterpretations để render danh sách.
  function detailRows(detail: Record<string, string | undefined> | undefined) {
    if (!detail) {
      return [];
    }
    return fieldOrder
      .map((field) => ({ label: field.label, value: detail[field.key] }))
      .filter((row): row is { label: string; value: string } => typeof row.value === 'string' && row.value.length > 0);
  }
</script>

<div class="stick-screen">
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
        {@const draw = model.result}
        {@const detail = detailRows(draw.stick.detailedInterpretations)}
        <section class="result" aria-live="polite">
          <p class="result-eyebrow">{copy.resultTitle}</p>

          <article class="stick-card">
            <div class="stick-head">
              <span class="stick-id">#{draw.stick.id}</span>
              <h2 class="stick-title">{draw.stick.title}</h2>
              <span class="stick-level">{copy.levelLabel}: {draw.stick.level}</span>
            </div>

            <div class="stick-block">
              <p class="block-title">{copy.poemTitle}</p>
              <p class="poem">{draw.stick.poem}</p>
            </div>

            <div class="stick-block">
              <p class="block-title">{copy.interpretationTitle}</p>
              <p>{draw.stick.interpretation}</p>
            </div>

            <div class="stick-block">
              <p class="block-title">{copy.adviceTitle}</p>
              <p>{draw.stick.advice}</p>
            </div>

            {#if draw.stick.story}
              <div class="stick-block">
                <p class="block-title">{copy.storyTitle}</p>
                <p>{draw.stick.story}</p>
              </div>
            {/if}

            {#if detail.length > 0}
              <div class="stick-block">
                <p class="block-title">{copy.fieldsTitle}</p>
                <ul class="field-list">
                  {#each detail as row (row.label)}
                    <li><span class="field-name">{row.label}:</span> {row.value}</li>
                  {/each}
                </ul>
              </div>
            {/if}
          </article>

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
            <label class="field-label" for="stick-question">{copy.questionLabel}</label>
            <textarea
              id="stick-question"
              class="question-input"
              rows="3"
              placeholder={copy.questionPlaceholder}
              value={model.question}
              disabled={model.isSubmitting}
              oninput={(event) => model.setQuestion((event.currentTarget as HTMLTextAreaElement).value)}
            ></textarea>
          </div>

          {#if model.validationMessage}
            <NoticeBanner message={model.validationMessage} tone="danger" />
          {/if}
          {#if model.isError && model.errorMessage}
            <NoticeBanner message={model.errorMessage} tone="danger" />
          {/if}

          <PrimaryButton
            label={model.isSubmitting ? copy.drawingLabel : copy.submitButton}
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
  .stick-screen {
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

  .result-eyebrow {
    margin: 0;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.125px;
  }

  .stick-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-lg);
    border-radius: var(--radius-lg);
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-hairline);
  }

  .stick-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-sm);
  }

  .stick-id {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-accent-primary);
  }

  .stick-title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .stick-level {
    margin-left: auto;
    padding: 2px 10px;
    border-radius: var(--radius-pill);
    border: 1px solid var(--color-accent-primary);
    color: var(--color-accent-primary);
    font-size: 12px;
    font-weight: 600;
  }

  .stick-block {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .stick-block p {
    margin: 0;
    line-height: 1.55;
  }

  .block-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .poem {
    font-style: italic;
    color: var(--color-text-primary);
  }

  .field-list {
    margin: 0;
    padding-left: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: 2px;
    line-height: 1.5;
  }

  .field-name {
    font-weight: 600;
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
