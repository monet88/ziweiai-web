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

  // Một <input file> ẩn duy nhất, luôn gắn trong DOM; dropzone + nút "Đổi ảnh" cùng gọi openPicker().
  let fileInput = $state<HTMLInputElement | null>(null);
  let isDragging = $state(false);
  // URL preview tạo từ File đang chọn. Quản ở component (DOM/trình duyệt) chứ không ở model: object URL
  // là tài nguyên trình duyệt cần revoke đúng vòng đời để tránh rò bộ nhớ.
  let previewUrl = $state<string | null>(null);

  // Tạo object URL khi có ảnh, revoke khi ảnh đổi/biến mất (cleanup của $effect chạy trước lần kế tiếp
  // và khi unmount). Theo dõi model.imageFile làm dependency.
  $effect(() => {
    const file = model.imageFile;
    if (!file) {
      previewUrl = null;
      return;
    }
    const url = URL.createObjectURL(file);
    previewUrl = url;
    return () => URL.revokeObjectURL(url);
  });

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

  function openPicker(): void {
    fileInput?.click();
  }

  function onDragOver(event: DragEvent): void {
    if (model.isSubmitting) return;
    event.preventDefault(); // bắt buộc để phần tử nhận được sự kiện drop
    isDragging = true;
  }

  function onDragLeave(): void {
    isDragging = false;
  }

  function onDrop(event: DragEvent): void {
    event.preventDefault();
    isDragging = false;
    if (model.isSubmitting) return;
    // setImage tự validate loại + kích thước; file sai loại sẽ đặt validationMessage, imageFile vẫn null.
    model.setImage(event.dataTransfer?.files?.[0] ?? null);
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
        <span class="field-label" id="vision-upload-label">{copy.uploadLabel}</span>
        <p class="field-hint">{copy.uploadHint}</p>

        <!-- Input file ẩn nhưng luôn trong DOM: dropzone (bấm) + nút "Đổi ảnh" cùng kích hoạt qua
             openPicker(). Giữ trong DOM để e2e setInputFiles + $effect reset value vẫn hoạt động. -->
        <input
          bind:this={fileInput}
          class="visually-hidden-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label={copy.uploadLabel}
          disabled={model.isSubmitting}
          onchange={onFileChange}
        />

        {#if previewUrl}
          <figure class="preview">
            <img class="preview-img" src={previewUrl} alt={model.imageFile?.name ?? copy.uploadLabel} />
            <figcaption class="preview-bar">
              <span class="preview-name" title={model.imageFile?.name}>{model.imageFile?.name}</span>
              <span class="preview-actions">
                <button
                  type="button"
                  class="preview-action"
                  disabled={model.isSubmitting}
                  onclick={openPicker}
                >
                  {copy.changeImageButton}
                </button>
                <button
                  type="button"
                  class="preview-action preview-action-danger"
                  disabled={model.isSubmitting}
                  onclick={() => model.setImage(null)}
                >
                  {copy.removeImageButton}
                </button>
              </span>
            </figcaption>
          </figure>
        {:else}
          <button
            type="button"
            class="dropzone"
            class:is-dragging={isDragging}
            aria-labelledby="vision-upload-label"
            disabled={model.isSubmitting}
            onclick={openPicker}
            ondragover={onDragOver}
            ondragleave={onDragLeave}
            ondrop={onDrop}
          >
            <svg
              class="dropzone-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2.5" />
              <circle cx="8.5" cy="8.5" r="1.75" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span class="dropzone-prompt">{copy.dropzonePrompt}</span>
            <span class="dropzone-hint">{copy.uploadHint}</span>
          </button>
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

  /* Input file ẩn về mặt thị giác nhưng vẫn trong DOM + focusable cho e2e/setInputFiles. */
  .visually-hidden-input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Dropzone: nút full-width, viền nét đứt, khung tỉ lệ cố định (placeholder skeleton) để
     layout không nhảy khi chuyển sang preview. */
  .dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    width: 100%;
    min-height: 200px;
    padding: var(--space-lg);
    border: 1.5px dashed var(--color-border-hairline);
    border-radius: var(--radius-lg);
    background: var(--color-bg-elevated);
    color: var(--color-text-muted);
    cursor: pointer;
    transition:
      border-color var(--duration-fast, 150ms) ease,
      background var(--duration-fast, 150ms) ease;
  }

  .dropzone:hover:not(:disabled),
  .dropzone:focus-visible,
  .dropzone.is-dragging {
    border-color: var(--color-accent-primary);
    background: var(--color-accent-primary-soft);
    color: var(--color-text-secondary);
  }

  .dropzone:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }

  .dropzone:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .dropzone-icon {
    width: 40px;
    height: 40px;
    color: var(--color-accent-primary);
  }

  .dropzone-prompt {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .dropzone-hint {
    font-size: 13px;
    text-align: center;
  }

  /* Preview thay chỗ dropzone: ảnh + thanh tên/hành động dưới đáy. */
  .preview {
    margin: 0;
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--color-bg-surface);
  }

  .preview-img {
    display: block;
    width: 100%;
    max-height: 360px;
    object-fit: contain;
    background: var(--color-bg-elevated);
  }

  .preview-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    border-top: 1px solid var(--color-border-hairline);
  }

  .preview-name {
    overflow: hidden;
    color: var(--color-text-muted);
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .preview-actions {
    display: flex;
    flex-shrink: 0;
    gap: var(--space-md);
  }

  .preview-action {
    padding: 0;
    border: 0;
    background: none;
    color: var(--color-link);
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .preview-action:hover:not(:disabled) {
    text-decoration: underline;
  }

  .preview-action:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
    border-radius: var(--radius-xs);
  }

  .preview-action:disabled {
    color: var(--color-text-muted);
    cursor: not-allowed;
  }

  .preview-action-danger {
    color: var(--color-accent-danger);
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
