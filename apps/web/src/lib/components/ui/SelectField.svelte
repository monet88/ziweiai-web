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
    /** Nhãn placeholder hiển thị khi chưa chọn (value=''). Render thành <option> rỗng
     * disabled ở đầu danh sách để bắt người dùng chọn thật, không nhận giá trị mặc định. */
    placeholder?: string | null;
    helperText?: string | null;
    errorText?: string | null;
    disabled?: boolean;
    /** Callback một chiều: nhận value mới khi người dùng đổi lựa chọn. Dùng cho form
     * giữ state bất biến ở model (setField) thay vì bind hai chiều vào getter. */
    onValueChange?: (value: string) => void;
  }

  let {
    label,
    fieldId,
    value = $bindable(''),
    options,
    placeholder = null,
    helperText = null,
    errorText = null,
    disabled = false,
    onValueChange,
  }: Props = $props();
</script>

<FormField {label} {fieldId} {helperText} {errorText}>
  {#snippet children({ describedById, invalid })}
    <div class="select-shell">
      <select
        class="select"
        id={fieldId}
        bind:value
        {disabled}
        aria-invalid={invalid}
        aria-describedby={describedById}
        onchange={(event) => onValueChange?.(event.currentTarget.value)}
      >
        {#if placeholder}
          <option value="" disabled>{placeholder}</option>
        {/if}
        {#each options as option (option.value)}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
      <svg class="select-chevron" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <path d="M5.5 7.5 10 12l4.5-4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
  {/snippet}
</FormField>

<style>
  /* Bọc select để đặt chevron tuỳ biến lên trên; bỏ mũi tên native của trình duyệt
     (vốn to, lệch theme và chiếm chỗ khiến nhãn bị cắt ở cột hẹp). */
  .select-shell {
    position: relative;
    display: block;
  }

  .select {
    width: 100%;
    box-sizing: border-box;
    padding: var(--space-md) calc(var(--space-md) + 18px) var(--space-md) var(--space-md);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    font-size: 16px;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    text-overflow: ellipsis;
  }

  /* Chevron tĩnh, không nhận chuột để click vẫn rơi vào <select> bên dưới. */
  .select-chevron {
    position: absolute;
    top: 50%;
    right: var(--space-md);
    width: 18px;
    height: 18px;
    transform: translateY(-50%);
    color: var(--color-text-muted);
    pointer-events: none;
  }

  .select:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 1px;
  }

  .select[aria-invalid='true'] {
    border-color: var(--color-accent-danger);
  }

  .select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Ẩn mũi tên mặc định trên IE/Edge legacy (appearance chưa đủ ở một số engine cũ). */
  .select::-ms-expand {
    display: none;
  }
</style>
