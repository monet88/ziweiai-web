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
  import PalmLandmarkOverlay from './PalmLandmarkOverlay.svelte';
  import type { VisionKind } from '@ziweiai/contracts';
  import { Sparkles } from 'lucide-svelte';

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
  // Ref tới ảnh preview để lớp phủ Xem Tay đo đúng vùng hiển thị (chỉ dùng khi kind==='palm').
  let previewImg = $state<HTMLImageElement | null>(null);

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

  function onDragLeave(event: DragEvent): void {
    // Guard: drag rời sang phần tử con bên trong dropzone vẫn bắn dragleave → bỏ qua để khỏi
    // nhấp nháy highlight. Chỉ reset khi con trỏ rời hẳn khỏi dropzone (relatedTarget nằm ngoài).
    const current = event.currentTarget as HTMLElement | null;
    const next = event.relatedTarget as Node | null;
    if (current && next && current.contains(next)) return;
    isDragging = false;
  }

  function onDrop(event: DragEvent): void {
    event.preventDefault();
    isDragging = false;
    if (model.isSubmitting) return;
    // setImage tự validate loại + kích thước; file sai loại sẽ đặt validationMessage, imageFile vẫn null.
    model.setImage(event.dataTransfer?.files?.[0] ?? null);
  }
</script>

