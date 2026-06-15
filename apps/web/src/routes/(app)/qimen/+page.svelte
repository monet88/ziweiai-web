<script lang="ts">
  // Route Kỳ Môn Độn Giáp (US-007): wrapper mỏng đặt mặc định hệ qi-men-dun-jia.
  import SystemChartScreen from '$lib/features/dashboard/SystemChartScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<SystemChartScreen
  chartSystem="qi-men-dun-jia"
  eyebrow={viCopy.qimen.heroEyebrow}
  title={viCopy.qimen.heroTitle}
  subtitle={viCopy.qimen.heroSubtitle}
/>
