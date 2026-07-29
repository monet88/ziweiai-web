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
    background: rgba(10, 15, 30, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    animation: fadeIn 0.25s ease-out forwards;
  }

  .modal-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    width: min(760px, 100%);
    max-height: 85vh;
    border-radius: var(--radius-lg, 20px);
    background: rgba(15, 23, 42, 0.92);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow:
      0 0.7px 2.2px rgba(0, 0, 0, 0.02),
      0 2px 8px rgba(0, 0, 0, 0.05),
      0 12px 40px rgba(0, 0, 0, 0.4),
      0 0 40px rgba(99, 102, 241, 0.15);
    animation: modalPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes modalPopIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    padding: var(--space-lg);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text-primary);
    background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .modal-close {
    border: none;
    background: rgba(255, 255, 255, 0.06);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    color: var(--color-text-secondary);
    transition: all 0.2s ease;
  }

  .modal-close:hover {
    background: rgba(255, 255, 255, 0.15);
    color: var(--color-text-primary);
    transform: scale(1.05);
  }

  .modal-body {
    overflow-y: auto;
    padding: var(--space-lg);
  }
</style>
