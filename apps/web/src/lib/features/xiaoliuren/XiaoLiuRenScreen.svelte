<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { untrack } from 'svelte';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { PrimaryButton, NoticeBanner } from '$lib/components/ui';
  import MarkdownView from '$lib/features/explanation/MarkdownView.svelte';
  import { createXiaoLiuRenModel, type XiaoLiuRenCopy } from './xiaoliuren-model.svelte';
  import type { XiaoLiuRenAuspice } from '@ziweiai/contracts';

  const AUSPICE_LABEL_MAP: Record<XiaoLiuRenAuspice, string> = {
    dai_cat: 'Đại Cát',
    cat: 'Cát',
    tieu_cat: 'Tiểu Cát',
    binh: 'Bình hòa',
    hung: 'Hung',
    dai_hung: 'Đại Hung',
  };

  function getAuspiceClass(auspice: XiaoLiuRenAuspice): 'good' | 'neutral' | 'bad' {
    if (auspice === 'dai_cat' || auspice === 'cat' || auspice === 'tieu_cat') return 'good';
    if (auspice === 'binh') return 'neutral';
    return 'bad';
  }

  interface Props {
    copy: XiaoLiuRenCopy;
  }

  let { copy }: Props = $props();

  const auth = getAuthStore();
  const model = untrack(() => createXiaoLiuRenModel({ auth, copy }));

  const sixPalaces = [
    { key: 'dai_an', name: 'Đại An', num: 1, auspice: 'Cát', element: 'Mộc', note: 'Bình an, vững chãi, mọi sự thuận hòa' },
    { key: 'luu_nien', name: 'Lưu Niên', num: 2, auspice: 'Bình hòa', element: 'Thổ', note: 'Chưa xong, chậm lại, kiên nhẫn tích lũy' },
    { key: 'toc_hy', name: 'Tốc Hỷ', num: 3, auspice: 'Đại Cát', element: 'Hỏa', note: 'Tin vui nhanh chóng, việc tốt đến ngay' },
    { key: 'xich_khau', name: 'Xích Khẩu', num: 4, auspice: 'Tiểu Hung', element: 'Kim', note: 'Tranh chấp, thị phi, phòng ngừa rủi ro' },
    { key: 'tieu_cat', name: 'Tiểu Cát', num: 5, auspice: 'Cát', element: 'Thủy', note: 'May mắn nhỏ, có quý nhân giúp đỡ' },
    { key: 'khong_vong', name: 'Không Vong', num: 6, auspice: 'Hung', element: 'Thổ', note: 'Trống rỗng, lỡ dở, nên phòng thủ bảo toàn' },
  ];

  function goToDashboard(): void {
    void goto(resolve('/'));
  }
</script>

