<script lang="ts">
  // Route Xem Tay (US-017f): wrapper mỏng cho màn luận giải vision. Cờ EXTENDED_SYSTEM_PALM gate ở
  // backend (POST /vision/palm); route luôn render UI, submit mới chạm gate. Truyền kind + copy.
  import VisionScreen from '$lib/features/vision/VisionScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<VisionScreen kind="palm" copy={viCopy.palm} />
