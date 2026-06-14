<script lang="ts">
  // Trang chi tiết lá số (US-006). Bọc ChartDetailScreen trong {#key chartId}: khi điều
  // hướng sang lá số khác, chartId đổi → block remount → model chi tiết + luận giải tạo
  // lại từ đầu, selectedPalaceKey về null (reset đúng). KHÔNG dùng $effect ghi ngược state.
  import { page } from '$app/state';
  import ChartDetailScreen from '$lib/features/chart/ChartDetailScreen.svelte';

  const chartId = $derived(page.params.chartId ?? '');
</script>

{#key chartId}
  <ChartDetailScreen {chartId} />
{/key}
