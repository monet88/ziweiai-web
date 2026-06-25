<script lang="ts">
  // DivinationForm (US-025): form gieo quẻ cho 4 hệ theo thời điểm. KHÔNG nhập ngày
  // sinh/giới tính — quẻ gieo theo "now" ở server. Người dùng nhập câu hỏi (bắt buộc)
  // + lĩnh vực quan tâm (preset hoặc tự nhập). Lỗi chỉ hiện sau lần submit đầu.
  import { PrimaryButton, FormField, TextInputField, SelectField, NoticeBanner } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import type { DivinationPurposeKey } from '@ziweiai/contracts';
  import type { DivinationModel } from './divination-model.svelte';

  interface Props {
    model: DivinationModel;
  }

  let { model }: Props = $props();

  const copy = viCopy.divination;

  const purposeOptions: { label: string; value: DivinationPurposeKey }[] = [
    { label: copy.purposeCareer, value: 'career' },
    { label: copy.purposeLove, value: 'love' },
    { label: copy.purposeWealth, value: 'wealth' },
    { label: copy.purposeHealth, value: 'health' },
    { label: copy.purposeDecision, value: 'decision' },
    { label: copy.purposeCustom, value: 'custom' },
  ];

  function errorFor(field: 'question' | 'purposeCustom'): string | null {
    return model.submitAttempted ? (model.fieldErrors[field] ?? null) : null;
  }

  function handleSubmit(event: Event): void {
    event.preventDefault();
    model.submit();
  }
</script>

<form class="form" onsubmit={handleSubmit}>
  <FormField label={copy.questionLabel} fieldId="divination-question" errorText={errorFor('question')}>
    {#snippet children({ describedById, invalid })}
      <textarea
        class="question"
        id="divination-question"
        rows="3"
        placeholder={copy.questionPlaceholder}
        value={model.draft.question}
        disabled={model.isSubmitting}
        aria-invalid={invalid}
        aria-describedby={describedById}
        oninput={(event) => model.setField('question', event.currentTarget.value)}
      ></textarea>
    {/snippet}
  </FormField>

  <SelectField
    label={copy.purposeLabel}
    fieldId="divination-purpose"
    value={model.draft.purposeKey}
    options={purposeOptions}
    disabled={model.isSubmitting}
    onValueChange={(value) => model.setField('purposeKey', value as DivinationPurposeKey)}
  />

  {#if model.draft.purposeKey === 'custom'}
    <TextInputField
      label={copy.purposeCustomLabel}
      fieldId="divination-purpose-custom"
      value={model.draft.purposeCustom}
      placeholder={copy.purposeCustomPlaceholder}
      errorText={errorFor('purposeCustom')}
      disabled={model.isSubmitting}
      onValueChange={(value) => model.setField('purposeCustom', value)}
    />
  {/if}

  <p class="cast-hint">{copy.castNowHint}</p>

  {#if model.isError && model.errorMessage}
    <NoticeBanner message={model.errorMessage} tone="danger" />
  {/if}

  <PrimaryButton label={copy.submitButton} type="submit" loading={model.isSubmitting} />
</form>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .question {
    width: 100%;
    box-sizing: border-box;
    padding: var(--space-md);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-xs);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    font-size: 16px;
    font-family: inherit;
    resize: vertical;
  }

  .question::placeholder {
    color: var(--color-text-muted);
  }

  .question:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 1px;
  }

  .question[aria-invalid='true'] {
    border-color: var(--color-accent-danger);
  }

  .question:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .cast-hint {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 13px;
    line-height: 1.4;
  }
</style>
