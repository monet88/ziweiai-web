<script lang="ts">
  // Trang lịch sử lá số đầy đủ (US-007). Bọc HistoryList trong AppScaffold; nút quay về
  // trang chính. Route nằm trong nhóm (app) → đã được +layout.svelte guard đăng nhập.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { AppScaffold, PrimaryButton } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import HistoryList from '$lib/features/history/HistoryList.svelte';
</script>

<svelte:head>
  <title>{viCopy.history.heroTitle} - ziweiai</title>
</svelte:head>

<AppScaffold
  eyebrow={viCopy.history.heroEyebrow}
  title={viCopy.history.heroTitle}
  subtitle={viCopy.history.heroSubtitle}
>
  {#snippet action()}
    <PrimaryButton
      label={viCopy.history.backToDashboard}
      variant="surface"
      onclick={() => goto(resolve('/'))}
    />
  {/snippet}

  <HistoryList />
</AppScaffold>
