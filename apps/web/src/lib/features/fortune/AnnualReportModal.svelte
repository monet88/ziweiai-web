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
  import { toast } from '$lib/stores/toast';

  interface Props {
    markdown: string;
    year: number;
    onClose: () => void;
  }

  let { markdown, year, onClose }: Props = $props();

  const copy = viCopy.fortune.annual;
  let copied = $state(false);

  // Modal chỉ mount khi mở → focus panel ngay để keyboard user vào vùng dialog. Chạy 1 lần on-mount.
  function autofocus(node: HTMLElement): void {
    node.focus();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(markdown);
      copied = true;
      toast.show('✨ Đã sao chép toàn văn Báo Cáo Năm!', 'success');
      setTimeout(() => {
        copied = false;
      }, 2500);
    } catch {
      toast.show('Không thể sao chép tệp', 'danger');
    }
  }

  function handlePrint() {
    window.print();
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
      <div class="head-left">
        <span class="modal-gem">✦</span>
        <h2 class="modal-title" id="annual-report-modal-title">{copy.title} {year}</h2>
      </div>

      <div class="head-actions">
        <button type="button" class="action-btn" onclick={handleCopy} title="Sao chép toàn văn">
          {copied ? '✓ Đã chép' : '📋 Sao chép'}
        </button>

        <button type="button" class="action-btn" onclick={handlePrint} title="In sớ hoặc lưu file PDF">
          🖨️ In sớ
        </button>

        <button type="button" class="modal-close" onclick={onClose} aria-label={copy.close}>×</button>
      </div>
    </header>
    <div class="modal-body printable-content">
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
    background: rgba(10, 15, 30, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    animation: fadeIn 0.25s ease-out forwards;
  }

  .modal-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    width: min(780px, 100%);
    max-height: 85vh;
    border-radius: var(--radius-lg, 20px);
    background: rgba(20, 24, 38, 0.95);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(212, 175, 55, 0.3);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.05),
      0 20px 50px rgba(0, 0, 0, 0.6);
    overflow: hidden;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    color: var(--color-text-primary, #f5f6fa);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
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
    padding: 14px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.02);
    gap: 12px;
  }

  .head-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .modal-gem {
    color: #ffd700;
    font-size: 16px;
  }

  .modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #f1dfa5;
  }

  .head-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .action-btn {
    padding: 6px 12px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.85);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: rgba(212, 175, 55, 0.2);
    border-color: #ffd700;
    color: #ffd700;
  }

  .modal-close {
    border: none;
    background: rgba(255, 255, 255, 0.08);
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.7);
    transition: all 0.2s ease;
  }

  .modal-close:hover {
    background: rgba(255, 255, 255, 0.18);
    color: #ffffff;
    transform: scale(1.05);
  }

  .modal-body {
    overflow-y: auto;
    padding: 24px 28px;
    scrollbar-width: thin;
    scrollbar-color: rgba(212, 175, 55, 0.4) rgba(0, 0, 0, 0.2);
  }

  .modal-body::-webkit-scrollbar {
    width: 6px;
  }

  .modal-body::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 4px;
  }

  .modal-body::-webkit-scrollbar-thumb {
    background: rgba(212, 175, 55, 0.4);
    border-radius: 4px;
  }

  .modal-body::-webkit-scrollbar-thumb:hover {
    background: rgba(212, 175, 55, 0.7);
  }

  /* Dual-Theme: Light Mode */
  :global([data-theme="light"]) .modal-backdrop {
    background: rgba(15, 23, 42, 0.45);
  }

  :global([data-theme="light"]) .modal-panel {
    background: #ffffff;
    border-color: rgba(180, 83, 9, 0.25);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
    color: #1f2937;
  }

  :global([data-theme="light"]) .modal-head {
    background: #fdfaf3;
    border-bottom-color: rgba(180, 83, 9, 0.15);
  }

  :global([data-theme="light"]) .modal-gem {
    color: #b45309;
  }

  :global([data-theme="light"]) .modal-title {
    color: #78350f;
  }

  :global([data-theme="light"]) .action-btn {
    background: #ffffff;
    border-color: #d1d5db;
    color: #374151;
  }

  :global([data-theme="light"]) .action-btn:hover {
    background: #fef3c7;
    border-color: #d97706;
    color: #92400e;
  }

  :global([data-theme="light"]) .modal-close {
    background: #f3f4f6;
    color: #4b5563;
  }

  :global([data-theme="light"]) .modal-close:hover {
    background: #e5e7eb;
    color: #111827;
  }
</style>
