<script lang="ts">
  // Route Lục Hào (US-025): gieo quẻ theo thời điểm, dùng DivinationForm.
  import DivinationScreen from '$lib/features/divination/DivinationScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<DivinationScreen
  chartSystem="liu-yao"
  eyebrow={viCopy.liuyao.heroEyebrow}
  title={viCopy.liuyao.heroTitle}
  subtitle={viCopy.liuyao.heroSubtitle}
/>
