<script lang="ts">
  // AnnualReportButton (US-016): nút tạo báo cáo năm + modal Markdown. Dùng createMutation gọi
  // createAnnualReport (token đọc TƯƠI trong mutationFn, bất biến §3). Khi nhận 402
  // (kind='payment-required') → render CTA paywall (điều hướng /pricing) thay vì nút tạo,
  // KHÔNG copy logic gate (chỉ trình bày). Cache-hit ở backend trả Markdown cũ không re-gate.
  import { createMutation } from '@tanstack/svelte-query';
  import type { AnnualReportResponse } from '@ziweiai/contracts';
  import type { AuthStore } from '$lib/auth/auth-store.svelte';
  import { ApiError, createAnnualReport } from '$lib/api-client';
  import { PrimaryButton } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { currentYear } from './fortune-dates';
  import AnnualReportModal from './AnnualReportModal.svelte';

  interface Props {
    auth: AuthStore;
    chartId: string;
  }

  let { auth, chartId }: Props = $props();

  const copy = viCopy.fortune.annual;
  const year = currentYear();

  let isModalOpen = $state(false);

  const mutation = createMutation(() => ({
    mutationFn: async (): Promise<AnnualReportResponse> => {
      const token = auth.getAccessToken();
      if (!token) {
        throw new ApiError('unauthorized', viCopy.errors.missingChartContext);
      }
      return createAnnualReport(token, { chartId, year });
    },
    onSuccess: (): void => {
      // Báo cáo năm dùng createMutation (không phải createQuery) — kết quả nằm trong mutation.data,
      // không có query nào cache theo (chartId, year) nên không cần invalidate. Chỉ mở modal.
      isModalOpen = true;
    },
  }));

  // 402 PAYMENT_REQUIRED: backend gộp cả hai lý do (chưa entitled / cờ beta off) vào một mã.
  // Phân biệt thông điệp qua message backend, fallback featureLockedBeta để giữ ngôn ngữ Việt.
  const isPaymentRequired = $derived(
    mutation.isError && mutation.error instanceof ApiError && mutation.error.kind === 'payment-required',
  );
  const paywallMessage = $derived(
    mutation.error instanceof ApiError && mutation.error.message.length > 0
      ? mutation.error.message
      : copy.featureLockedBeta,
  );
  const errorMessage = $derived(
    mutation.isError && !isPaymentRequired && mutation.error instanceof ApiError
      ? mutation.error.message
      : null,
  );
</script>

<section class="annual" aria-labelledby="annual-title">
  <h3 class="annual__title" id="annual-title">{copy.title}</h3>

  {#if isPaymentRequired}
    <p class="annual__hint">{paywallMessage}</p>
    <PrimaryButton label={copy.paywallCta} variant="gold" onclick={() => goto(resolve('/pricing'))} />
    <p class="annual__hint">{copy.paywallHint}</p>
  {:else}
    <PrimaryButton label={copy.generateCta} loading={mutation.isPending} onclick={() => mutation.mutate()} />
    {#if mutation.isPending}
      <p class="annual__status">{copy.loading}</p>
    {:else if errorMessage}
      <p class="annual__error" role="alert">{errorMessage}</p>
    {/if}
  {/if}
</section>

{#if isModalOpen && mutation.data}
  <AnnualReportModal markdown={mutation.data.markdown} {year} onClose={() => (isModalOpen = false)} />
{/if}

<style>
  .annual {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    align-items: flex-start;
  }

  .annual__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .annual__hint {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 14px;
  }

  .annual__status {
    margin: 0;
    color: var(--color-text-secondary);
  }

  .annual__error {
    margin: 0;
    color: var(--color-danger, #c0392b);
  }
</style>
