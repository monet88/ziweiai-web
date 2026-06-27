<script lang="ts">
  // Route Lenormand (US-037): wrapper mỏng cho màn rút bài Lenormand. Cờ EXTENDED_SYSTEM_LENORMAND
  // gate ở backend (POST /draws/lenormand); route luôn render UI, submit mới chạm gate. Truyền copy
  // tiếng Việt.
  import LenormandScreen from '$lib/features/lenormand/LenormandScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<LenormandScreen copy={viCopy.lenormand} />
