<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import FormField from './FormField.svelte';

  // TextInputField: input có nhãn + helper/error, value qua $bindable. Svelte cấm `type`
  // động khi dùng bind:value, nên branch markup theo type tĩnh (text/email/password/number);
  // các thuộc tính chung gom qua spread đối tượng shared.
  //
  // type="number": KHÔNG dùng bind:value — Svelte ép kiểu sang number/null trên input số,
  // phá hợp đồng `value: string` (rỗng → null/NaN) và gây nhảy con trỏ khi reformat. Thay
  // bằng value một chiều + gán thủ công chuỗi DOM trong oninput, giữ value luôn là string.
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
    /** Callback một chiều: nhận value mới khi người dùng gõ. Dùng cho form giữ state
     * bất biến ở model (setField) thay vì bind hai chiều vào getter. */
    onValueChange?: (value: string) => void;
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
    onValueChange,
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
        oninput={(event) => onValueChange?.(event.currentTarget.value)}
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
        oninput={(event) => onValueChange?.(event.currentTarget.value)}
      />
    {:else if type === 'number'}
      <!-- step="any": bỏ ràng buộc bước nhảy mặc định (step=1) của browser, vốn coi số thập
           phân (vĩ độ/kinh độ như 10.762622) là invalid và chặn submit im lặng. Nguồn validation
           thật là validateBirthFormDraft (client) + Zod (backend); browser không phải nguồn. -->
      <input
        class="input"
        id={fieldId}
        type="number"
        step="any"
        {value}
        {placeholder}
        inputmode={inputmode ?? 'numeric'}
        {disabled}
        {required}
        aria-invalid={invalid}
        aria-describedby={describedById}
        oninput={(event) => {
          value = event.currentTarget.value;
          onValueChange?.(event.currentTarget.value);
        }}
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
        oninput={(event) => onValueChange?.(event.currentTarget.value)}
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
