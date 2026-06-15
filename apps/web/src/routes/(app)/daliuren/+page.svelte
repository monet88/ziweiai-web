<script lang="ts">
  // Route Đại Lục Nhâm (US-007): wrapper mỏng đặt mặc định hệ da-liu-ren.
  import SystemChartScreen from '$lib/features/dashboard/SystemChartScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<SystemChartScreen
  chartSystem="da-liu-ren"
  eyebrow={viCopy.daliuren.heroEyebrow}
  title={viCopy.daliuren.heroTitle}
  subtitle={viCopy.daliuren.heroSubtitle}
/>
