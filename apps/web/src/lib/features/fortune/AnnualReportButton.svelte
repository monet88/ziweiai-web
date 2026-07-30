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
  }

  let { auth, chartId }: Props = $props();

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
      // Báo cáo năm dùng createMutation (không phải createQuery) — kết quả nằm trong mutation.data,
      // không có query nào cache theo (chartId, year) nên không cần invalidate. Chỉ mở modal.
      isModalOpen = true;
      toast.show(`Đã khởi tạo thành công Báo cáo Vận hạn năm ${data.year}!`, 'success');
    },
  }));

  const errorMessage = $derived(
    mutation.isError && mutation.error instanceof ApiError
      ? mutation.error.message
      : null,
  );
</script>

<section class="annual" aria-labelledby="annual-title">
  <h3 class="annual__title" id="annual-title">{copy.title}</h3>

  <PrimaryButton label={copy.generateCta} loading={mutation.isPending} onclick={() => mutation.mutate()} />
  {#if mutation.isPending}
    <p class="annual__status">{copy.loading}</p>
  {:else if errorMessage}
    <p class="annual__error" role="alert">{errorMessage}</p>
  {/if}
</section>

{#if isModalOpen && mutation.data}
  <AnnualReportModal markdown={mutation.data.markdown} year={mutation.data.year} onClose={() => (isModalOpen = false)} />
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
    border: 1px solid rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .annual__title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    gap: 6px;
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
</style>
