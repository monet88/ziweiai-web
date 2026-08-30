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
    max-width: 680px;
    margin: 0 auto;
    padding: 0 var(--space-lg) var(--space-xxl);
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }

  .band {
    position: relative;
    margin-top: var(--space-lg);
    padding: var(--space-xl) var(--space-lg) var(--space-lg);
    border-radius: var(--radius-xl);
    text-align: center;
    background: radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.15), transparent 70%),
                rgba(22, 27, 46, 0.6);
    border: 1px solid rgba(212, 175, 55, 0.25);
    backdrop-filter: blur(16px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
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
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-pill);
    background: rgba(11, 13, 20, 0.6);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .band-back svg {
    width: 18px;
    height: 18px;
  }

  .band-back:hover {
    border-color: #d4af37;
    background: rgba(212, 175, 55, 0.1);
    color: #fce99f;
  }

  .band-back:focus-visible {
    outline: 2px solid #d4af37;
    outline-offset: 2px;
  }

  .band-eyebrow {
    margin: 0;
    color: #d4af37;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .band-title {
    margin: 8px 0 0;
    font-size: 28px;
    font-weight: 800;
    line-height: 1.25;
    background: linear-gradient(135deg, #ffffff 0%, #fce99f 50%, #d4af37 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .band-sub {
    margin: var(--space-sm) auto 0;
    max-width: 480px;
    color: var(--color-text-muted);
    font-size: 14px;
    line-height: 1.6;
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
    background: rgba(22, 27, 46, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-xl);
    padding: var(--space-xl);
    backdrop-filter: blur(16px);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .field-label {
    font-size: 14px;
    font-weight: 700;
    color: #e2e8f0;
  }

  .question-input {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    background: rgba(11, 13, 20, 0.6);
    color: var(--color-text-primary);
    font-size: 15px;
    font-family: inherit;
    resize: vertical;
    transition: all 0.2s ease;
  }

  .question-input:focus-visible {
    outline: none;
    border-color: #d4af37;
    box-shadow: 0 0 16px rgba(212, 175, 55, 0.25);
  }

  .result-eyebrow {
    margin: 0;
    text-align: center;
    color: #d4af37;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* THẺ TRE CỔ ĐIỂN MẠ VÀNG (BAMBOO FORTUNE SLIP) */
  .stick-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    padding: var(--space-xl);
    border-radius: var(--radius-lg);
    background: radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.1), transparent 80%),
                rgba(15, 18, 28, 0.9);
    border: 2px solid #d4af37;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(212, 175, 55, 0.08);
    position: relative;
  }

  .stick-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-md);
    border-bottom: 1px solid rgba(212, 175, 55, 0.3);
    padding-bottom: var(--space-md);
  }

  .stick-id {
    font-size: 16px;
    font-weight: 800;
    color: #fce99f;
    padding: 2px 10px;
    border-radius: var(--radius-pill);
    background: rgba(212, 175, 55, 0.2);
    border: 1px solid rgba(212, 175, 55, 0.4);
  }

  .stick-title {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
    color: #ffffff;
  }

  .stick-level {
    margin-left: auto;
    padding: 4px 14px;
    border-radius: var(--radius-pill);
    border: 1px solid #d4af37;
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.3), rgba(184, 134, 11, 0.15));
    color: #fce99f;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
  }

  .stick-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: rgba(255, 255, 255, 0.02);
    padding: var(--space-md);
    border-radius: var(--radius-md);
    border-left: 3px solid #d4af37;
  }

  .stick-block p {
    margin: 0;
    line-height: 1.6;
  }

  .block-title {
    font-size: 13px;
    font-weight: 700;
    color: #fce99f;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .poem {
    font-style: italic;
    color: #fef08a;
    font-size: 16px;
    line-height: 1.7;
    white-space: pre-line;
  }

  .field-list {
    margin: 0;
    padding-left: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: 6px;
    line-height: 1.6;
  }

  .field-name {
    font-weight: 700;
    color: #fce99f;
  }

  .reading {
    padding: var(--space-lg);
    border-radius: var(--radius-lg);
    background: rgba(11, 13, 20, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .reading-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #fce99f;
  }
</style>
