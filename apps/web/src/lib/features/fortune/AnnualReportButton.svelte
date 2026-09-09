<script lang="ts">
  // AnnualReportButton (US-016): nút tạo báo cáo năm + modal Markdown. Dùng createMutation gọi
  // createAnnualReport (token đọc TƯƠI trong mutationFn, bất biến §3).
  // Khi hết XU API trả về 402, fetchJson sẽ tự động kích hoạt Global Paywall Modal
  // thay vì xử lý in-place như trước đây. Cache-hit ở backend trả Markdown cũ không re-gate.
  import { createMutation } from '@tanstack/svelte-query';
  import type { AnnualReportResponse } from '@ziweiai/contracts';
  import type { AuthStore } from '$lib/auth/auth-store.svelte';
  import { ApiError } from '$lib/api-client/core';
import { createAnnualReport } from '$lib/api-client/charts';;
  import { PrimaryButton } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import { currentYear } from './fortune-dates';
  import AnnualReportModal from './AnnualReportModal.svelte';

  import { toast } from '$lib/stores/toast';

  interface Props {
    auth: AuthStore;
    chartId: string;
    initialReport?: { markdown: string; year: number } | null;
  }

  let { auth, chartId, initialReport = null }: Props = $props();

  const copy = viCopy.fortune.annual;

  let isModalOpen = $state(false);

  const mutation = createMutation(() => ({
    mutationFn: async (): Promise<AnnualReportResponse> => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new ApiError('unauthorized', viCopy.errors.missingChartContext);
      }
      // Năm tính TƯƠI tại thời điểm bấm (không đóng băng lúc mount): phiên dài qua giao thừa
      // vẫn tạo đúng báo cáo năm hiện tại. Modal hiển thị theo year server trả (mutation.data.year).
      const year = currentYear();
      return createAnnualReport(token, { chartId, year });
    },
    onSuccess: (data): void => {
      isModalOpen = true;
      toast.show(`Đã khởi tạo thành công Báo cáo Vận hạn năm ${data.year}!`, 'success');
    },
  }));

  const activeReport = $derived(mutation.data ?? initialReport);

  const errorMessage = $derived(
    mutation.isError && mutation.error instanceof ApiError
      ? mutation.error.message
      : null,
  );
</script>

<section class="annual" class:has-report={!!activeReport} aria-labelledby="annual-title">
  <div class="annual__header">
    <h3 class="annual__title" id="annual-title">
      <span class="annual-icon">📅</span>
      <span>{copy.title}</span>
    </h3>
    {#if activeReport}
      <span class="annual__ready-badge">✦ Đã lập báo cáo năm {activeReport.year}</span>
    {/if}
  </div>

  {#if activeReport}
    <p class="annual__desc">
      Báo cáo vận hạn năm {activeReport.year} của bạn đã sẵn sàng. Bạn có thể mở lại bất cứ lúc nào để xem chi tiết từng tháng và phương hướng hóa giải.
    </p>
    <div class="annual__action-row">
      <button type="button" class="btn-open-report" onclick={() => (isModalOpen = true)}>
        <span class="btn-icon">📖</span>
        <span>Xem lại Báo Cáo Năm {activeReport.year}</span>
      </button>

      <button
        type="button"
        class="btn-recreate-report"
        disabled={mutation.isPending}
        onclick={() => mutation.mutate()}
        title="Lập lại báo cáo vận hạn mới"
      >
        <span>{mutation.isPending ? 'Đang khởi tạo...' : '🔄 Lập lại'}</span>
      </button>
    </div>
  {:else}
    <PrimaryButton label={copy.generateCta} loading={mutation.isPending} onclick={() => mutation.mutate()} />
  {/if}

  {#if mutation.isPending}
    <p class="annual__status">{copy.loading}</p>
  {:else if errorMessage}
    <p class="annual__error" role="alert">{errorMessage}</p>
  {/if}
</section>

{#if isModalOpen && activeReport}
  <AnnualReportModal markdown={activeReport.markdown} year={activeReport.year} onClose={() => (isModalOpen = false)} />
{/if}

<style>
  .annual {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    align-items: flex-start;
    padding: var(--space-md);
    background: rgba(15, 23, 42, 0.4);
    border-radius: var(--radius-lg, 16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    width: 100%;
    box-sizing: border-box;
  }

  .annual.has-report {
    border-color: rgba(212, 175, 55, 0.35);
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(15, 23, 42, 0.5) 100%);
  }

  .annual__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    flex-wrap: wrap;
    gap: 8px;
  }

  .annual__title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .annual-icon {
    font-size: 18px;
  }

  .annual__ready-badge {
    font-size: 11.5px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 20px;
    background: rgba(46, 204, 113, 0.15);
    border: 1px solid rgba(46, 204, 113, 0.4);
    color: #2ecc71;
  }

  .annual__desc {
    margin: 0;
    font-size: 13.5px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  .annual__action-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 4px;
  }

  .btn-open-report {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 10px;
    background: linear-gradient(135deg, #d4af37 0%, #aa8010 100%);
    color: #0d0f18;
    font-weight: 700;
    font-size: 14px;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(212, 175, 55, 0.3);
    transition: all 0.2s ease;
  }

  .btn-open-report:hover {
    background: linear-gradient(135deg, #ffd700 0%, #c49514 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(212, 175, 55, 0.45);
  }

  .btn-recreate-report {
    display: inline-flex;
    align-items: center;
    padding: 9px 14px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-recreate-report:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary);
  }

  .btn-recreate-report:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .annual__status {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 14px;
  }

  .annual__error {
    margin: 0;
    color: var(--color-accent-danger);
    font-size: 14px;
  }

  /* Dual-Theme: Light Mode */
  :global([data-theme="light"]) .annual {
    background: #ffffff;
    border-color: rgba(180, 83, 9, 0.18);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  }

  :global([data-theme="light"]) .annual.has-report {
    background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
    border-color: rgba(180, 83, 9, 0.35);
  }

  :global([data-theme="light"]) .annual__title {
    color: #78350f;
  }

  :global([data-theme="light"]) .annual__ready-badge {
    background: #ecfdf5;
    border-color: #10b981;
    color: #047857;
  }

  :global([data-theme="light"]) .annual__desc {
    color: #4b5563;
  }

  :global([data-theme="light"]) .btn-open-report {
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(180, 83, 9, 0.25);
  }

  :global([data-theme="light"]) .btn-open-report:hover {
    background: linear-gradient(135deg, #b45309 0%, #92400e 100%);
  }

  :global([data-theme="light"]) .btn-recreate-report {
    background: #f9fafb;
    border-color: #d1d5db;
    color: #374151;
  }

  :global([data-theme="light"]) .btn-recreate-report:hover:not(:disabled) {
    background: #f3f4f6;
  }
</style>
