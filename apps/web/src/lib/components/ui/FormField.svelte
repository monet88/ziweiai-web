<script lang="ts">
  import type { Snippet } from 'svelte';

  // FormField: wrapper nhãn + helper/error cho control con. Sinh id ổn định để control
  // con gắn aria-describedby; khi có error đặt aria-invalid ở control (control tự đọc
  // describedById/invalid props). Label gắn `for` qua fieldId.
  interface Props {
    label: string;
    fieldId: string;
    helperText?: string | null;
    errorText?: string | null;
    children: Snippet<[{ describedById: string | undefined; invalid: boolean }]>;
  }

  let { label, fieldId, helperText = null, errorText = null, children }: Props = $props();

  const invalid = $derived(Boolean(errorText));
  // aria-describedby trỏ tới error (ưu tiên) hoặc helper; undefined khi không có mô tả.
  const describedById = $derived(
    errorText ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined,
  );
</script>

<div class="field">
  <label class="label" for={fieldId}>{label}</label>
  {@render children({ describedById, invalid })}
  {#if errorText}
    <p class="message error" id="{fieldId}-error" role="alert">{errorText}</p>
  {:else if helperText}
    <p class="message helper" id="{fieldId}-helper">{helperText}</p>
  {/if}
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .label {
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.2px;
  }

  .message {
    margin: 0;
    font-size: 12px;
    line-height: 18px;
  }

  .message.helper {
    color: var(--color-text-muted);
  }

  .message.error {
    color: var(--color-accent-danger);
  }
</style>
