<script lang="ts">
  // DivinationScreen (US-025): wrapper mỏng cho 4 hệ gieo quẻ theo thời điểm. Thay
  // SystemChartScreen/BirthForm bằng DivinationForm — không nhập ngày sinh, quẻ gieo
  // theo "now" ở server. Mỗi route truyền chartSystem + hero copy riêng.
  import type { DivinationChartSystem } from '@ziweiai/contracts';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { AppScaffold } from '$lib/components/ui';
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
  <DivinationForm {model} />
</AppScaffold>
