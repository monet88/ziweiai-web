<script lang="ts">
  // ChartSystemPicker: chọn hệ lá số cho POST /charts. Danh sách chỉ gồm hệ đã có adapter,
  // nhãn tiếng Việt từ viCopy.chartSystem (bất biến ngôn ngữ — không chữ Hán).
  // Dùng SelectField gốc để thừa hưởng a11y keyboard sẵn có.
  //
  // State một chiều: value là prop đọc-only (model giữ draft.chartSystem), đổi lựa chọn
  // đẩy ra qua onchange → model.setField. KHÔNG $effect đồng bộ ngược (tránh vòng lặp).
  import type { ImplementedChartSystem } from '@ziweiai/contracts';
  import { SelectField } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import { getDashboardPickerSystems } from '$lib/features/system-registry/chart-system-registry';

  interface Props {
    value: ImplementedChartSystem;
    disabled?: boolean;
    onchange: (system: ImplementedChartSystem) => void;
  }

  let { value, disabled = false, onchange }: Props = $props();

  // US-017d: ẩn các hệ mở rộng gate-by-flag (Mạnh Phái) khỏi danh sách mặc định để dashboard
  // không mời gọi POST /charts vào hệ chưa bật (fail-closed). Vẫn giữ hệ đang là value hiện tại
  // (vd vào trực tiếp từ /mangpai) để SelectField hiển thị đúng lựa chọn. Reactive theo value.
  const options = $derived(
    getDashboardPickerSystems(value).map((system) => ({
      label: viCopy.chartSystem[system],
      value: system,
    })),
  );

  // value mới luôn nằm trong implementedChartSystems vì options sinh từ chính danh sách đó.
  function handleChange(next: string): void {
    onchange(next as ImplementedChartSystem);
  }
</script>

<SelectField
  label={viCopy.dashboard.chartSystem}
  fieldId="dashboard-chart-system"
  {value}
  {options}
  {disabled}
  onValueChange={handleChange}
/>
