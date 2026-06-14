<script lang="ts">
  import FormField from './FormField.svelte';

  // SelectField: <select> có nhãn + helper/error, value qua $bindable. Dùng <select> gốc
  // (a11y keyboard sẵn có) thay vì dựng dropdown tuỳ biến. Options là {label,value}.
  interface SelectOption {
    label: string;
    value: string;
  }

  interface Props {
    label: string;
    fieldId: string;
    value: string;
    options: readonly SelectOption[];
    helperText?: string | null;
    errorText?: string | null;
    disabled?: boolean;
  }

  let {
    label,
    fieldId,
    value = $bindable(''),
    options,
    helperText = null,
    errorText = null,
    disabled = false,
  }: Props = $props();
</script>

<FormField {label} {fieldId} {helperText} {errorText}>
  {#snippet children({ describedById, invalid })}
    <select
      class="select"
      id={fieldId}
      bind:value
      {disabled}
      aria-invalid={invalid}
      aria-describedby={describedById}
    >
      {#each options as option (option.value)}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  {/snippet}
</FormField>

<style>
  .select {
    width: 100%;
    box-sizing: border-box;
    padding: var(--space-md);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    font-size: 16px;
    cursor: pointer;
  }

  .select:focus-visible {
    outline: 2px solid var(--color-accent-gold-soft);
    outline-offset: 1px;
  }

  .select[aria-invalid='true'] {
    border-color: var(--color-accent-danger);
  }

  .select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
