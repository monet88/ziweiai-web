<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { appendReferralQuery } from '$lib/features/referral/append-referral-query';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }
  let { data }: Props = $props();

  onMount(() => {
    // Redirect to the actual app route for the chart; keep safe ?ref= for referral capture.
    const target = appendReferralQuery(
      `/charts/${page.params.chartId}`,
      page.url.searchParams.get('ref'),
    );
    window.location.replace(target);
  });
</script>

<svelte:head>
  <title>{data.meta.title}</title>
  <meta name="description" content={data.meta.description} />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content={data.meta.url} />
  <meta property="og:title" content={data.meta.title} />
  <meta property="og:description" content={data.meta.description} />
  <meta property="og:image" content={data.meta.ogImage} />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content={data.meta.url} />
  <meta name="twitter:title" content={data.meta.title} />
  <meta name="twitter:description" content={data.meta.description} />
  <meta name="twitter:image" content={data.meta.ogImage} />
</svelte:head>

<div style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: var(--color-bg-body); color: var(--color-text-primary); font-family: sans-serif;">
  <p>Đang chuyển hướng đến lá số...</p>
</div>
