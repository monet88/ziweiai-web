<script lang="ts">
  // Route Mai Hoa Dịch Số (US-007): wrapper mỏng đặt mặc định hệ mei-hua-yi-shu.
  import SystemChartScreen from '$lib/features/dashboard/SystemChartScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<SystemChartScreen
  chartSystem="mei-hua-yi-shu"
  eyebrow={viCopy.meihua.heroEyebrow}
  title={viCopy.meihua.heroTitle}
  subtitle={viCopy.meihua.heroSubtitle}
/>
