<script lang="ts">
  // Trang gói dịch vụ (US-010). Đích đến của CTA "Nâng cấp" khi gate luận giải AI bật
  // (402 PAYMENT_REQUIRED). Giai đoạn này billing thật chưa có (decision 0010) nên chỉ là
  // placeholder "sắp ra mắt"; route nằm trong nhóm (app) → đã được +layout.svelte guard.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { AppScaffold, PrimaryButton, EmptyStateCard } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';

  const copy = viCopy.pricing;
</script>

<AppScaffold eyebrow={copy.heroEyebrow} title={copy.heroTitle} subtitle={copy.heroSubtitle}>
  {#snippet action()}
    <PrimaryButton
      label={copy.backToDashboard}
      variant="surface"
      onclick={() => goto(resolve('/'))}
    />
  {/snippet}

  <EmptyStateCard title={copy.comingSoonTitle} description={copy.comingSoonDescription} />
</AppScaffold>
