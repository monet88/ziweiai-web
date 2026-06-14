<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import FormField from './FormField.svelte';

  // TextInputField: input có nhãn + helper/error, value qua $bindable. Svelte cấm `type`
  // động khi dùng bind:value, nên branch markup theo type tĩnh (text/email/password/number);
  // các thuộc tính chung gom qua spread đối tượng shared.
  interface Props {
    label: string;
    fieldId: string;
    value: string;
    type?: 'text' | 'email' | 'password' | 'number';
    placeholder?: string;
    autocomplete?: HTMLInputAttributes['autocomplete'];
    inputmode?: 'text' | 'email' | 'numeric' | 'decimal';
    helperText?: string | null;
    errorText?: string | null;
    disabled?: boolean;
    required?: boolean;
  }

  let {
    label,
    fieldId,
    value = $bindable(''),
    type = 'text',
    placeholder,
    autocomplete,
    inputmode,
    helperText = null,
    errorText = null,
    disabled = false,
    required = false,
  }: Props = $props();
</script>

<FormField {label} {fieldId} {helperText} {errorText}>
  {#snippet children({ describedById, invalid })}
    {#if type === 'email'}
      <input
        class="input"
        id={fieldId}
        type="email"
        bind:value
        {placeholder}
        {autocomplete}
        {inputmode}
        {disabled}
        {required}
        aria-invalid={invalid}
        aria-describedby={describedById}
      />
    {:else if type === 'password'}
      <input
        class="input"
        id={fieldId}
        type="password"
        bind:value
        {placeholder}
        {autocomplete}
        {disabled}
        {required}
        aria-invalid={invalid}
        aria-describedby={describedById}
      />
    {:else if type === 'number'}
      <input
        class="input"
        id={fieldId}
        type="number"
        bind:value
        {placeholder}
        inputmode={inputmode ?? 'numeric'}
        {disabled}
        {required}
        aria-invalid={invalid}
        aria-describedby={describedById}
      />
    {:else}
      <input
        class="input"
        id={fieldId}
        type="text"
        bind:value
        {placeholder}
        {autocomplete}
        {inputmode}
        {disabled}
        {required}
        aria-invalid={invalid}
        aria-describedby={describedById}
      />
    {/if}
  {/snippet}
</FormField>

<style>
  .input {
    width: 100%;
    box-sizing: border-box;
    padding: var(--space-md);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    font-size: 16px;
  }

  .input::placeholder {
    color: var(--color-text-muted);
  }

  .input:focus-visible {
    outline: 2px solid var(--color-accent-gold-soft);
    outline-offset: 1px;
  }

  .input[aria-invalid='true'] {
    border-color: var(--color-accent-danger);
  }

  .input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
