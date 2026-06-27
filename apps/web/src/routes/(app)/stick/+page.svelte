<script lang="ts">
  // Route Xin xăm (US-039 / backlog #47): wrapper mỏng cho màn xin quẻ. Cờ EXTENDED_SYSTEM_STICKS
  // gate ở backend (POST /draws/stick); route luôn render UI, submit mới chạm gate. Truyền copy Việt.
  import StickScreen from '$lib/features/stick/StickScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<StickScreen copy={viCopy.stick} />
