<script lang="ts">
  // Route Mai Hoa Dịch Số (US-025): gieo quẻ theo thời điểm, dùng DivinationForm.
  import DivinationScreen from '$lib/features/divination/DivinationScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<DivinationScreen
  chartSystem="mei-hua-yi-shu"
  eyebrow={viCopy.meihua.heroEyebrow}
  title={viCopy.meihua.heroTitle}
  subtitle={viCopy.meihua.heroSubtitle}
/>
