<script lang="ts">
  import ChuVanVuongScreen from '$lib/features/chuvanvuong/ChuVanVuongScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<svelte:head>
  <title>Quẻ Chu Văn Vương • Thần Đoán 64 Quẻ Kinh Dịch • ViOS</title>
  <meta
    name="description"
    content="Gieo quẻ Chu Văn Vương 64 quẻ thần đoán để thấu suốt lý lẽ âm dương, dự đoán thời vận, cơ hội và hướng giải quyết cho tài lộc, công danh, gia đạo, sức khỏe."
  />
</svelte:head>

<ChuVanVuongScreen copy={viCopy.chuvanvuong} />
