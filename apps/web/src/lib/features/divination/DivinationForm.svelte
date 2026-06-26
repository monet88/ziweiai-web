<script lang="ts">
  // DivinationForm (US-025/US-026): form gieo quẻ cho 4 hệ theo thời điểm. KHÔNG nhập ngày
  // sinh/giới tính. Mặc định gieo theo "now". Mai Hoa + Lục Hào (canManualCast) thêm lựa chọn
  // gieo thủ công: Mai Hoa nhập 2 số, Lục Hào chọn 6 hào. Lỗi chỉ hiện sau lần submit đầu.
  import { PrimaryButton, FormField, TextInputField, SelectField, NoticeBanner } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import type { DivinationCastMethod, DivinationPurposeKey, LiuyaoLineStateKey } from '@ziweiai/contracts';
  import type { DivinationModel } from './divination-model.svelte';
  import { tossThreeCoins, type CoinFace } from './liuyao-coin-toss';

  interface Props {
    model: DivinationModel;
  }

  let { model }: Props = $props();

  const copy = viCopy.divination;

  // US-029: trang thai dong xu cho moi hao (chi de trinh dien animation). Gia tri that van
  // ghi qua model.setLiuyaoLine; day chi luu mat xu de hien va kich animation reveal.
  // null = chua gieo hao do. tossSeq tang moi lan gieo de re-trigger CSS animation.
  let coinFaces = $state<(CoinFace[] | null)[]>([null, null, null, null, null, null]);
  let tossSeq = $state<number[]>([0, 0, 0, 0, 0, 0]);
  let tossingAll = $state(false);

  function tossLine(index: number): void {
    const { coins, state } = tossThreeCoins();
    const nextFaces = [...coinFaces];
    nextFaces[index] = coins;
    coinFaces = nextFaces;
    const nextSeq = [...tossSeq];
    nextSeq[index] += 1;
    tossSeq = nextSeq;
    model.setLiuyaoLine(index, state);
  }

  function tossAll(): void {
    if (tossingAll) return;
    tossingAll = true;
    for (let i = 0; i < 6; i += 1) {
      tossLine(i);
    }
    // Nha co tossingAll sau khi animation hao cuoi chay xong (6 hao * 90ms so le + 360ms reveal).
    setTimeout(() => {
      tossingAll = false;
    }, 6 * 90 + 360);
  }
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

  function coinLabel(isHead: CoinFace): string {
    return isHead ? 'S' : 'N';
  }

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
      <button
        type="button"
        class="toss-all"
        disabled={model.isSubmitting || tossingAll}
        onclick={tossAll}
      >
        {tossingAll ? copy.liuyaoTossingLabel : copy.liuyaoTossAllButton}
      </button>
      {#each model.draft.liuyaoLines as line, index (index)}
        <div class="line-row">
          <div class="coins" aria-hidden="true">
            {#if coinFaces[index]}
              {#key tossSeq[index]}
                {#each coinFaces[index] ?? [] as face, coinIndex (coinIndex)}
                  <span
                    class="coin"
                    class:head={face}
                    style={`--coin-delay: ${coinIndex * 70}ms`}
                  >{coinLabel(face)}</span>
                {/each}
              {/key}
            {:else}
              <span class="coin placeholder">?</span>
              <span class="coin placeholder">?</span>
              <span class="coin placeholder">?</span>
            {/if}
          </div>
          <SelectField
            label={lineLabel(index + 1)}
            fieldId={`divination-liuyao-line-${index + 1}`}
            value={line}
            options={lineOptions}
            disabled={model.isSubmitting}
            onValueChange={(value) => model.setLiuyaoLine(index, value as LiuyaoLineStateKey)}
          />
          <button
            type="button"
            class="toss-one"
            disabled={model.isSubmitting || tossingAll}
            onclick={() => tossLine(index)}
          >
            {copy.liuyaoTossOneButton}
          </button>
        </div>
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
    grid-template-columns: 1fr;
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

  .toss-all {
    justify-self: start;
    min-height: 36px;
    padding: var(--space-xs) var(--space-md);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color var(--duration, 150ms) ease;
  }

  .toss-all:hover:not(:disabled) {
    border-color: var(--color-accent-primary);
  }

  .toss-all:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }

  .toss-all:disabled {
    opacity: 0.6;
    cursor: progress;
  }

  /* Moi hao: cot dong xu | select trang thai | nut gieo rieng. */
  .line-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: end;
    gap: var(--space-sm);
  }

  .coins {
    display: inline-flex;
    gap: 4px;
    padding-bottom: 6px;
  }

  .coin {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid var(--color-border-hairline);
    background: var(--color-bg-surface);
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 700;
    /* Reveal animation: chi animate transform + opacity (compositor-friendly). */
    animation: coin-reveal 360ms ease both;
    animation-delay: var(--coin-delay, 0ms);
  }

  .coin.head {
    border-color: var(--color-accent-primary);
    color: var(--color-accent-primary);
  }

  .coin.placeholder {
    animation: none;
    color: var(--color-text-muted);
  }

  .toss-one {
    min-height: 36px;
    padding: var(--space-xs) var(--space-sm);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
    color: var(--color-text-secondary);
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
    transition: border-color var(--duration, 150ms) ease;
  }

  .toss-one:hover:not(:disabled) {
    border-color: var(--color-accent-primary);
  }

  .toss-one:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }

  .toss-one:disabled {
    opacity: 0.6;
    cursor: progress;
  }

  @keyframes coin-reveal {
    from {
      opacity: 0;
      transform: translateY(-6px) scale(0.85);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Ton trong nguoi dung tat chuyen dong: bo animation reveal. */
  @media (prefers-reduced-motion: reduce) {
    .coin {
      animation: none;
    }
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
