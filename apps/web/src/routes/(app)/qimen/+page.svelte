<script lang="ts">
  // Route Kỳ Môn Độn Giáp (US-025): gieo quẻ theo thời điểm, dùng DivinationForm.
  import DivinationScreen from '$lib/features/divination/DivinationScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<DivinationScreen
  chartSystem="qi-men-dun-jia"
  eyebrow={viCopy.qimen.heroEyebrow}
  title={viCopy.qimen.heroTitle}
  subtitle={viCopy.qimen.heroSubtitle}
/>
