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
                    style={`--coin-delay: ${index * 90 + coinIndex * 70}ms`}
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
    gap: var(--space-lg);
    background: rgba(22, 27, 46, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-lg);
    padding: var(--space-xl);
    backdrop-filter: blur(16px);
  }

  .question {
    width: 100%;
    box-sizing: border-box;
    padding: var(--space-md);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-md);
    background: rgba(11, 13, 20, 0.6);
    color: var(--color-text-primary);
    font-size: 15px;
    font-family: inherit;
    resize: vertical;
    transition: all 0.2s ease;
  }

  .question::placeholder {
    color: var(--color-text-muted);
  }

  .question:focus-visible {
    outline: none;
    border-color: #d4af37;
    box-shadow: 0 0 16px rgba(212, 175, 55, 0.2);
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
    padding: var(--space-md);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: var(--radius-md);
    background: rgba(11, 13, 20, 0.4);
  }

  .lines-legend {
    grid-column: 1 / -1;
    padding: 0 8px;
    color: #fce99f;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.3px;
  }

  .toss-all {
    justify-self: start;
    min-height: 40px;
    padding: var(--space-xs) var(--space-lg);
    border: 1px solid rgba(212, 175, 55, 0.5);
    border-radius: var(--radius-pill);
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(184, 134, 11, 0.1));
    color: #fce99f;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .toss-all:hover:not(:disabled) {
    border-color: #fce99f;
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.35), rgba(184, 134, 11, 0.2));
    box-shadow: 0 0 16px rgba(212, 175, 55, 0.35);
    transform: translateY(-1px);
  }

  .toss-all:focus-visible {
    outline: 2px solid #d4af37;
    outline-offset: 2px;
  }

  .toss-all:disabled {
    opacity: 0.6;
    cursor: progress;
  }

  /* Mỗi hào: cột đồng xu | select trạng thái | nút gieo riêng */
  .line-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--space-md);
    padding: 8px 12px;
    border-radius: var(--radius-md);
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.04);
    transition: background 0.15s ease;
  }

  .line-row:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .coins {
    display: inline-flex;
    gap: 6px;
    perspective: 600px;
  }

  /* ĐỒNG XU CỔ 3D HOÀNG KIM */
  .coin {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid #d4af37;
    background: radial-gradient(circle at 35% 35%, #fff1b8 0%, #d4af37 50%, #855806 100%);
    color: #3b2803;
    font-size: 13px;
    font-weight: 800;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5), inset 0 0 4px rgba(255, 255, 255, 0.6);
    animation: coin-flip 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
    animation-delay: var(--coin-delay, 0ms);
    user-select: none;
  }

  /* Lỗ vuông giữa đồng xu cổ */
  .coin::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    background: rgba(11, 13, 20, 0.85);
    border: 1px solid rgba(212, 175, 55, 0.8);
    box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.8);
    pointer-events: none;
  }

  .coin.head {
    border-color: #fce99f;
    background: radial-gradient(circle at 35% 35%, #ffffff 0%, #fce99f 40%, #d4af37 80%, #996515 100%);
    color: #1e1302;
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.6), inset 0 0 4px rgba(255, 255, 255, 0.8);
  }

  .coin.placeholder {
    animation: none;
    border: 1px dashed rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-text-muted);
    box-shadow: none;
  }

  .coin.placeholder::after {
    display: none;
  }

  .toss-one {
    min-height: 36px;
    padding: var(--space-xs) var(--space-md);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: var(--radius-md);
    background: rgba(22, 27, 46, 0.6);
    color: var(--color-text-primary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;
  }

  .toss-one:hover:not(:disabled) {
    border-color: #d4af37;
    color: #fce99f;
    background: rgba(212, 175, 55, 0.1);
  }

  .toss-one:focus-visible {
    outline: 2px solid #d4af37;
    outline-offset: 2px;
  }

  .toss-one:disabled {
    opacity: 0.6;
    cursor: progress;
  }

  @keyframes coin-flip {
    0% {
      opacity: 0;
      transform: translateY(-20px) rotateY(0deg) scale(0.6);
    }
    60% {
      transform: translateY(-5px) rotateY(540deg) scale(1.15);
    }
    100% {
      opacity: 1;
      transform: translateY(0) rotateY(720deg) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .coin {
      animation: none;
    }
  }

  .cast-hint {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 13px;
    line-height: 1.5;
  }

  @media (max-width: 480px) {
    .form {
      padding: var(--space-md);
    }
    .grid-2,
    .lines {
      grid-template-columns: 1fr;
    }
    .line-row {
      grid-template-columns: 1fr;
      justify-items: start;
      gap: 8px;
    }
  }
</style>