<div class="xiaoliuren-screen">
  <div class="shell">
    <header class="band">
      <button type="button" class="band-back" aria-label={copy.returnToDashboard} onclick={goToDashboard}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M14 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <p class="band-eyebrow">{copy.heroEyebrow}</p>
      <h1 class="band-title">{copy.heroTitle}</h1>
      <p class="band-sub">{copy.heroSubtitle}</p>
    </header>

    <main class="content">
      {#if model.result}
        {@const draw = model.result}
        <section class="result" aria-live="polite">
          <p class="result-eyebrow">{copy.resultTitle}</p>

          <article class="palace-card main-palace">
            <div class="palace-head">
              <span class="palace-badge">{copy.targetPalaceTitle}</span>
              <h2 class="palace-name">{draw.targetPalace.name}</h2>
              <span class="palace-auspice auspice-{getAuspiceClass(draw.targetPalace.auspice)}">
                {AUSPICE_LABEL_MAP[draw.targetPalace.auspice] ?? draw.targetPalace.auspice}
              </span>
            </div>

            <div class="palace-meta">
              <div class="meta-item">
                <span class="meta-label">{copy.elementLabel}:</span>
                <span class="meta-val">{draw.targetPalace.element}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">{copy.directionLabel}:</span>
                <span class="meta-val">{draw.targetPalace.direction}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">{copy.deityLabel}:</span>
                <span class="meta-val">{draw.targetPalace.deity}</span>
              </div>
            </div>

            <div class="palace-block">
              <p class="block-title">{copy.poemTitle}</p>
              <p class="poem-text">{draw.targetPalace.poem}</p>
            </div>

            <div class="palace-block">
              <p class="block-title">Ý nghĩa cơ bản</p>
              <p class="meaning-text">{draw.targetPalace.meaning}</p>
            </div>

            <div class="palace-block">
              <p class="block-title">{copy.adviceTitle}</p>
              <p class="advice-text">{draw.targetPalace.advice}</p>
            </div>
          </article>

          <div class="progression-card">
            <h3 class="progression-title">{copy.threePalacesTitle}</h3>
            <div class="flow-chips">
              <div class="flow-chip">
                <span class="flow-step">1. Khởi:</span>
                <span class="flow-palace">{draw.firstPalace.name}</span>
              </div>
              <span class="flow-arrow">&rarr;</span>
              <div class="flow-chip">
                <span class="flow-step">2. Chuyển:</span>
                <span class="flow-palace">{draw.secondPalace.name}</span>
              </div>
              <span class="flow-arrow">&rarr;</span>
              <div class="flow-chip highlight">
                <span class="flow-step">3. Đích:</span>
                <span class="flow-palace">{draw.targetPalace.name}</span>
              </div>
            </div>
            <p class="flow-desc">{draw.flowDescription}</p>
            {#if draw.lunarDateSummary}
              <p class="lunar-summary">Thời khắc: {draw.lunarDateSummary}</p>
            {/if}
            {#if draw.numbers && draw.numbers.length > 0}
              <p class="numbers-summary">Bộ ba số: {draw.numbers.join(' - ')}</p>
            {/if}
          </div>

          <div class="reading">
            <p class="reading-title">{copy.readingTitle}</p>
            <MarkdownView markdown={draw.narrative} />
          </div>

          <NoticeBanner message={copy.safetyNotice} tone="info" />
          <PrimaryButton label={copy.retakeButton} variant="surface" onclick={() => model.reset()} />
        </section>
      {:else}
        <section class="form">
          <div class="six-palaces-guide">
            <p class="guide-title">Sơ đồ 6 cung bấm độn trên bàn tay</p>
            <div class="palaces-grid">
              {#each sixPalaces as p (p.key)}
                <div class="palace-tile">
                  <div class="tile-top">
                    <span class="tile-num">{p.num}</span>
                    <span class="tile-name">{p.name}</span>
                  </div>
                  <div class="tile-badges">
                    <span class="badge-auspice">{p.auspice}</span>
                    <span class="badge-elem">{p.element}</span>
                  </div>
                  <p class="tile-note">{p.note}</p>
                </div>
              {/each}
            </div>
          </div>

          <div class="field">
            <label class="field-label" for="xiaoliuren-question">{copy.questionLabel}</label>
            <textarea
              id="xiaoliuren-question"
              class="question-input"
              rows="3"
              placeholder={copy.questionPlaceholder}
              value={model.question}
              disabled={model.isSubmitting}
              oninput={(event) => model.setQuestion((event.currentTarget as HTMLTextAreaElement).value)}
            ></textarea>
          </div>

          <div class="field">
            <span class="field-label">{copy.methodLabel}</span>
            <div class="method-toggle" role="radiogroup" aria-label={copy.methodLabel}>
              <button
                type="button"
                role="radio"
                aria-checked={model.method === 'time'}
                class="method-btn {model.method === 'time' ? 'active' : ''}"
                onclick={() => model.setMethod('time')}
              >
                {copy.methodTime}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={model.method === 'numbers'}
                class="method-btn {model.method === 'numbers' ? 'active' : ''}"
                onclick={() => model.setMethod('numbers')}
              >
                {copy.methodNumbers}
              </button>
            </div>
          </div>

          {#if model.method === 'numbers'}
            <div class="numbers-panel">
              <div class="numbers-inputs">
                <div class="number-field">
                  <label for="num-1">{copy.number1Label}</label>
                  <input
                    id="num-1"
                    type="number"
                    min="1"
                    value={model.number1}
                    oninput={(e) => model.setNumber1(Number((e.currentTarget as HTMLInputElement).value))}
                  />
                </div>
                <div class="number-field">
                  <label for="num-2">{copy.number2Label}</label>
                  <input
                    id="num-2"
                    type="number"
                    min="1"
                    value={model.number2}
                    oninput={(e) => model.setNumber2(Number((e.currentTarget as HTMLInputElement).value))}
                  />
                </div>
                <div class="number-field">
                  <label for="num-3">{copy.number3Label}</label>
                  <input
                    id="num-3"
                    type="number"
                    min="1"
                    value={model.number3}
                    oninput={(e) => model.setNumber3(Number((e.currentTarget as HTMLInputElement).value))}
                  />
                </div>
              </div>
              <button type="button" class="random-btn" onclick={() => model.generateRandomNumbers()}>
                Gieo 3 số ngẫu nhiên
              </button>
            </div>
          {/if}

          {#if model.validationMessage}
            <NoticeBanner message={model.validationMessage} tone="danger" />
          {/if}
          {#if model.isError && model.errorMessage}
            <NoticeBanner message={model.errorMessage} tone="danger" />
          {/if}

          <PrimaryButton
            label={model.isSubmitting ? copy.castingLabel : copy.submitButton}
            loading={model.isSubmitting}
            onclick={() => model.submit()}
          />
          <NoticeBanner message={copy.safetyNotice} tone="info" />
        </section>
      {/if}
    </main>
  </div>
</div>

<style>
  .xiaoliuren-screen {
    min-height: 100dvh;
    overflow-x: hidden;
    background:
      radial-gradient(ellipse 70% 35% at 50% 0%, rgba(212, 175, 55, 0.16), transparent 70%),
      radial-gradient(ellipse 55% 30% at 85% 15%, rgba(192, 132, 252, 0.12), transparent 60%),
      linear-gradient(180deg, #090615 0%, #130c2b 30%, #070512 100%);
    color: #f7eed8;
  }

  .shell {
    box-sizing: border-box;
    max-width: 820px;
    margin: 0 auto;
    padding: 24px 16px 80px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .band {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
    position: relative;
    padding-top: 8px;
  }

  .band-back {
    position: absolute;
    top: 8px;
    left: 0;
    width: 40px;
    height: 40px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(212, 175, 55, 0.25);
    color: #f7eed8;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }

  .band-back:hover {
    background: rgba(212, 175, 55, 0.18);
    border-color: rgba(212, 175, 55, 0.6);
    transform: translateX(-2px);
  }

  .band-back svg {
    width: 20px;
    height: 20px;
  }

  .band-eyebrow {
    margin: 0;
    font-size: 0.72rem;
    letter-spacing: 0.22em;
    font-weight: 700;
    color: #eab308;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 999px;
    background: rgba(234, 179, 8, 0.12);
    border: 1px solid rgba(234, 179, 8, 0.3);
  }

  .band-title {
    margin: 0;
    font-family: var(--font-serif, serif);
    font-size: clamp(1.8rem, 4vw, 2.4rem);
    font-weight: 700;
    line-height: 1.2;
    color: #ffd88a;
  }

  .band-sub {
    margin: 0;
    max-width: 620px;
    font-size: 0.92rem;
    line-height: 1.6;
    color: #d6cfbe;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form,
  .result {
    display: flex;
    flex-direction: column;
    gap: 20px;
    background: rgba(20, 14, 40, 0.72);
    border: 1px solid rgba(212, 175, 55, 0.28);
    border-radius: 18px;
    padding: 24px;
    box-shadow: 0 16px 45px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(12px);
  }

  .six-palaces-guide {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .guide-title {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 700;
    color: #ffd88a;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .palaces-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 10px;
  }

  .palace-tile {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(212, 175, 55, 0.18);
    border-radius: 12px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .tile-top {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tile-num {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(212, 175, 55, 0.2);
    color: #ffd88a;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  .tile-name {
    font-weight: 700;
    font-size: 0.92rem;
    color: #fff;
  }

  .tile-badges {
    display: flex;
    gap: 6px;
  }

  .badge-auspice,
  .badge-elem {
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.08);
  }

  .tile-note {
    margin: 0;
    font-size: 0.76rem;
    color: #b8b09d;
    line-height: 1.35;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field-label {
    font-size: 0.88rem;
    font-weight: 600;
    color: #ffd88a;
  }

  .question-input {
    width: 100%;
    box-sizing: border-box;
    background: rgba(10, 6, 22, 0.75);
    border: 1px solid rgba(212, 175, 55, 0.35);
    border-radius: 12px;
    padding: 12px 14px;
    color: #fffdf8;
    font-size: 0.95rem;
    line-height: 1.5;
    font-family: inherit;
    resize: vertical;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .question-input:focus {
    outline: none;
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.25);
  }

  .method-toggle {
    display: flex;
    gap: 10px;
  }

  .method-btn {
    flex: 1;
    padding: 10px 14px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(212, 175, 55, 0.2);
    color: #d6cfbe;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .method-btn.active {
    background: rgba(212, 175, 55, 0.2);
    border-color: #eab308;
    color: #ffd88a;
    box-shadow: 0 0 10px rgba(234, 179, 8, 0.2);
  }

  .numbers-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid rgba(212, 175, 55, 0.15);
  }

  .numbers-inputs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .number-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .number-field label {
    font-size: 0.78rem;
    color: #c7beab;
  }

  .number-field input {
    background: rgba(10, 6, 22, 0.8);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 8px;
    padding: 8px 10px;
    color: #fff;
    font-size: 1rem;
    font-weight: 700;
    text-align: center;
  }

  .random-btn {
    align-self: flex-start;
    padding: 6px 12px;
    border-radius: 6px;
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #ffd88a;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .random-btn:hover {
    background: rgba(212, 175, 55, 0.25);
  }

  .result-eyebrow {
    margin: 0;
    font-size: 0.76rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #eab308;
    font-weight: 700;
  }

  .palace-card {
    background: rgba(15, 10, 30, 0.85);
    border: 1px solid rgba(212, 175, 55, 0.4);
    border-radius: 16px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .palace-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
    padding-bottom: 14px;
  }

  .palace-badge {
    font-size: 0.75rem;
    padding: 3px 8px;
    border-radius: 4px;
    background: rgba(212, 175, 55, 0.18);
    color: #ffd88a;
    font-weight: 600;
    text-transform: uppercase;
  }

  .palace-name {
    margin: 0;
    font-family: var(--font-serif, serif);
    font-size: 1.8rem;
    font-weight: 700;
    color: #fffdf8;
  }

  .palace-auspice {
    font-size: 0.85rem;
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: 700;
  }

  .auspice-good {
    background: rgba(34, 197, 94, 0.2);
    border: 1px solid rgba(34, 197, 94, 0.4);
    color: #4ade80;
  }

  .auspice-neutral {
    background: rgba(234, 179, 8, 0.2);
    border: 1px solid rgba(234, 179, 8, 0.4);
    color: #facc15;
  }

  .auspice-bad {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #f87171;
  }

  .palace-meta {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    background: rgba(255, 255, 255, 0.03);
    padding: 10px 14px;
    border-radius: 8px;
  }

  .meta-item {
    display: flex;
    gap: 6px;
    font-size: 0.85rem;
  }

  .meta-label {
    color: #b8b09d;
  }

  .meta-val {
    color: #ffd88a;
    font-weight: 600;
  }

  .palace-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .block-title {
    margin: 0;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #eab308;
    font-weight: 700;
  }

  .poem-text {
    margin: 0;
    font-style: italic;
    line-height: 1.6;
    color: #fef08a;
    padding: 10px 14px;
    background: rgba(234, 179, 8, 0.08);
    border-left: 3px solid #eab308;
    border-radius: 0 8px 8px 0;
  }

  .meaning-text,
  .advice-text {
    margin: 0;
    line-height: 1.6;
    font-size: 0.92rem;
    color: #e2d9c8;
  }

  .progression-card {
    background: rgba(15, 10, 30, 0.7);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 14px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .progression-title {
    margin: 0;
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #ffd88a;
  }

  .flow-chips {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .flow-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(212, 175, 55, 0.2);
    font-size: 0.85rem;
  }

  .flow-chip.highlight {
    background: rgba(212, 175, 55, 0.22);
    border-color: #f59e0b;
  }

  .flow-step {
    color: #c7beab;
    font-size: 0.78rem;
  }

  .flow-palace {
    font-weight: 700;
    color: #fff;
  }

  .flow-arrow {
    color: #eab308;
    font-weight: 700;
  }

  .flow-desc {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.5;
    color: #d6cfbe;
  }

  .lunar-summary,
  .numbers-summary {
    margin: 0;
    font-size: 0.8rem;
    color: #a8a29e;
  }

  .reading {
    background: rgba(15, 10, 30, 0.8);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 14px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .reading-title {
    margin: 0;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
    color: #ffd88a;
  }

  /* Light theme */
  :global([data-theme="light"]) .xiaoliuren-screen {
    background:
      radial-gradient(ellipse 70% 35% at 50% 0%, rgba(212, 175, 55, 0.12), transparent 70%),
      linear-gradient(180deg, #fbfaf7 0%, #f4f1ea 40%, #eae5d9 100%);
    color: #292524;
  }

  :global([data-theme="light"]) .band-back {
    background: rgba(255, 255, 255, 0.85);
    border-color: rgba(212, 175, 55, 0.4);
    color: #78350f;
  }

  :global([data-theme="light"]) .band-eyebrow {
    background: rgba(212, 175, 55, 0.18);
    border-color: rgba(212, 175, 55, 0.5);
    color: #854d0e;
  }

  :global([data-theme="light"]) .band-title {
    color: #78350f;
  }

  :global([data-theme="light"]) .band-sub {
    color: #57534e;
  }

  :global([data-theme="light"]) .form,
  :global([data-theme="light"]) .result {
    background: rgba(255, 255, 255, 0.88);
    border-color: rgba(212, 175, 55, 0.45);
    box-shadow: 0 16px 45px rgba(212, 175, 55, 0.12);
  }

  :global([data-theme="light"]) .guide-title,
  :global([data-theme="light"]) .field-label,
  :global([data-theme="light"]) .reading-title,
  :global([data-theme="light"]) .progression-title {
    color: #78350f;
  }

  :global([data-theme="light"]) .palace-tile {
    background: rgba(248, 246, 240, 0.9);
    border-color: rgba(212, 175, 55, 0.3);
  }

  :global([data-theme="light"]) .tile-name {
    color: #1c1917;
  }

  :global([data-theme="light"]) .tile-note {
    color: #57534e;
  }

  :global([data-theme="light"]) .question-input {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(212, 175, 55, 0.35);
    color: #1c1917;
  }

  :global([data-theme="light"]) .method-btn {
    background: rgba(248, 246, 240, 0.8);
    border-color: rgba(212, 175, 55, 0.3);
    color: #57534e;
  }

  :global([data-theme="light"]) .method-btn.active {
    background: rgba(212, 175, 55, 0.25);
    border-color: #b45309;
    color: #78350f;
  }

  :global([data-theme="light"]) .numbers-panel {
    background: rgba(248, 246, 240, 0.85);
    border-color: rgba(212, 175, 55, 0.25);
  }

  :global([data-theme="light"]) .number-field input {
    background: #ffffff;
    border-color: rgba(212, 175, 55, 0.4);
    color: #1c1917;
  }

  :global([data-theme="light"]) .random-btn {
    background: rgba(212, 175, 55, 0.2);
    border-color: rgba(212, 175, 55, 0.4);
    color: #78350f;
  }

  :global([data-theme="light"]) .palace-card {
    background: rgba(248, 246, 240, 0.92);
    border-color: rgba(212, 175, 55, 0.4);
  }

  :global([data-theme="light"]) .palace-name {
    color: #1c1917;
  }

  :global([data-theme="light"]) .poem-text {
    background: rgba(212, 175, 55, 0.15);
    border-left-color: #b45309;
    color: #78350f;
  }

  :global([data-theme="light"]) .meaning-text,
  :global([data-theme="light"]) .advice-text {
    color: #292524;
  }

  :global([data-theme="light"]) .progression-card,
  :global([data-theme="light"]) .reading {
    background: rgba(248, 246, 240, 0.88);
    border-color: rgba(212, 175, 55, 0.3);
  }

  :global([data-theme="light"]) .flow-chip {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(212, 175, 55, 0.35);
  }

  :global([data-theme="light"]) .flow-palace {
    color: #1c1917;
  }

  :global([data-theme="light"]) .flow-desc {
    color: #44403c;
  }
</style>
