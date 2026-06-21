<script lang="ts">
  // Route Mạnh Phái (US-017d): wrapper mỏng đặt mặc định hệ 'mangpai' cho luồng tạo lá số chung
  // (POST /charts). Cờ EXTENDED_SYSTEM_MANGPAI gate ở backend; vào trực tiếp route này luôn render
  // form, submit mới chạm gate (403 nếu cờ tắt). Lối vào trên dashboard mới ẩn/hiện theo GET /features.
  import SystemChartScreen from '$lib/features/dashboard/SystemChartScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<SystemChartScreen
  chartSystem="mangpai"
  eyebrow={viCopy.mangpai.heroEyebrow}
  title={viCopy.mangpai.heroTitle}
  subtitle={viCopy.mangpai.heroSubtitle}
/>
