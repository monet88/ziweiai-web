<script lang="ts">
  // Route Lục Hào (US-007): wrapper mỏng đặt mặc định hệ liu-yao.
  import SystemChartScreen from '$lib/features/dashboard/SystemChartScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<SystemChartScreen
  chartSystem="liu-yao"
  eyebrow={viCopy.liuyao.heroEyebrow}
  title={viCopy.liuyao.heroTitle}
  subtitle={viCopy.liuyao.heroSubtitle}
/>
