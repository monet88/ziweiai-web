<script lang="ts">
  import NumerologyScreen from '$lib/features/numerology/NumerologyScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<svelte:head>
  <title>{viCopy.numerology.heroTitle} — ViOS</title>
  <meta name="description" content={viCopy.numerology.heroSubtitle} />
</svelte:head>

<NumerologyScreen copy={viCopy.numerology} />
