<script lang="ts">
  // SystemChartScreen: wrapper mỏng cho 5 hệ thuật số khác Tử Vi (US-007). Tái dùng
  // dashboard-model + BirthForm với initialChartSystem riêng — KHÔNG fork logic tạo lá số.
  // Mỗi route hệ (/bazi, /meihua, /liuyao, /daliuren, /qimen) chỉ truyền chartSystem +
  // hero copy riêng; luồng tạo lá số → điều hướng /charts/[id] giữ nguyên (id thật từ API).
  import type { ChartSystem } from '@ziweiai/contracts';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { AppScaffold, PrimaryButton } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import { createDashboardModel } from './dashboard-model.svelte';
  import BirthForm from './BirthForm.svelte';

  interface Props {
    chartSystem: ChartSystem;
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
    <PrimaryButton
      label={viCopy.bazi.returnToDashboard}
      variant="surface"
      onclick={() => goto(resolve('/'))}
    />
  {/snippet}

  <BirthForm {model} />
</AppScaffold>
