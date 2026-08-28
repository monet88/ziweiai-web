<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { untrack } from 'svelte';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { PrimaryButton, NoticeBanner } from '$lib/components/ui';
  import MarkdownView from '$lib/features/explanation/MarkdownView.svelte';
  import NumerologyCard from './NumerologyCard.svelte';
  import { createNumerologyModel, type NumerologyCopy } from './numerology-model.svelte';

  interface Props {
    copy: NumerologyCopy;
  }

  let { copy }: Props = $props();

  const auth = getAuthStore();
  const model = untrack(() => createNumerologyModel({ auth, copy }));

  function goToDashboard(): void {
    void goto(resolve('/'));
  }

  function goToWallet(): void {
    void goto(resolve('/wallet'));
  }
</script>

<div class="numerology-screen">
  <div class="shell">
    <header class="band">
      <button
        type="button"
        class="band-back"
        aria-label={copy.returnToDashboard}
        onclick={goToDashboard}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M14 6l-6 6 6 6"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <p class="band-eyebrow">{copy.heroEyebrow}</p>
      <h1 class="band-title">{copy.heroTitle}</h1>
      <p class="band-sub">{copy.heroSubtitle}</p>
    </header>

    <main class="content">
      {#if model.calculatedResult}
        {@const res = model.calculatedResult}
        <section class="result-section" aria-live="polite">
          <div class="result-header">
            <h2 class="result-title">{copy.resultTitle}</h2>
            <p class="result-profile">
              <span class="profile-name">{model.fullName}</span>
              {#if model.birthDateString}
                <span class="profile-dob">({model.birthDateString})</span>
              {/if}
            </p>
          </div>

          <div class="cards-grid">
            <NumerologyCard
              title={copy.lifePathTitle}
              value={res.lifePath}
              description={copy.lifePathDesc}
              accentColor="#d4af37"
            />
            <NumerologyCard
              title={copy.destinyTitle}
              value={res.destiny}
              description={copy.destinyDesc}
              accentColor="#9d72e7"
            />
            <NumerologyCard
              title={copy.soulUrgeTitle}
              value={res.soulUrge}
              description={copy.soulUrgeDesc}
              accentColor="#38bdf8"
            />
            <NumerologyCard
              title={copy.personalityTitle}
              value={res.personality}
              description={copy.personalityDesc}
              accentColor="#34d399"
            />
          </div>

          {#if model.aiNarrative}
            <div class="ai-reading">
              <h3 class="reading-title">{copy.explanationTitle}</h3>
              <div class="reading-body">
                <MarkdownView markdown={model.aiNarrative} />
              </div>
            </div>
          {:else}
            <div class="ai-action-box">
              <div class="action-info">
                <p class="action-title">Khám phá ý nghĩa các con số</p>
                <p class="action-desc">
                  Nhận phân tích toàn diện về sự kết hợp giữa các con số, chu kỳ vận số, cơ hội và bài học từ AI.
                </p>
              </div>

              {#if model.explainErrorMessage}
                <div class="error-wrapper">
                  <NoticeBanner message={model.explainErrorMessage} tone="danger" />
                  {#if model.explainErrorMessage.includes('10 XU') || model.explainErrorMessage.includes('XU')}
                    <button type="button" class="recharge-btn" onclick={goToWallet}>
                      Nạp thêm XU ngay
                    </button>
                  {/if}
                </div>
              {/if}

              <div class="action-buttons">
                <PrimaryButton
                  label={model.isExplaining ? copy.explaining : copy.explainButton}
                  loading={model.isExplaining}
                  disabled={model.isExplaining}
                  onclick={() => model.requestExplain()}
                />
              </div>
            </div>
          {/if}

          <div class="footer-actions">
            <NoticeBanner message={copy.safetyNotice} tone="info" />
            <PrimaryButton
              label={copy.recalculateButton}
              variant="surface"
              onclick={() => model.reset()}
            />
          </div>
        </section>
      {:else}
        <section class="form-section">
          <div class="field">
            <label class="field-label" for="numerology-fullname">{copy.fullNameLabel}</label>
            <input
              id="numerology-fullname"
              type="text"
              class="text-input"
              placeholder={copy.fullNamePlaceholder}
              value={model.fullName}
              oninput={(event) => model.setFullName((event.currentTarget as HTMLInputElement).value)}
            />
          </div>

          <div class="field">
            <label class="field-label" for="numerology-dob">{copy.birthDateLabel}</label>
            <input
              id="numerology-dob"
              type="date"
              class="text-input date-input"
              value={model.birthDateString}
              oninput={(event) => model.setBirthDateString((event.currentTarget as HTMLInputElement).value)}
            />
          </div>

          {#if model.validationMessage}
            <NoticeBanner message={model.validationMessage} tone="danger" />
          {/if}

          <div class="submit-wrap">
            <PrimaryButton
              label={copy.calculateButton}
              onclick={() => model.calculate()}
            />
          </div>
        </section>
      {/if}
    </main>
  </div>
</div>

<style>
  .numerology-screen {
    min-height: 100vh;
    padding: 2rem 1rem 4rem;
    color: #f5f2ed;
    background: radial-gradient(circle at 50% 0%, #1a162b 0%, #0d0b14 100%);
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
    top: 0;
    left: 0;
    width: 2.5rem;
    height: 2.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #f5f2ed;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .band-back:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(212, 175, 55, 0.4);
  }

  .band-back svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .band-eyebrow {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: #d4af37;
    margin: 0 0 0.5rem;
    text-transform: uppercase;
  }

  .band-title {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.75rem;
    color: #ffffff;
    letter-spacing: -0.01em;
  }

  .band-sub {
    font-size: 0.95rem;
    line-height: 1.5;
    color: rgba(245, 242, 237, 0.7);
    max-width: 580px;
    margin: 0 auto;
  }

  .content {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    padding: 2rem;
    backdrop-filter: blur(12px);
  }

  @media (max-width: 640px) {
    .content {
      padding: 1.25rem;
    }
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .field-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #f5f2ed;
  }

  .text-input {
    width: 100%;
    padding: 0.85rem 1rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    color: #ffffff;
    font-size: 1rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    box-sizing: border-box;
  }

  .text-input:focus {
    outline: none;
    border-color: #d4af37;
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
  }

  .date-input::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
  }

  .submit-wrap {
    margin-top: 0.5rem;
  }

  .result-section {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .result-header {
    text-align: center;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .result-title {
    margin: 0 0 0.5rem;
    font-size: 1.4rem;
    color: #ffffff;
  }

  .result-profile {
    margin: 0;
    font-size: 1.05rem;
  }

  .profile-name {
    font-weight: 600;
    color: #d4af37;
  }

  .profile-dob {
    color: rgba(245, 242, 237, 0.6);
    margin-left: 0.35rem;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  @media (max-width: 640px) {
    .cards-grid {
      grid-template-columns: 1fr;
    }
  }

  .ai-action-box {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(157, 114, 231, 0.08) 100%);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .action-title {
    margin: 0 0 0.35rem;
    font-size: 1.15rem;
    font-weight: 700;
    color: #ffffff;
  }

  .action-desc {
    margin: 0;
    font-size: 0.9rem;
    color: rgba(245, 242, 237, 0.75);
    line-height: 1.45;
  }

  .error-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .recharge-btn {
    background: #d4af37;
    color: #0d0b14;
    font-weight: 600;
    font-size: 0.9rem;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .recharge-btn:hover {
    opacity: 0.9;
  }

  .ai-reading {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 1.5rem;
  }

  .reading-title {
    margin: 0 0 1rem;
    font-size: 1.25rem;
    font-weight: 700;
    color: #d4af37;
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
    padding-bottom: 0.5rem;
  }

  .reading-body {
    line-height: 1.6;
    color: rgba(245, 242, 237, 0.9);
  }

  .footer-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
  }
</style>
