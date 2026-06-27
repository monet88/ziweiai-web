<script lang="ts">
  // Route Giải mộng (US-038 / backlog #42): wrapper mỏng cho màn giải mộng. Cờ EXTENDED_SYSTEM_DREAM
  // gate ở backend (POST /dreams/interpret); route luôn render UI, submit mới chạm gate.
  import DreamScreen from '$lib/features/dream/DreamScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<DreamScreen copy={viCopy.dream} />
