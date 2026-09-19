<script lang="ts">
  // Route Đọc bài Tarot qua ảnh (Vision Tarot). Cờ EXTENDED_SYSTEM_TAROT gate
  // ở backend (POST /vision/tarot); route luôn render UI, submit mới chạm gate. Truyền kind + copy.
  import VisionScreen from '$lib/features/vision/VisionScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<VisionScreen kind="tarot" copy={viCopy.visionTarot} />
