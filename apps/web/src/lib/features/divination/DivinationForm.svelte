<script lang="ts">
  // DivinationForm (US-025/US-026): form gieo quẻ cho 4 hệ theo thời điểm. KHÔNG nhập ngày
  // sinh/giới tính. Mặc định gieo theo "now". Mai Hoa + Lục Hào (canManualCast) thêm lựa chọn
  // gieo thủ công: Mai Hoa nhập 2 số, Lục Hào chọn 6 hào. Lỗi chỉ hiện sau lần submit đầu.
  import { PrimaryButton, FormField, TextInputField, SelectField, NoticeBanner } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import type { DivinationCastMethod, DivinationPurposeKey, LiuyaoLineStateKey } from '@ziweiai/contracts';
  import type { DivinationModel } from './divination-model.svelte';

  interface Props {
    model: DivinationModel;
  }

  let { model }: Props = $props();

  const copy = viCopy.divination;
  // chartSystem là prop hằng theo route; derive để khỏi cảnh báo state_referenced_locally.
  const isMeihua = $derived(model.chartSystem === 'mei-hua-yi-shu');
  const isLiuyao = $derived(model.chartSystem === 'liu-yao');

  const purposeOptions: { label: string; value: DivinationPurposeKey }[] = [
    { label: copy.purposeCareer, value: 'career' },
    { label: copy.purposeLove, value: 'love' },
    { label: copy.purposeWealth, value: 'wealth' },
    { label: copy.purposeHealth, value: 'health' },
    { label: copy.purposeDecision, value: 'decision' },
    { label: copy.purposeCustom, value: 'custom' },
  ];

  const castMethodOptions = $derived<{ label: string; value: DivinationCastMethod }[]>([
    { label: copy.castMethodTime, value: 'time' },
    {
      label: isMeihua ? copy.castMethodManualMeihua : copy.castMethodManualLiuyao,
      value: 'manual',
    },
  ]);

  const lineOptions: { label: string; value: LiuyaoLineStateKey }[] = [
    { label: copy.liuyaoYoungYang, value: 'youngYang' },
    { label: copy.liuyaoYoungYin, value: 'youngYin' },
    { label: copy.liuyaoOldYang, value: 'oldYang' },
    { label: copy.liuyaoOldYin, value: 'oldYin' },
  ];

  function errorFor(field: 'question' | 'purposeCustom' | 'meihuaUpper' | 'meihuaLower'): string | null {
    return model.submitAttempted ? (model.fieldErrors[field] ?? null) : null;
  }

  function lineLabel(position: number): string {
    return copy.liuyaoLineLabel.replace('{position}', String(position));
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

  {#if model.canManualCast}
    <SelectField
      label={copy.castMethodLabel}
      fieldId="divination-cast-method"
      value={model.draft.castMethod}
      options={castMethodOptions}
      disabled={model.isSubmitting}
      onValueChange={(value) => model.setField('castMethod', value as DivinationCastMethod)}
    />
  {/if}

  {#if model.canManualCast && model.draft.castMethod === 'manual' && isMeihua}
    <div class="grid-2">
      <TextInputField
        label={copy.meihuaUpperLabel}
        fieldId="divination-meihua-upper"
        type="number"
        value={model.draft.meihuaUpper}
        placeholder={copy.meihuaNumberPlaceholder}
        errorText={errorFor('meihuaUpper')}
        disabled={model.isSubmitting}
        onValueChange={(value) => model.setField('meihuaUpper', value)}
      />
      <TextInputField
        label={copy.meihuaLowerLabel}
        fieldId="divination-meihua-lower"
        type="number"
        value={model.draft.meihuaLower}
        placeholder={copy.meihuaNumberPlaceholder}
        errorText={errorFor('meihuaLower')}
        disabled={model.isSubmitting}
        onValueChange={(value) => model.setField('meihuaLower', value)}
      />
    </div>
    <p class="cast-hint">{copy.manualNumberHint}</p>
  {/if}

  {#if model.canManualCast && model.draft.castMethod === 'manual' && isLiuyao}
    <fieldset class="lines">
      <legend class="lines-legend">{copy.liuyaoLinesLabel}</legend>
      {#each model.draft.liuyaoLines as line, index (index)}
        <SelectField
          label={lineLabel(index + 1)}
          fieldId={`divination-liuyao-line-${index + 1}`}
          value={line}
          options={lineOptions}
          disabled={model.isSubmitting}
          onValueChange={(value) => model.setLiuyaoLine(index, value as LiuyaoLineStateKey)}
        />
      {/each}
    </fieldset>
    <p class="cast-hint">{copy.liuyaoLinesHint}</p>
  {/if}

  {#if !model.canManualCast || model.draft.castMethod === 'time'}
    <p class="cast-hint">{copy.castNowHint}</p>
  {/if}

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

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-md);
  }

  .lines {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-md);
    margin: 0;
    padding: 0;
    border: 0;
  }

  .lines-legend {
    grid-column: 1 / -1;
    padding: 0;
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.2px;
  }

  .cast-hint {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 13px;
    line-height: 1.4;
  }

  @media (max-width: 480px) {
    .grid-2,
    .lines {
      grid-template-columns: 1fr;
    }
  }
</style>
