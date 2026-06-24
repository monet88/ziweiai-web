<script lang="ts">
  // Route Tarot (US-017h): wrapper mỏng cho màn rút Tarot. Cờ EXTENDED_SYSTEM_TAROT gate ở backend
  // (POST /draws/tarot); route luôn render UI, submit mới chạm gate. Truyền copy tiếng Việt.
  import TarotScreen from '$lib/features/tarot/TarotScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<TarotScreen copy={viCopy.tarot} />
