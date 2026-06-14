<script lang="ts">
  // ChartSystemPicker: chọn hệ lá số. Danh sách hệ lấy từ contracts (chartSystems),
  // nhãn tiếng Việt từ viCopy.chartSystem (bất biến ngôn ngữ — không chữ Hán).
  // Dùng SelectField gốc để thừa hưởng a11y keyboard sẵn có.
  //
  // State một chiều: value là prop đọc-only (model giữ draft.chartSystem), đổi lựa chọn
  // đẩy ra qua onchange → model.setField. KHÔNG $effect đồng bộ ngược (tránh vòng lặp).
  import type { ChartSystem } from '@ziweiai/contracts';
  import { chartSystems } from '@ziweiai/contracts';
  import { SelectField } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';

  interface Props {
    value: ChartSystem;
    disabled?: boolean;
    onchange: (system: ChartSystem) => void;
  }

  let { value, disabled = false, onchange }: Props = $props();

  const options = chartSystems.map((system) => ({
    label: viCopy.chartSystem[system],
    value: system,
  }));

  // value mới luôn nằm trong chartSystems vì options sinh từ chính danh sách đó.
  function handleChange(next: string): void {
    onchange(next as ChartSystem);
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