<AppScaffold eyebrow={copy.heroEyebrow} title={copy.heroTitle} subtitle={copy.heroSubtitle}>
  {#if model.result}
    <section class="result celestial-card-glass" aria-live="polite">
      <div class="result-header">
        <div class="result-badge">
          <Sparkles class="badge-sparkle-icon" />
          <span>Luận Giải Ngũ Quan Hoàng Gia</span>
        </div>
        <h3 class="result-title">{copy.resultTitle}</h3>
      </div>
      <div class="result-body">
        <MarkdownView markdown={model.result.narrative} />
      </div>
      <div class="result-footer">
        <PrimaryButton label={copy.retakeButton} variant="surface" onclick={() => model.reset()} />
      </div>
    </section>
  {:else}
    <section class="form">
      {#if model.isAnonymous}
        <div class="anon-prompt celestial-card-glass p-4">
          <NoticeBanner message={copy.identityRequired} tone="warning" />
          <a href={resolve('/sign-in')} class="anon-signin-link">
            Đăng nhập / Đăng ký bằng Email để mở khoá tính năng &rarr;
          </a>
        </div>
      {/if}

      <!-- Lồng Quét Sinh Trắc & Ngũ Quan AI Khâm Thiên Giám -->
      <div class="scanner-card">
        <div class="scanner-header">
          <div class="scanner-title-group">
            <span class="pulse-indicator"></span>
            <span class="scanner-title">{copy.uploadLabel}</span>
          </div>
          <span class="scanner-badge">AI Biometrics V2.5</span>
        </div>

        <!-- Input file ẩn nhưng luôn trong DOM -->
        <input
          bind:this={fileInput}
          class="visually-hidden-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label={copy.uploadLabel}
          tabindex="-1"
          disabled={model.isSubmitting}
          onchange={onFileChange}
        />

        {#if previewUrl}
          <figure class="preview">
            <div class="preview-canvas">
              <img
                bind:this={previewImg}
                class="preview-img"
                src={previewUrl}
                alt={model.imageFile?.name ?? copy.uploadLabel}
              />
              {#if kind === 'palm'}
                <PalmLandmarkOverlay image={previewImg} src={previewUrl} label={copy.overlayLabel} />
              {/if}
            </div>
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
            class="scanner-dropzone"
            class:is-dragging={isDragging}
            aria-labelledby="vision-upload-label"
            disabled={model.isSubmitting}
            onclick={openPicker}
            ondragover={onDragOver}
            ondragleave={onDragLeave}
            ondrop={onDrop}
          >
            <!-- 4 Góc Ngắm Laze Công Nghệ Cao -->
            <div class="corner-bracket top-left"></div>
            <div class="corner-bracket top-right"></div>
            <div class="corner-bracket bottom-left"></div>
            <div class="corner-bracket bottom-right"></div>

            <!-- Tia quét laze chuyển động -->
            <div class="laser-beam"></div>

            <div class="scanner-icon-wrap">
              <svg
                class="scanner-center-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" stroke-dasharray="4 2" />
                <circle cx="12" cy="12" r="3" fill="currentColor" fill-opacity="0.3" />
                <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
              </svg>
            </div>

            <p class="dropzone-prompt">{copy.dropzonePrompt}</p>
            <p class="dropzone-hint">{copy.uploadHint}</p>
          </button>
        {/if}

        <!-- 3 Tiêu Chí Chụp Chuẩn Khâm Thiên Giám -->
        <div class="capture-guidelines">
          <div class="guide-item">
            <span class="guide-dot">✦</span>
            <span>Chụp trực diện, không nghiêng lệch</span>
          </div>
          <div class="guide-item">
            <span class="guide-dot">✦</span>
            <span>Ánh sáng rõ ràng, không bóng mờ</span>
          </div>
          <div class="guide-item">
            <span class="guide-dot">✦</span>
            <span>Không đeo kính râm hoặc che lòng bàn tay</span>
          </div>
        </div>
      </div>

      <!-- Thẻ Câu Hỏi Mệnh Lý -->
      <div class="celestial-card-glass question-card">
        <label class="field-label" for="vision-question">
          <Sparkles class="field-sparkle" />
          <span>{copy.questionLabel}</span>
        </label>
        <textarea
          id="vision-question"
          class="question-input"
          rows="3"
          placeholder={copy.questionPlaceholder}
          value={model.question}
          disabled={model.isSubmitting}
          oninput={(event) => model.setQuestion((event.currentTarget as HTMLTextAreaElement).value)}
        ></textarea>
        <p class="question-hint">Để trống nếu muốn AI tổng luận toàn diện vận mệnh qua ngũ quan/chỉ tay.</p>
      </div>

      {#if model.validationMessage}
        <NoticeBanner message={model.validationMessage} tone="danger" />
      {/if}
      {#if model.isError && model.errorMessage}
        <NoticeBanner message={model.errorMessage} tone="danger" />
      {/if}

      <!-- Nút Hành Động Hoàng Kim Full Width -->
      <div class="action-wrap">
        {#if model.isAnonymous}
          <PrimaryButton
            type="button"
            onclick={() => goto(resolve('/sign-in'))}
          >
            <div class="action-btn-inner">
              <Sparkles class="btn-icon" />
              <span>ĐĂNG NHẬP ĐỂ KHỞI TẠO LUẬN GIẢI {kind === 'palm' ? 'CHỈ TAY' : 'TƯỚNG MẶT'}</span>
            </div>
          </PrimaryButton>
        {:else}
          <PrimaryButton
            loading={model.isSubmitting}
            disabled={!model.imageFile}
            onclick={() => model.submit()}
          >
            <div class="action-btn-inner">
              <Sparkles class="btn-icon" />
              <span>{copy.submitButton}</span>
            </div>
          </PrimaryButton>
        {/if}

        <div class="security-seal">
          <svg class="seal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Bảo mật chuẩn SHA-256 • Ảnh được xử lý cục bộ và tự hủy sau khi luận giải</span>
        </div>
      </div>
    </section>
  {/if}
</AppScaffold>

<style>
  .form,
  .result {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    max-width: 680px;
    margin: 0 auto;
  }

  /* Celestial Glass Card Chung */
  .celestial-card-glass {
    background: rgba(22, 16, 42, 0.65);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 20px;
    padding: 20px 24px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .anon-prompt {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .anon-signin-link {
    align-self: flex-start;
    color: #ffd700;
    font-size: 13.5px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .anon-signin-link:hover {
    color: #ffffff;
    text-decoration: underline;
  }

  /* Lồng Quét Sinh Trắc (Scanner Card) */
  .scanner-card {
    background: rgba(18, 13, 34, 0.85);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 24px;
    padding: 20px 24px;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.5), 0 0 25px rgba(212, 175, 55, 0.08);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .scanner-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.15);
  }

  .scanner-title-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pulse-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 10px #10b981;
    animation: pulseGlow 2s infinite ease-in-out;
  }

  @keyframes pulseGlow {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.3); }
  }

  .scanner-title {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #f7eed8;
  }

  .scanner-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(212, 175, 55, 0.12);
    border: 1px solid rgba(212, 175, 55, 0.35);
    color: #ffd700;
  }

  /* Scanner Dropzone Hoàng Gia */
  .scanner-dropzone {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    min-height: 240px;
    padding: 32px 20px;
    border: 1.5px dashed rgba(212, 175, 55, 0.35);
    border-radius: 20px;
    background: rgba(10, 7, 20, 0.6);
    color: #dfd4b8;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .scanner-dropzone:hover:not(:disabled),
  .scanner-dropzone.is-dragging {
    border-color: #ffd700;
    background: rgba(26, 18, 50, 0.8);
    box-shadow: 0 0 30px rgba(212, 175, 55, 0.25);
    transform: translateY(-1px);
  }

  /* 4 Góc Ngắm Laze (Corner Brackets) */
  .corner-bracket {
    position: absolute;
    width: 16px;
    height: 16px;
    border-color: #ffd700;
    border-style: solid;
    pointer-events: none;
    transition: all 0.2s ease;
  }

  .corner-bracket.top-left {
    top: 10px;
    left: 10px;
    border-width: 2px 0 0 2px;
  }

  .corner-bracket.top-right {
    top: 10px;
    right: 10px;
    border-width: 2px 2px 0 0;
  }

  .corner-bracket.bottom-left {
    bottom: 10px;
    left: 10px;
    border-width: 0 0 2px 2px;
  }

  .corner-bracket.bottom-right {
    bottom: 10px;
    right: 10px;
    border-width: 0 2px 2px 0;
  }

  .scanner-dropzone:hover .corner-bracket {
    width: 20px;
    height: 20px;
    border-color: #ffffff;
    box-shadow: 0 0 10px #ffd700;
  }

  /* Tia Laze Quét Lên Xuống (Laser Beam) */
  .laser-beam {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.8) 50%, transparent 100%);
    box-shadow: 0 0 12px rgba(255, 215, 0, 0.8);
    animation: laserScan 4s ease-in-out infinite;
    pointer-events: none;
  }

  @keyframes laserScan {
    0% { top: 5%; opacity: 0; }
    15% { opacity: 1; }
    85% { opacity: 1; }
    100% { top: 95%; opacity: 0; }
  }

  .scanner-icon-wrap {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffd700;
  }

  .scanner-center-icon {
    width: 32px;
    height: 32px;
  }

  .dropzone-prompt {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: #f7eed8;
    letter-spacing: 0.02em;
  }

  .dropzone-hint {
    margin: 0;
    font-size: 12.5px;
    color: rgba(226, 216, 184, 0.7);
    text-align: center;
    max-width: 360px;
  }

  /* 3 Tiêu Chí Chụp Ảnh */
  .capture-guidelines {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 8px;
    padding-top: 10px;
    border-top: 1px dashed rgba(212, 175, 55, 0.2);
  }

  .guide-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    color: rgba(226, 216, 184, 0.75);
  }

  .guide-dot {
    color: #ffd700;
    font-size: 10px;
  }

  /* Question Card */
  .question-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13.5px;
    font-weight: 700;
    color: #ffd700;
    letter-spacing: 0.03em;
  }

  :global(.field-sparkle) {
    width: 14px;
    height: 14px;
    color: #ffd700;
  }

  .question-input {
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 12px;
    padding: 12px 14px;
    background: rgba(10, 7, 20, 0.85);
    color: #f7eed8;
    font-size: 15px;
    font-family: inherit;
    resize: vertical;
    transition: all 0.2s ease;
  }

  .question-input:focus-visible {
    outline: none;
    border-color: #ffd700;
    box-shadow: 0 0 16px rgba(212, 175, 55, 0.3);
  }

  .question-hint {
    margin: 2px 0 0;
    font-size: 11.5px;
    color: rgba(226, 216, 184, 0.55);
  }

  /* Action Wrap Hoàng Kim */
  .action-wrap {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .action-wrap :global(.button) {
    width: 100%;
    min-height: 52px;
    border-radius: 14px;
    background: linear-gradient(135deg, #fce99f 0%, #ffd700 30%, #d4af37 70%, #b8860b 100%) !important;
    color: #0d0a1a !important;
    border: 1px solid rgba(255, 255, 255, 0.4) !important;
    box-shadow: 0 6px 24px rgba(212, 175, 55, 0.35) !important;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .action-wrap :global(.button:hover:not(:disabled)) {
    transform: translateY(-1.5px);
    box-shadow:
      0 10px 32px rgba(212, 175, 55, 0.55),
      0 0 20px rgba(255, 215, 0, 0.4) !important;
  }

  .action-btn-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.05em;
    color: #0d0a1a;
  }

  :global(.btn-icon) {
    width: 18px;
    height: 18px;
    color: #0d0a1a;
  }

  .security-seal {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 11px;
    color: rgba(226, 216, 184, 0.6);
  }

  .seal-icon {
    width: 13px;
    height: 13px;
    color: #ffd700;
  }

  /* Preview Frame */
  .preview {
    margin: 0;
    border: 1px solid rgba(212, 175, 55, 0.35);
    border-radius: 20px;
    overflow: hidden;
    background: rgba(10, 7, 20, 0.85);
  }

  .preview-canvas {
    position: relative;
    display: block;
  }

  .preview-img {
    display: block;
    width: 100%;
    max-height: 380px;
    object-fit: contain;
    background: #0d091b;
  }

  .preview-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 16px;
    border-top: 1px solid rgba(212, 175, 55, 0.2);
    background: rgba(22, 16, 42, 0.95);
  }

  .preview-name {
    overflow: hidden;
    color: #dfd4b8;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
    flex: 1 1 140px;
  }

  .preview-actions {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
  }

  .preview-action {
    padding: 6px 12px;
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    color: #ffd700;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .preview-action:hover:not(:disabled) {
    background: rgba(212, 175, 55, 0.2);
    border-color: #ffd700;
  }

  .preview-action-danger {
    color: #f87171;
    border-color: rgba(248, 113, 113, 0.3);
  }

  .preview-action-danger:hover:not(:disabled) {
    background: rgba(248, 113, 113, 0.2);
    border-color: #f87171;
  }

  @media (max-width: 480px) {
    .scanner-dropzone {
      min-height: 200px;
      padding: 24px 14px;
    }

    .scanner-icon-wrap {
      width: 48px;
      height: 48px;
    }

    .scanner-center-icon {
      width: 26px;
      height: 26px;
    }

    .dropzone-prompt {
      font-size: 14px;
    }

    .dropzone-hint {
      font-size: 12px;
    }

    .preview-img {
      max-height: 280px;
    }
  }

  @media (max-width: 374px) {
    .scanner-card,
    .celestial-card-glass {
      padding: 16px 14px;
      border-radius: 16px;
    }

    .scanner-dropzone {
      min-height: 180px;
      padding: 18px 10px;
    }

    .preview-bar {
      padding: 8px 10px;
    }

    .preview-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }

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
    opacity: 0;
    pointer-events: none;
  }

  /* Đồng bộ Theme Light Hoàng Gia */
  :global([data-theme="light"]) .scanner-card,
  :global([data-theme="light"]) .celestial-card-glass {
    background: rgba(255, 255, 255, 0.88);
    border-color: rgba(212, 175, 55, 0.45);
    box-shadow: 0 16px 40px rgba(212, 175, 55, 0.12);
    color: #1c1917;
  }

  :global([data-theme="light"]) .scanner-header {
    border-bottom-color: rgba(212, 175, 55, 0.2);
  }

  :global([data-theme="light"]) .scanner-title {
    color: #1c1917;
  }

  :global([data-theme="light"]) .scanner-badge {
    background: rgba(212, 175, 55, 0.15);
    border-color: rgba(212, 175, 55, 0.4);
    color: #854d0e;
  }

  :global([data-theme="light"]) .scanner-dropzone {
    background: rgba(248, 246, 240, 0.75);
    border-color: rgba(212, 175, 55, 0.4);
    color: #1c1917;
  }

  :global([data-theme="light"]) .scanner-dropzone:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.95);
    border-color: #b45309;
    box-shadow: 0 0 25px rgba(212, 175, 55, 0.2);
  }

  :global([data-theme="light"]) .scanner-icon-wrap {
    background: rgba(212, 175, 55, 0.15);
    border-color: rgba(212, 175, 55, 0.35);
  }

  :global([data-theme="light"]) .dropzone-prompt {
    color: #1c1917;
  }

  :global([data-theme="light"]) .dropzone-hint {
    color: #78716c;
  }

  :global([data-theme="light"]) .guide-item {
    background: rgba(255, 255, 255, 0.85);
    border-color: rgba(212, 175, 55, 0.25);
    color: #44403c;
  }

  :global([data-theme="light"]) .guide-dot {
    color: #b45309;
  }

  :global([data-theme="light"]) .field-label {
    color: #78350f;
  }

  :global([data-theme="light"]) .question-input {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(212, 175, 55, 0.35);
    color: #1c1917;
  }

  :global([data-theme="light"]) .question-input:focus {
    border-color: #b45309;
    box-shadow: 0 0 16px rgba(212, 175, 55, 0.25);
    background: #ffffff;
  }

  :global([data-theme="light"]) .question-hint {
    color: #78716c;
  }

  :global([data-theme="light"]) .result-title {
    color: #180d38;
  }

  :global([data-theme="light"]) .result-body {
    background: rgba(248, 246, 240, 0.85);
    color: #292524;
  }
</style>
