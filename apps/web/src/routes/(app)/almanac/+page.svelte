<script lang="ts">
  // Route Hoàng lịch (US-040 / backlog #48): wrapper mỏng cho màn chọn ngày tốt. Cờ
  // EXTENDED_SYSTEM_ALMANAC gate ở backend (POST /almanac/select); route luôn render UI, submit mới
  // chạm gate. Truyền copy Việt.
  import AlmanacScreen from '$lib/features/almanac/AlmanacScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<AlmanacScreen copy={viCopy.almanac} />
