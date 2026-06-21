<script lang="ts">
  // Route Xem Tướng (US-017e): wrapper mỏng cho màn luận giải vision. Cờ EXTENDED_SYSTEM_FACE gate
  // ở backend (POST /vision/face); route luôn render UI, submit mới chạm gate. Truyền kind + copy.
  import VisionScreen from '$lib/features/vision/VisionScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<VisionScreen kind="face" copy={viCopy.face} />
