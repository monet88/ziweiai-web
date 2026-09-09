<script lang="ts">
  // Route Tử Vi Đẩu Số: màn lập lá số Tử Vi độc lập, dùng chung SystemChartScreen + BirthForm.
  import SystemChartScreen from '$lib/features/dashboard/SystemChartScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<svelte:head>
  <title>Lập Lá Số Tử Vi Đẩu Số — ViOS</title>
  <meta name="description" content="Lập lá số Tử Vi Đẩu Số 12 cung chính tông và luận giải AI chi tiết." />
</svelte:head>

<SystemChartScreen
  chartSystem="zi-wei-dou-shu"
  eyebrow={viCopy.dashboard.heroEyebrow}
  title="Lập Lá Số Tử Vi Đẩu Số"
  subtitle="Nhập ngày giờ sinh để an sao 12 cung bản vị và nhận luận giải vận hạn cuộc đời chuẩn xác."
/>
