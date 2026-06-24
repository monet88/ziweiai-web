<script lang="ts">
  // SystemChartScreen: wrapper mỏng cho 5 hệ thuật số khác Tử Vi (US-007). Tái dùng
  // dashboard-model + BirthForm với initialChartSystem riêng — KHÔNG fork logic tạo lá số.
  // Mỗi route hệ (/bazi, /meihua, /liuyao, /daliuren, /qimen) chỉ truyền chartSystem +
  // hero copy riêng; luồng tạo lá số → điều hướng /charts/[id] giữ nguyên (id thật từ API).
  import type { ImplementedChartSystem } from '@ziweiai/contracts';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { resolve } from '$app/paths';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { AppScaffold } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import { createDashboardModel } from './dashboard-model.svelte';
  import BirthForm from './BirthForm.svelte';

  interface Props {
    chartSystem: ImplementedChartSystem;
    eyebrow: string;
    title: string;
    subtitle: string;
  }

  let { chartSystem, eyebrow, title, subtitle }: Props = $props();

  const auth = getAuthStore();
  const queryClient = useQueryClient();

  // Model khởi tạo một lần với hệ của route (factory runes). ChartSystemPicker trong
  // BirthForm vẫn cho đổi hệ thủ công nếu người dùng muốn — wrapper chỉ đặt mặc định.
  // chartSystem là prop hằng theo route (mỗi route truyền literal cố định) nên chỉ cần
  // giá trị khởi tạo; capture initial là đúng ý, không cần theo dõi thay đổi.
  // svelte-ignore state_referenced_locally
  const model = createDashboardModel({ auth, queryClient, initialChartSystem: chartSystem });
</script>

<AppScaffold {eyebrow} {title} {subtitle}>
  {#snippet action()}
    <a href={resolve('/')} class="back-link">
      &larr; {viCopy.bazi.returnToDashboard}
    </a>
  {/snippet}

  <BirthForm {model} />
</AppScaffold>

<style>
  .back-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-full);
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

  /* Touch: nâng back-link lên 44px khi con trỏ thô — ngưỡng AAA (WCAG 2.5.5), vượt AA 24px. */
  @media (pointer: coarse) {
    .back-link {
      min-height: 44px;
      padding: var(--space-sm) var(--space-md);
    }
  }
</style>
