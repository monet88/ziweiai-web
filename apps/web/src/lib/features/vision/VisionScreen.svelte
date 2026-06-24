<script lang="ts">
  // VisionScreen (US-017e/f): màn luận giải vision dùng chung Xem Tướng + Xem Tay. Upload 1 ảnh
  // (≤4MB) + câu hỏi tuỳ chọn → POST /vision/{kind}; kết quả render Markdown. Chặn anon ở UI (nút
  // submit) — server vẫn là chốt cuối. Nhãn toàn tiếng Việt. Route truyền kind + copy tương ứng.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { untrack } from 'svelte';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { AppScaffold, PrimaryButton, NoticeBanner } from '$lib/components/ui';
  import MarkdownView from '$lib/features/explanation/MarkdownView.svelte';
  import { createVisionModel, type VisionCopy } from './vision-model.svelte';
  import type { VisionKind } from '@ziweiai/contracts';

  interface Props {
    kind: VisionKind;
    copy: VisionCopy;
  }

  let { kind, copy }: Props = $props();

  const auth = getAuthStore();
  // kind + copy là prop tĩnh do route truyền literal (kind="face" copy={viCopy.face}); model chỉ tạo
  // một lần lúc mount nên dùng giá trị hiện tại là đúng ý — bọc untrack để Svelte 5 không cảnh báo
  // state_referenced_locally (ta không cần model phản ứng khi prop đổi vì route không đổi prop).
  const model = untrack(() => createVisionModel({ kind, auth, copy }));

  let fileInput = $state<HTMLInputElement | null>(null);

  // Khi model.reset()/setImage(null) đưa imageFile về null, xoá luôn giá trị DOM của <input file>.
  // Nếu không, input vẫn giữ tên tệp cũ → người dùng chọn LẠI đúng tệp đó sẽ không kích hoạt onchange
  // (giá trị không đổi) → không upload lại được (review PR #28).
  $effect(() => {
    if (!model.imageFile && fileInput) {
      fileInput.value = '';
    }
  });

  function onFileChange(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    model.setImage(input.files?.[0] ?? null);
  }

  function goToDashboard(): void {
    void goto(resolve('/'));
  }
</script>

<AppScaffold eyebrow={copy.heroEyebrow} title={copy.heroTitle} subtitle={copy.heroSubtitle}>
  {#snippet action()}
    <PrimaryButton label={copy.returnToDashboard} variant="surface" onclick={goToDashboard} />
  {/snippet}

  {#if model.result}
    <section class="result" aria-live="polite">
      <p class="result-eyebrow">{copy.resultTitle}</p>
      <MarkdownView markdown={model.result.narrative} />
      <PrimaryButton label={copy.retakeButton} variant="surface" onclick={() => model.reset()} />
    </section>
  {:else}
    <section class="form">
      {#if model.isAnonymous}
        <NoticeBanner message={copy.identityRequired} tone="warning" />
      {/if}

      <NoticeBanner message={copy.privacyNotice} tone="info" />

      <div class="field">
        <span class="field-label">{copy.uploadLabel}</span>
        <p class="field-hint">{copy.uploadHint}</p>
        <input
          bind:this={fileInput}
          class="file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label={copy.uploadLabel}
          disabled={model.isSubmitting}
          onchange={onFileChange}
        />
        {#if model.imageFile}
          <p class="file-name">{model.imageFile.name}</p>
        {/if}
      </div>

      <div class="field">
        <label class="field-label" for="vision-question">{copy.questionLabel}</label>
        <textarea
          id="vision-question"
          class="question-input"
          rows="2"
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
        label={copy.submitButton}
        loading={model.isSubmitting}
        disabled={model.isAnonymous || !model.imageFile}
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

  .field-hint {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 13px;
  }

  .file-input {
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    padding: var(--space-sm);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    font-size: 14px;
  }

  .file-input:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 1px;
  }

  .file-name {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 13px;
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
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.125px;
  }
</style>
