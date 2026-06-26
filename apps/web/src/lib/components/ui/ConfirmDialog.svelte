<script lang="ts">
  // ConfirmDialog: hộp thoại xác nhận dùng chung cho các thao tác không hoàn tác (vd xoá ảnh
  // sinh trắc vision, decision 0023). Thay window.confirm để UX nhất quán với modal của dự án.
  //
  // A11y (theo AnnualReportModal): backdrop + panel là HAI thẻ anh em (không lồng điều khiển
  // tương tác). Backdrop là lớp nền click-để-huỷ (role presentation). Escape bắt ở
  // <svelte:window> để huỷ kể cả khi focus chưa vào panel; nút xác nhận tự nhận focus khi mount
  // để keyboard user thao tác ngay. Khi loading thì khoá cả hai nút (tránh double-submit/đóng sớm).
  import PrimaryButton from './PrimaryButton.svelte';

  interface Props {
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    /** Nhãn nút xác nhận khi đang xử lý (vd "Đang xoá…"). */
    loadingLabel?: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let {
    title,
    message,
    confirmLabel,
    cancelLabel,
    loadingLabel,
    loading = false,
    onConfirm,
    onCancel,
  }: Props = $props();

  // Đang xử lý → bỏ qua huỷ (Escape/backdrop) để không đóng giữa chừng làm lệch trạng thái.
  function requestCancel(): void {
    if (loading) {
      return;
    }
    onCancel();
  }

  // Modal chỉ mount khi mở → focus nút xác nhận ngay để keyboard user vào vùng dialog. PrimaryButton
  // render một <button> con; `node` là <div> bọc (không tabindex) nên focus thẳng vào nó sẽ trượt —
  // truy nút thật bên trong rồi focus. Fallback focus chính node phòng khi cấu trúc đổi.
  function autofocus(node: HTMLElement): void {
    const target = node.querySelector<HTMLButtonElement>('button') ?? node;
    target.focus();
  }
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'Escape') {
      requestCancel();
    }
  }}
/>

<div class="modal-wrapper">
  <div class="modal-backdrop" role="presentation" onclick={requestCancel}></div>

  <div
    class="modal-panel"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="confirm-dialog-title"
    aria-describedby="confirm-dialog-message"
    tabindex="-1"
  >
    <h2 class="modal-title" id="confirm-dialog-title">{title}</h2>
    <p class="modal-message" id="confirm-dialog-message">{message}</p>
    <div class="modal-actions">
      <PrimaryButton variant="surface" label={cancelLabel} disabled={loading} onclick={requestCancel} />
      <div use:autofocus>
        <PrimaryButton
          label={loading ? (loadingLabel ?? confirmLabel) : confirmLabel}
          loading={loading}
          onclick={onConfirm}
        />
      </div>
    </div>
  </div>
</div>

<style>
  .modal-wrapper {
    position: fixed;
    inset: 0;
    z-index: 60;
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
    gap: var(--space-md);
    width: min(420px, 100%);
    padding: var(--space-lg);
    border-radius: var(--radius-lg);
    background: var(--color-bg-surface);
    /* Elevation level-2 (DESIGN.md): bóng nhiều lớp gần-trong-suốt — nâng nhẹ khỏi giấy. */
    box-shadow:
      0 0.7px 2.2px rgba(0, 0, 0, 0.011),
      0 1.7px 5.3px rgba(0, 0, 0, 0.016),
      0 3.1px 10px rgba(0, 0, 0, 0.02),
      0 5.6px 17.9px rgba(0, 0, 0, 0.024),
      0 10.4px 33.4px rgba(0, 0, 0, 0.029),
      0 23px 52px rgba(0, 0, 0, 0.05);
  }

  .modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .modal-message {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 1.5;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
  }
</style>
