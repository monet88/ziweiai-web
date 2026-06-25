<script lang="ts">
  // Route Đại Lục Nhâm (US-025): gieo quẻ theo thời điểm, dùng DivinationForm.
  import DivinationScreen from '$lib/features/divination/DivinationScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<DivinationScreen
  chartSystem="da-liu-ren"
  eyebrow={viCopy.daliuren.heroEyebrow}
  title={viCopy.daliuren.heroTitle}
  subtitle={viCopy.daliuren.heroSubtitle}
/>
