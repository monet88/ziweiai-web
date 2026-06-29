<script lang="ts">
  // DivinationScreen (US-025): wrapper mỏng cho 4 hệ gieo quẻ theo thời điểm. Thay
  // SystemChartScreen/BirthForm bằng DivinationForm — không nhập ngày sinh, quẻ gieo
  // theo "now" ở server. Mỗi route truyền chartSystem + hero copy riêng.
  import type { DivinationChartSystem } from '@ziweiai/contracts';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { resolve } from '$app/paths';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { AppScaffold } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import { createDivinationModel } from './divination-model.svelte';
  import DivinationForm from './DivinationForm.svelte';

  interface Props {
    chartSystem: DivinationChartSystem;
    eyebrow: string;
    title: string;
    subtitle: string;
  }

  let { chartSystem, eyebrow, title, subtitle }: Props = $props();

  const auth = getAuthStore();
  const queryClient = useQueryClient();

  // chartSystem là prop hằng theo route nên chỉ cần giá trị khởi tạo (capture initial).
  // svelte-ignore state_referenced_locally
  const model = createDivinationModel({ auth, queryClient, chartSystem });
</script>

<AppScaffold {eyebrow} {title} {subtitle}>
  {#snippet action()}
    <a href={resolve('/')} class="back-link">
      &larr; {viCopy.divination.returnToDashboard}
    </a>
  {/snippet}

  <DivinationForm {model} />
</AppScaffold>

<style>
  .back-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    transition:
      color 150ms ease,
      border-color 150ms ease,
      background-color 150ms ease;
  }

  .back-link:hover {
    color: var(--color-text-primary);
    border-color: var(--color-text-muted);
    background: var(--color-bg-surface);
  }

  .back-link:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }

  @media (pointer: coarse) {
    .back-link {
      min-height: 44px;
      padding: var(--space-sm) var(--space-md);
    }
  }
</style>
