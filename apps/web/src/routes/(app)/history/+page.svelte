<script lang="ts">
  // Trang lịch sử lá số đầy đủ (US-007). Bọc HistoryList trong AppScaffold; nút quay về
  // trang chính. Route nằm trong nhóm (app) → đã được +layout.svelte guard đăng nhập.
  import { AppScaffold } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import HistoryList from '$lib/features/history/HistoryList.svelte';
</script>

<svelte:head>
  <title>{viCopy.history.heroTitle} - ViOS</title>
</svelte:head>

<AppScaffold
  eyebrow={viCopy.history.heroEyebrow}
  title={viCopy.history.heroTitle}
  subtitle={viCopy.history.heroSubtitle}
>
  <HistoryList />
</AppScaffold>
