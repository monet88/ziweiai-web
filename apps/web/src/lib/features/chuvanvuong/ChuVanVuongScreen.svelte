<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { untrack } from 'svelte';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { PrimaryButton, NoticeBanner } from '$lib/components/ui';
  import MarkdownView from '$lib/features/explanation/MarkdownView.svelte';
  import {
    CHU_VAN_VUONG_HEXAGRAMS,
    type ChuVanVuongOmen,
  } from '@ziweiai/contracts';
  import {
    createChuVanVuongModel,
    type ChuVanVuongCopy,
  } from './chuvanvuong-model.svelte';
  import {
    Coins,
    Sparkles,
    Shield,
    ArrowLeft,
  } from 'lucide-svelte';

  interface Props {
    copy: ChuVanVuongCopy;
  }

  let { copy }: Props = $props();

  const auth = getAuthStore();
  const model = untrack(() => createChuVanVuongModel({ auth, copy }));

  function getOmenClass(omen: ChuVanVuongOmen): 'good' | 'neutral' | 'bad' {
    if (omen === 'dai_cat' || omen === 'cat') return 'good';
    if (omen === 'binh') return 'neutral';
    return 'bad';
  }

  function goToDashboard(): void {
    void goto(resolve('/'));
  }
</script>

<div class="chuvanvuong-screen">
  <div class="shell">
    <header class="band">
      <button
        type="button"
        class="band-back"
        aria-label={copy.returnToDashboard}
        onclick={goToDashboard}
      >
        <ArrowLeft size={20} />
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

          <article class="hexagram-card">
            <div class="hexagram-head">
              <span class="hexagram-num">Quẻ số {draw.hexagram.id}</span>
              <h2 class="hexagram-name">{draw.hexagram.name}</h2>
              <span class="omen-badge omen-{getOmenClass(draw.hexagram.omen)}">
                {draw.hexagram.omenLabel}
              </span>
            </div>

            <div class="hexagram-trigrams">
              <div class="trigram-item">
                <span class="trigram-label">Thượng quái:</span>
                <strong class="trigram-val">{draw.hexagram.upperTrigram}</strong>
              </div>
              <span class="trigram-divider">•</span>
              <div class="trigram-item">
                <span class="trigram-label">Hạ quái:</span>
                <strong class="trigram-val">{draw.hexagram.lowerTrigram}</strong>
              </div>
            </div>

            <div class="card-section">
              <h3 class="section-heading">{copy.meaningTitle}</h3>
              <p class="meaning-text">{draw.hexagram.meaning}</p>
            </div>

            <div class="card-section poem-box">
              <h3 class="section-heading">{copy.poemTitle}</h3>
              <blockquote class="poem-text">{draw.hexagram.poem}</blockquote>
            </div>

            <div class="card-section">
              <h3 class="section-heading">{copy.domainsTitle}</h3>
              <div class="domains-grid">
                <div class="domain-card">
                  <span class="domain-label">{copy.taiLocLabel}</span>
                  <p class="domain-desc">{draw.hexagram.domains.taiLoc}</p>
                </div>
                <div class="domain-card">
                  <span class="domain-label">{copy.congDanhLabel}</span>
                  <p class="domain-desc">{draw.hexagram.domains.congDanh}</p>
                </div>
                <div class="domain-card">
                  <span class="domain-label">{copy.giaDaoLabel}</span>
                  <p class="domain-desc">{draw.hexagram.domains.giaDao}</p>
                </div>
                <div class="domain-card">
                  <span class="domain-label">{copy.sucKhoeLabel}</span>
                  <p class="domain-desc">{draw.hexagram.domains.sucKhoe}</p>
                </div>
              </div>
            </div>

            <div class="card-section advice-box">
              <h3 class="section-heading">{copy.adviceTitle}</h3>
              <p class="advice-text">{draw.hexagram.advice}</p>
            </div>
          </article>

          <!-- Luận giải AI -->
          <article class="ai-reading">
            <h3 class="reading-title">{copy.readingTitle}</h3>
            <div class="reading-body">
              <MarkdownView markdown={draw.narrative} />
            </div>
          </article>

          <div class="actions">
            <PrimaryButton
              label={copy.retakeButton}
              variant="surface"
              onclick={() => model.reset()}
            />
          </div>
        </section>
      {:else}
        <section class="cast-form">
          {#if model.validationMessage}
            <div class="form-banner">
              <NoticeBanner message={model.validationMessage} tone="warning" />
            </div>
          {/if}

          {#if model.errorMessage}
            <div class="form-banner">
              <NoticeBanner message={model.errorMessage} tone="danger" />
            </div>
          {/if}

          <div class="field">
            <label class="field-label" for="cvv-question">{copy.questionLabel}</label>
            <textarea
              id="cvv-question"
              class="question-input"
              rows="3"
              placeholder={copy.questionPlaceholder}
              bind:value={model.question}
              disabled={model.isSubmitting}
            ></textarea>
          </div>

          <div class="field">
            <span class="field-label">{copy.methodLabel}</span>
            <div class="method-toggle" role="radiogroup" aria-label={copy.methodLabel}>
              <button
                type="button"
                role="radio"
                aria-checked={model.method === 'coins'}
                class="toggle-btn"
                class:active={model.method === 'coins'}
                disabled={model.isSubmitting}
                onclick={() => { model.method = 'coins'; }}
              >
                {copy.methodCoins}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={model.method === 'numbers'}
                class="toggle-btn"
                class:active={model.method === 'numbers'}
                disabled={model.isSubmitting}
                onclick={() => { model.method = 'numbers'; }}
              >
                {copy.methodNumbers}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={model.method === 'manual'}
                class="toggle-btn"
                class:active={model.method === 'manual'}
                disabled={model.isSubmitting}
                onclick={() => { model.method = 'manual'; }}
              >
                {copy.methodManual}
              </button>
            </div>
          </div>

          {#if model.method === 'coins'}
            <div class="coins-ritual">
              <div class="coins-status">
                <span class="ritual-title">{copy.coinTossLabel}</span>
                <span class="coins-count">Đã gieo: {model.coins.length}/6 hào</span>
              </div>

              <div class="tosses-display">
                {#each Array.from({ length: 6 }, (_, i) => i) as idx (idx)}
                  {@const val = model.coins[idx]}
                  <div class="toss-slot" class:filled={val !== undefined}>
                    <span class="slot-num">Hào {idx + 1}</span>
                    <span class="slot-val">
                      {val !== undefined ? (val % 2 === 1 ? '— Dương' : '- - Âm') : 'Chưa gieo'}
                    </span>
                  </div>
                {/each}
              </div>

              <div class="ritual-actions">
                <button
                  type="button"
                  class="btn-toss"
                  disabled={model.isSubmitting || model.coins.length >= 6}
                  onclick={() => model.tossCoin()}
                >
                  <Coins size={16} />
                  <span>{copy.tossCoinButton.replace('{count}', String(model.coins.length + 1))}</span>
                </button>
                <button
                  type="button"
                  class="btn-toss-all"
                  disabled={model.isSubmitting}
                  onclick={() => model.tossAllCoins()}
                >
                  <Sparkles size={16} />
                  <span>{copy.tossAllCoinsButton}</span>
                </button>
              </div>
            </div>
          {:else if model.method === 'numbers'}
            <div class="numbers-grid">
              <div class="num-field">
                <label for="num-upper" class="num-label">{copy.upperNumberLabel}</label>
                <input
                  id="num-upper"
                  type="number"
                  min="1"
                  max="999"
                  class="num-input"
                  bind:value={model.number1}
                  disabled={model.isSubmitting}
                />
              </div>
              <div class="num-field">
                <label for="num-lower" class="num-label">{copy.lowerNumberLabel}</label>
                <input
                  id="num-lower"
                  type="number"
                  min="1"
                  max="999"
                  class="num-input"
                  bind:value={model.number2}
                  disabled={model.isSubmitting}
                />
              </div>
            </div>
          {:else}
            <div class="manual-select">
              <label for="select-hex" class="field-label">{copy.selectHexagramLabel}</label>
              <select
                id="select-hex"
                class="hex-select"
                bind:value={model.hexagramId}
                disabled={model.isSubmitting}
              >
                {#each CHU_VAN_VUONG_HEXAGRAMS as hex (hex.id)}
                  <option value={hex.id}>Quẻ {hex.id}: {hex.name} ({hex.omenLabel})</option>
                {/each}
              </select>
            </div>
          {/if}

          <div class="submit-wrap">
            <PrimaryButton
              label={model.isSubmitting ? copy.castingLabel : copy.submitButton}
              loading={model.isSubmitting}
              onclick={() => model.submit()}
            />
          </div>

          <div class="safety-notice">
            <Shield size={16} class="shield-icon" />
            <p>{copy.safetyNotice}</p>
          </div>
        </section>
      {/if}
    </main>
  </div>
</div>

<style>
  .chuvanvuong-screen {
    min-height: 100dvh;
    overflow-x: hidden;
    background:
      radial-gradient(ellipse 75% 50% at 15% 0%, rgba(212, 175, 55, 0.15), transparent 60%),
      radial-gradient(ellipse 60% 45% at 85% 10%, rgba(168, 85, 247, 0.12), transparent 55%),
      linear-gradient(180deg, #0b0f19 0%, #05070d 100%);
    color: #f3f4f6;
    padding: 2rem 1rem 4rem;
  }

  .shell {
    max-width: 760px;
    margin: 0 auto;
  }

  .band {
    position: relative;
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .band-back {
    position: absolute;
    left: 0;
    top: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.2s;
  }

  .band-back:hover {
    color: #f3f4f6;
    background: rgba(255, 255, 255, 0.1);
  }

  .band-eyebrow {
    font-size: 0.75rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #d4af37;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  .band-title {
    font-size: 2rem;
    font-weight: 700;
    color: #f9fafb;
    margin: 0 0 0.75rem;
    font-family: serif;
  }

  .band-sub {
    font-size: 0.95rem;
    color: #9ca3af;
    max-width: 580px;
    margin: 0 auto;
    line-height: 1.5;
  }

  .cast-form {
    background: rgba(17, 24, 39, 0.7);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 1.25rem;
    padding: 2rem;
    backdrop-filter: blur(12px);
  }

  .form-banner {
    margin-bottom: 1.5rem;
  }

  .field {
    margin-bottom: 1.5rem;
  }

  .field-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #e5e7eb;
    margin-bottom: 0.5rem;
  }

  .question-input {
    width: 100%;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 0.75rem;
    padding: 0.875rem 1rem;
    color: #f9fafb;
    font-size: 0.95rem;
    line-height: 1.5;
    resize: vertical;
    transition: border-color 0.2s;
  }

  .question-input:focus {
    outline: none;
    border-color: #d4af37;
  }

  .method-toggle {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .toggle-btn {
    flex: 1;
    min-width: 160px;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    color: #9ca3af;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-btn.active {
    background: rgba(212, 175, 55, 0.15);
    border-color: #d4af37;
    color: #d4af37;
    font-weight: 600;
  }

  .coins-ritual {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1rem;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .coins-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .ritual-title {
    font-weight: 600;
    color: #e5e7eb;
    font-size: 0.9rem;
  }

  .coins-count {
    font-size: 0.85rem;
    color: #d4af37;
    font-weight: 600;
  }

  .tosses-display {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  .toss-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem 0.25rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px dashed rgba(255, 255, 255, 0.15);
    border-radius: 0.5rem;
    text-align: center;
  }

  .toss-slot.filled {
    background: rgba(212, 175, 55, 0.1);
    border-style: solid;
    border-color: rgba(212, 175, 55, 0.4);
  }

  .slot-num {
    font-size: 0.7rem;
    color: #9ca3af;
  }

  .slot-val {
    font-size: 0.75rem;
    font-weight: 600;
    color: #f3f4f6;
    margin-top: 0.25rem;
  }

  .toss-slot.filled .slot-val {
    color: #d4af37;
  }

  .ritual-actions {
    display: flex;
    gap: 0.75rem;
  }

  .btn-toss,
  .btn-toss-all {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    border-radius: 0.625rem;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-toss {
    background: #d4af37;
    color: #0b0f19;
    border: none;
  }

  .btn-toss:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-toss-all {
    background: rgba(255, 255, 255, 0.08);
    color: #e5e7eb;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .numbers-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .num-label {
    display: block;
    font-size: 0.85rem;
    color: #9ca3af;
    margin-bottom: 0.375rem;
  }

  .num-input {
    width: 100%;
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 0.75rem;
    color: #f9fafb;
    font-size: 1rem;
  }

  .hex-select {
    width: 100%;
    padding: 0.75rem 1rem;
    background: rgba(17, 24, 39, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 0.75rem;
    color: #f9fafb;
    font-size: 0.95rem;
  }

  .submit-wrap {
    margin-top: 1.5rem;
    display: flex;
    justify-content: center;
  }

  .safety-notice {
    margin-top: 1.5rem;
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: #6b7280;
    line-height: 1.4;
  }

  /* Result styles */
  .hexagram-card {
    background: rgba(17, 24, 39, 0.8);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 1.25rem;
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .hexagram-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 1rem;
    margin-bottom: 1rem;
  }

  .hexagram-num {
    font-size: 0.85rem;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .hexagram-name {
    font-size: 1.75rem;
    color: #f9fafb;
    margin: 0;
    font-family: serif;
    flex: 1;
    text-align: center;
  }

  .omen-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .omen-good {
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.4);
  }

  .omen-neutral {
    background: rgba(234, 179, 8, 0.15);
    color: #facc15;
    border: 1px solid rgba(234, 179, 8, 0.4);
  }

  .omen-bad {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.4);
  }

  .hexagram-trigrams {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    font-size: 0.95rem;
  }

  .trigram-label {
    color: #9ca3af;
  }

  .trigram-val {
    color: #d4af37;
    margin-left: 0.25rem;
  }

  .trigram-divider {
    color: #4b5563;
  }

  .card-section {
    margin-bottom: 1.5rem;
  }

  .section-heading {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #d4af37;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  .meaning-text {
    font-size: 1rem;
    line-height: 1.6;
    color: #e5e7eb;
  }

  .poem-box {
    background: rgba(0, 0, 0, 0.25);
    border-left: 3px solid #d4af37;
    padding: 1rem 1.25rem;
    border-radius: 0 0.75rem 0.75rem 0;
  }

  .poem-text {
    font-family: serif;
    font-style: italic;
    font-size: 1rem;
    line-height: 1.7;
    color: #f3f4f6;
    margin: 0;
  }

  .domains-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .domain-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.75rem;
    padding: 0.875rem;
  }

  .domain-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #d4af37;
    margin-bottom: 0.25rem;
    text-transform: uppercase;
  }

  .domain-desc {
    font-size: 0.85rem;
    color: #d1d5db;
    line-height: 1.4;
    margin: 0;
  }

  .advice-box {
    background: rgba(212, 175, 55, 0.08);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 0.75rem;
    padding: 1rem 1.25rem;
  }

  .advice-text {
    font-size: 0.95rem;
    color: #fef08a;
    line-height: 1.5;
    margin: 0;
  }

  .ai-reading {
    background: rgba(17, 24, 39, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1.25rem;
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .reading-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: #f9fafb;
    margin: 0 0 1rem;
  }

  .actions {
    display: flex;
    justify-content: center;
  }

  .btn-retake {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 0.75rem;
    color: #f3f4f6;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-retake:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  @media (max-width: 640px) {
    .domains-grid {
      grid-template-columns: 1fr;
    }

    .tosses-display {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
