<script lang="ts">
  // AnnualReportModal (US-016): trình bày Markdown báo cáo năm trong overlay. Render markdown
  // qua MarkdownView (sanitize, không render HTML thô — bất biến bảo mật). Nhận onClose từ parent.
  //
  // A11y: backdrop và panel là HAI thẻ ANH EM (không lồng điều khiển tương tác — tránh trình
  // đọc màn hình coi cả overlay là một nút). Backdrop chỉ là lớp nền click-để-đóng (role
  // presentation). Escape bắt ở <svelte:window> để đóng kể cả khi focus chưa vào panel; panel
  // tự nhận focus khi mount (use:autofocus) để keyboard user vào ngay vùng dialog.
  import MarkdownView from '$lib/features/explanation/MarkdownView.svelte';
  import { viCopy } from '$lib/i18n/vi';

  interface Props {
    markdown: string;
    year: number;
    onClose: () => void;
  }

  let { markdown, year, onClose }: Props = $props();

  const copy = viCopy.fortune.annual;

  // Modal chỉ mount khi mở → focus panel ngay để keyboard user vào vùng dialog. Chạy 1 lần on-mount.
  function autofocus(node: HTMLElement): void {
    node.focus();
  }
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }}
/>

<div class="modal-wrapper">
  <div class="modal-backdrop" role="presentation" onclick={onClose}></div>

  <div
    class="modal-panel"
    role="dialog"
    aria-modal="true"
    aria-labelledby="annual-report-modal-title"
    tabindex="-1"
    use:autofocus
  >
    <header class="modal-head">
      <h2 class="modal-title" id="annual-report-modal-title">{copy.title} {year}</h2>
      <button type="button" class="modal-close" onclick={onClose} aria-label={copy.close}>×</button>
    </header>
    <div class="modal-body">
      <MarkdownView {markdown} />
    </div>
  </div>
</div>

<style>
  .modal-wrapper {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-lg);
  }

  .modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
  }

  .modal-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    width: min(720px, 100%);
    max-height: 85vh;
    border-radius: var(--radius-lg);
    background: var(--color-bg-surface);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  }

  .modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    padding: var(--space-lg);
    border-bottom: 1px solid var(--color-border-hairline);
  }

  .modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .modal-close {
    border: none;
    background: transparent;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    color: var(--color-text-secondary);
  }

  .modal-body {
    overflow-y: auto;
    padding: var(--space-lg);
  }
</style>
