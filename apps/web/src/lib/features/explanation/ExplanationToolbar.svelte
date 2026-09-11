<script lang="ts">
  import { browser } from '$app/environment';
  import { Copy, Check, Download, Printer, FileText, ScrollText } from 'lucide-svelte';
  import { toast } from '$lib/stores/toast';

  interface Props {
    markdown: string;
    chartTitle?: string;
    birthInfo?: string;
    onOpenRoyalPdfModal?: () => void;
  }

  let {
    markdown,
    chartTitle = 'Lá Số Tử Vi',
    birthInfo = '',
    onOpenRoyalPdfModal,
  }: Props = $props();

  let copied = $state(false);

  async function handleCopy() {
    if (!browser || !markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      copied = true;
      toast.show('✨ Đã sao chép toàn văn bài luận giải hoàng gia!', 'success');
      setTimeout(() => {
        copied = false;
      }, 2500);
    } catch (err) {
      console.error('Failed to copy', err);
      toast.show('Không thể sao chép, vui lòng thử lại.', 'danger');
    }
  }

  function handleDownload(format: 'txt' | 'md') {
    if (!browser || !markdown) return;
    
    const timestamp = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    const header = [
      '====================================================',
      '        TỬ VI TOÀN TẬP — KHÂM THIÊN BẢO GIÁM',
      `           ${chartTitle.toUpperCase()}`,
      birthInfo ? `      Thông tin bản mệnh: ${birthInfo}` : '',
      `      Thời gian lập sớ: ${new Date().toLocaleString('vi-VN')}`,
      '====================================================\n\n'
    ].filter(Boolean).join('\n');

    const content = format === 'txt'
      ? header + markdown.replace(/[*#>`|]/g, '').trim()
      : header + markdown;

    const mime = format === 'txt' ? 'text/plain;charset=utf-8' : 'text/markdown;charset=utf-8';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Luan-Giai-${chartTitle.replace(/\s+/g, '_')}-${timestamp}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.show(`📥 Đã tải tệp .${format} thành công!`, 'success');
  }

  import { onDestroy } from 'svelte';

  onDestroy(() => {
    if (browser) {
      document.body.classList.remove('printing-explanation-scroll');
    }
  });

  function handlePrint() {
    if (!browser) return;
    document.body.classList.add('printing-explanation-scroll');
    const onAfterPrint = () => {
      document.body.classList.remove('printing-explanation-scroll');
      window.removeEventListener('afterprint', onAfterPrint);
    };
    window.addEventListener('afterprint', onAfterPrint, { once: true });
    toast.show('🖨️ Đang chuẩn bị bản sớ in ấn A4 chuẩn mực...', 'info');
    setTimeout(() => {
      window.print();
    }, 150);
  }
</script>

<div class="explanation-toolbar">
  <div class="toolbar-title">
    <FileText size={15} class="text-gold" />
    <span>Công Cụ Luận Giải</span>
  </div>

  <div class="toolbar-actions">
    <!-- Nút Sao Chép -->
    <button type="button" class="toolbar-btn" onclick={handleCopy} title="Sao chép toàn bộ bài luận">
      {#if copied}
        <Check size={14} class="text-success" />
        <span class="btn-text">Đã chép</span>
      {:else}
        <Copy size={14} />
        <span class="btn-text">Sao chép</span>
      {/if}
    </button>

    <!-- Nút Tải File Text / Markdown -->
    <button type="button" class="toolbar-btn" onclick={() => handleDownload('txt')} title="Tải file văn bản .txt">
      <Download size={14} />
      <span class="btn-text">Tải file .txt</span>
    </button>

    <button type="button" class="toolbar-btn" onclick={() => handleDownload('md')} title="Tải file Markdown .md">
      <Download size={14} />
      <span class="btn-text">Tải .md</span>
    </button>

    <!-- Nút Xuất Sớ PDF Hoàng Gia -->
    {#if onOpenRoyalPdfModal}
      <button
        type="button"
        class="toolbar-btn royal-pdf-btn"
        onclick={onOpenRoyalPdfModal}
        title="Xuất Bản Sớ Luận Giải Đa Trang chuẩn Ngự Bút Hoàng Cung (A4 PDF)"
      >
        <ScrollText size={14} class="text-gold" />
        <span class="btn-text">Xuất Sớ PDF</span>
      </button>
    {/if}

    <!-- Nút In Sớ / PDF -->
    <button type="button" class="toolbar-btn primary-print" onclick={handlePrint} title="In hoặc lưu dạng PDF">
      <Printer size={14} />
      <span class="btn-text">In sớ</span>
    </button>
  </div>
</div>

<style>
  .explanation-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 16px;
    margin-bottom: 16px;
    background: rgba(22, 16, 44, 0.7);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 12px;
    backdrop-filter: blur(8px);
  }

  .toolbar-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13.5px;
    font-weight: 600;
    color: #fef08a;
  }

  :global(.explanation-toolbar .text-gold) {
    color: #fbbf24;
  }

  :global(.explanation-toolbar .text-success) {
    color: #4ade80;
  }

  .toolbar-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .toolbar-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #e5e7eb;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toolbar-btn:hover {
    background: rgba(212, 175, 55, 0.15);
    border-color: rgba(212, 175, 55, 0.4);
    color: #fef08a;
    transform: translateY(-1px);
  }

  .toolbar-btn.royal-pdf-btn {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(180, 83, 9, 0.35) 100%);
    border-color: #ffd700;
    color: #fef08a;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.25);
  }

  .toolbar-btn.royal-pdf-btn:hover {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.45) 0%, rgba(180, 83, 9, 0.55) 100%);
    box-shadow: 0 0 14px rgba(255, 215, 0, 0.4);
    transform: translateY(-1px);
  }

  .toolbar-btn.primary-print {
    background: linear-gradient(135deg, rgba(217, 119, 6, 0.25) 0%, rgba(245, 158, 11, 0.35) 100%);
    border-color: #fbbf24;
    color: #fef08a;
  }

  .toolbar-btn.primary-print:hover {
    background: linear-gradient(135deg, rgba(217, 119, 6, 0.45) 0%, rgba(245, 158, 11, 0.55) 100%);
    box-shadow: 0 0 12px rgba(245, 158, 11, 0.35);
  }

  @media (max-width: 540px) {
    .explanation-toolbar {
      flex-direction: column;
      align-items: stretch;
    }
    .toolbar-actions {
      justify-content: space-between;
    }
    .toolbar-btn {
      flex: 1;
      justify-content: center;
      padding: 6px 8px;
      font-size: 12px;
    }
  }

  /* Dual Theme: Light Mode */
  :global([data-theme="light"]) .explanation-toolbar {
    background: #ffffff;
    border-color: rgba(180, 83, 9, 0.2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  :global([data-theme="light"]) .toolbar-title {
    color: #78350f;
  }

  :global([data-theme="light"]) .toolbar-btn {
    background: #f9fafb;
    border-color: #e5e7eb;
    color: #374151;
  }

  :global([data-theme="light"]) .toolbar-btn:hover {
    background: #fef3c7;
    border-color: #d97706;
    color: #92400e;
  }

  :global([data-theme="light"]) .toolbar-btn.primary-print {
    background: #fef3c7;
    border-color: #d97706;
    color: #92400e;
  }
</style>
