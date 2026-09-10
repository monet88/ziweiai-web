<script lang="ts">
  // DivinationForm (US-025/US-026): form gieo quẻ cho 4 hệ theo thời điểm. KHÔNG nhập ngày
  // sinh/giới tính. Mặc định gieo theo "now". Mai Hoa + Lục Hào (canManualCast) thêm lựa chọn
  // gieo thủ công: Mai Hoa nhập 2 số, Lục Hào chọn 6 hào. Lỗi chỉ hiện sau lần submit đầu.
  import { PrimaryButton, FormField, TextInputField, SelectField, NoticeBanner } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import type { DivinationCastMethod, DivinationPurposeKey, LiuyaoLineStateKey } from '@ziweiai/contracts';
  import type { DivinationModel } from './divination-model.svelte';
  import { tossThreeCoins, type CoinFace } from './liuyao-coin-toss';
  import { playCoinClink, playSingingBowl } from '$lib/audio/ritual-audio';
  import { Sparkles, Compass, ShieldCheck } from 'lucide-svelte';

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
    playCoinClink();
    const { coins, state } = tossThreeCoins();
    const nextFaces = [...coinFaces];
    nextFaces[index] = coins;
    coinFaces = nextFaces;
    const nextSeq = [...tossSeq];
    nextSeq[index] += 1;
    tossSeq = nextSeq;
    model.setLiuyaoLine(index, state);

    const filledCount = nextFaces.filter(Boolean).length;
    if (filledCount === 6) {
      setTimeout(() => {
        playSingingBowl();
      }, 300);
    }
  }

  function tossAll(): void {
    if (tossingAll) return;
    tossingAll = true;
    for (let i = 0; i < 6; i += 1) {
      setTimeout(() => {
        tossLine(i);
      }, i * 90);
    }
    // Nha co tossingAll sau khi animation hao cuoi chay xong (6 hao * 90ms so le + 360ms reveal).
    setTimeout(() => {
      tossingAll = false;
      playSingingBowl();
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
    playSingingBowl();
    model.submit();
  }
</script>

<form class="form celestial-card-glass" onsubmit={handleSubmit}>
  <!-- Header Thẻ Chiêm Bốc Khâm Thiên Giám -->
  <div class="divination-header">
    <div class="divination-badge">
      <Compass class="badge-icon" />
      <span>Khâm Thiên Giám • Chu Dịch Chiêm Bốc</span>
    </div>
    <p class="divination-guidance">
      Tĩnh tâm tập trung ý niệm vào câu hỏi; năng lượng tâm thức sẽ tương ứng với thiên cơ của thời khắc hiện tại.
    </p>
  </div>

  <FormField label={copy.questionLabel} fieldId="divination-question" errorText={errorFor('question')}>
    {#snippet children({ describedById, invalid })}
      <div class="question-wrap">
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
      </div>
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
        <Sparkles class="toss-icon" />
        <span>{tossingAll ? copy.liuyaoTossingLabel : copy.liuyaoTossAllButton}</span>
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
    <div class="time-cast-notice">
      <Sparkles class="notice-sparkle" />
      <p class="cast-hint">{copy.castNowHint}</p>
    </div>
  {/if}

  {#if model.isError && model.errorMessage}
    <NoticeBanner message={model.errorMessage} tone="danger" />
  {/if}

  <!-- Action Bar Hoàng Gia Sang Trọng -->
  <div class="submit-wrapper">
    <PrimaryButton
      type="submit"
      loading={model.isSubmitting}
    >
      <div class="submit-btn-content">
        <Sparkles class="submit-sparkle-icon" />
        <span class="submit-btn-text">
          {model.isSubmitting ? 'ĐANG KHỞI TẠO THIÊN CƠ...' : 'GIEO QUẺ KHỞI THIÊN CƠ'}
        </span>
      </div>
    </PrimaryButton>

    <div class="trust-footer">
      <ShieldCheck class="trust-icon" />
      <span>Phép bốc phệ Chu Dịch chuẩn truyền thống • Thần cơ ứng cảm theo thời khắc</span>
    </div>
  </div>
</form>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
    background: linear-gradient(145deg, rgba(26, 20, 50, 0.85) 0%, rgba(13, 10, 26, 0.95) 100%);
    border: 1px solid rgba(212, 175, 55, 0.35);
    border-radius: 24px;
    padding: var(--space-xl);
    backdrop-filter: blur(20px);
    box-shadow:
      0 24px 60px rgba(0, 0, 0, 0.6),
      0 0 35px rgba(212, 175, 55, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
    position: relative;
    overflow: hidden;
  }

  /* Header Thẻ Chiêm Bốc Khâm Thiên Giám */
  .divination-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  }

  .divination-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    align-self: flex-start;
    padding: 5px 14px;
    border-radius: 9999px;
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.4);
    color: #ffd700;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  :global(.badge-icon) {
    width: 14px;
    height: 14px;
    color: #ffd700;
  }

  .divination-guidance {
    margin: 0;
    font-size: 13.5px;
    line-height: 1.5;
    color: rgba(235, 226, 204, 0.75);
  }

  .question-wrap {
    position: relative;
    width: 100%;
  }

  .question {
    width: 100%;
    box-sizing: border-box;
    padding: 14px 16px;
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 14px;
    background: rgba(14, 10, 28, 0.85);
    color: #f7eed8;
    font-size: 15px;
    font-family: inherit;
    line-height: 1.55;
    resize: vertical;
    transition: all 0.25s ease;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
  }

  .question::placeholder {
    color: rgba(226, 216, 184, 0.45);
  }

  .question:focus-visible {
    outline: none;
    border-color: #ffd700;
    background: rgba(18, 13, 36, 0.95);
    box-shadow:
      0 0 20px rgba(212, 175, 55, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
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

  /* Khối Gieo 6 Hào Lục Hào */
  .lines {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-md);
    margin: 0;
    padding: var(--space-lg);
    border: 1px solid rgba(212, 175, 55, 0.35);
    border-radius: 18px;
    background: rgba(15, 11, 30, 0.7);
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
  }

  .lines-legend {
    grid-column: 1 / -1;
    padding: 0 10px;
    color: #ffd700;
    font-size: 14.5px;
    font-weight: 800;
    letter-spacing: 0.05em;
  }

  .toss-all {
    justify-self: start;
    min-height: 44px;
    padding: 0 20px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 9999px;
    background: linear-gradient(135deg, #fce99f 0%, #ffd700 40%, #d4af37 100%);
    color: #0d0a1a;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    box-shadow:
      0 4px 16px rgba(212, 175, 55, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .toss-all:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow:
      0 8px 24px rgba(212, 175, 55, 0.6),
      0 0 16px rgba(255, 215, 0, 0.5);
  }

  :global(.toss-icon) {
    width: 15px;
    height: 15px;
    color: #0d0a1a;
  }

  .toss-all:focus-visible {
    outline: 2px solid #ffd700;
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
    padding: 10px 14px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(212, 175, 55, 0.15);
    transition: all 0.2s ease;
  }

  .line-row:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(212, 175, 55, 0.35);
  }

  .coins {
    display: inline-flex;
    gap: 7px;
    perspective: 600px;
  }

  /* ĐỒNG XU CỔ 3D HOÀNG KIM KHÂM THIÊN BẢO GIÁM */
  .coin {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid #e6ca65;
    background: radial-gradient(circle at 35% 35%, #fff5cc 0%, #d4af37 55%, #784f04 100%);
    color: #2b1d02;
    font-size: 13px;
    font-weight: 900;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5), inset 0 0 5px rgba(255, 255, 255, 0.7);
    animation: coin-flip 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
    animation-delay: var(--coin-delay, 0ms);
    user-select: none;
  }

  /* Lỗ vuông giữa đồng xu cổ */
  .coin::after {
    content: '';
    position: absolute;
    width: 9px;
    height: 9px;
    background: rgba(14, 10, 28, 0.9);
    border: 1px solid rgba(212, 175, 55, 0.9);
    box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.9);
    pointer-events: none;
  }

  .coin.head {
    border-color: #fff2a3;
    background: radial-gradient(circle at 35% 35%, #ffffff 0%, #ffec8a 40%, #d4af37 80%, #8c5a08 100%);
    color: #1a1102;
    box-shadow: 0 0 14px rgba(212, 175, 55, 0.75), inset 0 0 5px rgba(255, 255, 255, 0.9);
  }

  .coin.placeholder {
    animation: none;
    border: 1px dashed rgba(212, 175, 55, 0.3);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(226, 216, 184, 0.5);
    box-shadow: none;
  }

  .coin.placeholder::after {
    display: none;
  }

  .toss-one {
    min-height: 38px;
    padding: 0 14px;
    border: 1px solid rgba(212, 175, 55, 0.4);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.08);
    color: #ffd700;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  .toss-one:hover:not(:disabled) {
    border-color: #ffd700;
    color: #ffffff;
    background: rgba(212, 175, 55, 0.25);
    box-shadow: 0 0 12px rgba(212, 175, 55, 0.3);
  }

  .toss-one:focus-visible {
    outline: 2px solid #ffd700;
    outline-offset: 2px;
  }

  .toss-one:disabled {
    opacity: 0.6;
    cursor: progress;
  }

  @keyframes coin-flip {
    0% {
      opacity: 0;
      transform: translateY(-24px) rotateY(0deg) scale(0.6);
    }
    60% {
      transform: translateY(-6px) rotateY(540deg) scale(1.15);
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

  /* Chip thông báo gieo thời điểm */
  .time-cast-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 12px;
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.25);
  }

  :global(.notice-sparkle) {
    width: 15px;
    height: 15px;
    color: #ffd700;
    flex-shrink: 0;
  }

  .cast-hint {
    margin: 0;
    color: rgba(226, 216, 184, 0.7);
    font-size: 13px;
    line-height: 1.5;
  }

  /* Submit Action Wrapper Hoàng Gia */
  .submit-wrapper {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 8px;
  }

  .submit-wrapper :global(.button) {
    width: 100%;
    min-height: 52px;
    border-radius: 14px;
    background: linear-gradient(135deg, #fce99f 0%, #ffd700 30%, #d4af37 70%, #b8860b 100%) !important;
    color: #0d0a1a !important;
    border: 1px solid rgba(255, 255, 255, 0.4) !important;
    box-shadow:
      0 6px 24px rgba(212, 175, 55, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.6) !important;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .submit-wrapper :global(.button:hover:not(:disabled)) {
    transform: translateY(-2px);
    box-shadow:
      0 10px 32px rgba(212, 175, 55, 0.55),
      0 0 20px rgba(255, 215, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
  }

  .submit-btn-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  :global(.submit-sparkle-icon) {
    width: 18px;
    height: 18px;
    color: #0d0a1a;
    animation: sparkleSpin 4s linear infinite;
  }

  @keyframes sparkleSpin {
    0% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(180deg) scale(1.15); }
    100% { transform: rotate(360deg) scale(1); }
  }

  .submit-btn-text {
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.05em;
    color: #0d0a1a;
  }

  .trust-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 12px;
    color: rgba(226, 216, 184, 0.6);
  }

  :global(.trust-icon) {
    width: 14px;
    height: 14px;
    color: #ffd700;
  }

  /* Style các component UI con bên trong form */
  :global(.celestial-card-glass .select),
  :global(.celestial-card-glass .input) {
    background: rgba(14, 10, 28, 0.85) !important;
    border: 1px solid rgba(212, 175, 55, 0.3) !important;
    border-radius: 12px !important;
    color: #f7eed8 !important;
    padding: 11px 14px !important;
  }

  :global(.celestial-card-glass .select:hover),
  :global(.celestial-card-glass .input:hover) {
    border-color: #ffd700 !important;
  }

  :global(.celestial-card-glass .select:focus),
  :global(.celestial-card-glass .input:focus) {
    border-color: #ffd700 !important;
    box-shadow: 0 0 16px rgba(212, 175, 55, 0.35) !important;
  }

  :global(.celestial-card-glass .label) {
    color: #e2d8b8 !important;
    font-weight: 700 !important;
  }

  :global(.celestial-card-glass .select-chevron) {
    color: #ffd700 !important;
  }

  /* =========================================================================
     ĐỒNG BỘ THEME LIGHT HOÀNG GIA NGÀ KEM
     ========================================================================= */
  :global([data-theme="light"]) .form {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 246, 238, 0.98) 100%);
    border-color: rgba(212, 175, 55, 0.45);
    box-shadow:
      0 20px 50px rgba(212, 175, 55, 0.12),
      0 0 35px rgba(212, 175, 55, 0.08);
  }

  :global([data-theme="light"]) .divination-header {
    border-bottom-color: rgba(212, 175, 55, 0.25);
  }

  :global([data-theme="light"]) .divination-badge {
    background: rgba(212, 175, 55, 0.18);
    border-color: rgba(212, 175, 55, 0.45);
    color: #854d0e;
  }

  :global([data-theme="light"]) :global(.badge-icon) {
    color: #b45309;
  }

  :global([data-theme="light"]) .divination-guidance {
    color: #57534e;
  }

  :global([data-theme="light"]) .question {
    background: #ffffff;
    border-color: rgba(212, 175, 55, 0.35);
    color: #1c1917;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  }

  :global([data-theme="light"]) .question::placeholder {
    color: #a8a29e;
  }

  :global([data-theme="light"]) .question:focus-visible {
    border-color: #b45309;
    background: #ffffff;
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.25);
  }

  :global([data-theme="light"]) .lines {
    background: rgba(250, 246, 238, 0.8);
    border-color: rgba(212, 175, 55, 0.35);
  }

  :global([data-theme="light"]) .lines-legend {
    color: #854d0e;
  }

  :global([data-theme="light"]) .line-row {
    background: rgba(255, 255, 255, 0.85);
    border-color: rgba(212, 175, 55, 0.25);
  }

  :global([data-theme="light"]) .line-row:hover {
    background: #ffffff;
    border-color: #b45309;
  }

  :global([data-theme="light"]) .coin::after {
    background: #ffffff;
    border-color: rgba(212, 175, 55, 0.9);
  }

  :global([data-theme="light"]) .toss-one {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(212, 175, 55, 0.4);
    color: #78350f;
  }

  :global([data-theme="light"]) .toss-one:hover:not(:disabled) {
    border-color: #b45309;
    color: #451a03;
    background: #ffffff;
  }

  :global([data-theme="light"]) .time-cast-notice {
    background: rgba(212, 175, 55, 0.15);
    border-color: rgba(212, 175, 55, 0.35);
  }

  :global([data-theme="light"]) :global(.notice-sparkle) {
    color: #b45309;
  }

  :global([data-theme="light"]) .cast-hint {
    color: #78716c;
  }

  :global([data-theme="light"]) .trust-footer {
    color: #78716c;
  }

  :global([data-theme="light"]) :global(.trust-icon) {
    color: #b45309;
  }

  :global([data-theme="light"]) :global(.celestial-card-glass .select),
  :global([data-theme="light"]) :global(.celestial-card-glass .input) {
    background: #ffffff !important;
    border-color: rgba(212, 175, 55, 0.35) !important;
    color: #1c1917 !important;
  }

  :global([data-theme="light"]) :global(.celestial-card-glass .select:hover),
  :global([data-theme="light"]) :global(.celestial-card-glass .input:hover) {
    border-color: #b45309 !important;
  }

  :global([data-theme="light"]) :global(.celestial-card-glass .select:focus),
  :global([data-theme="light"]) :global(.celestial-card-glass .input:focus) {
    border-color: #b45309 !important;
    box-shadow: 0 0 16px rgba(212, 175, 55, 0.25) !important;
  }

  :global([data-theme="light"]) :global(.celestial-card-glass .label) {
    color: #78350f !important;
  }

  :global([data-theme="light"]) :global(.celestial-card-glass .select-chevron) {
    color: #b45309 !important;
  }

  :global([data-theme="light"]) :global(.celestial-card-glass .select option) {
    background: #ffffff !important;
    color: #1c1917 !important;
  }

  @media (max-width: 480px) {
    .form {
      padding: var(--space-lg);
      border-radius: 20px;
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
