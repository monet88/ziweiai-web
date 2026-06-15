<script lang="ts">
  // Route Bát Tự (US-007): wrapper mỏng đặt mặc định hệ ba-zi cho luồng tạo lá số chung.
  import SystemChartScreen from '$lib/features/dashboard/SystemChartScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<SystemChartScreen
  chartSystem="ba-zi"
  eyebrow={viCopy.bazi.heroEyebrow}
  title={viCopy.bazi.heroTitle}
  subtitle={viCopy.bazi.heroSubtitle}
/>
