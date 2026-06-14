<script lang="ts">
  // Trang chi tiết lá số — bản tối thiểu cho US-005 để điều hướng sau khi tạo lá số
  // không bị 404. US-006 dựng đầy đủ: createQuery fetchChartDetail + vòng 12 cung +
  // luận giải AI. Hiện tại chỉ hiển thị id thật + lối quay về để xác minh luồng điều hướng.
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { AppScaffold, PrimaryButton, SummaryCard } from '$lib/components/ui';
  import { goto } from '$app/navigation';
  import { viCopy } from '$lib/i18n/vi';

  const chartId = $derived(page.params.chartId ?? '');

  const summaryItems = $derived([{ label: viCopy.chart.snapshotId, value: chartId }]);
</script>

<AppScaffold
  eyebrow={viCopy.chart.heroEyebrow}
  title={viCopy.chart.heroTitle}
  subtitle={viCopy.chart.heroSubtitle}
>
  {#snippet action()}
    <PrimaryButton
      label={viCopy.bazi.returnToDashboard}
      variant="surface"
      onclick={() => goto(resolve('/'))}
    />
  {/snippet}

  <SummaryCard title={viCopy.chart.chartSummary} items={summaryItems} />
</AppScaffold>
