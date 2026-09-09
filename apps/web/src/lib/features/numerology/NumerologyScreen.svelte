<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { untrack } from 'svelte';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { AppScaffold, PrimaryButton, NoticeBanner } from '$lib/components/ui';
  import MarkdownView from '$lib/features/explanation/MarkdownView.svelte';
  import NumerologyCard from './NumerologyCard.svelte';
  import { createNumerologyModel, type NumerologyCopy } from './numerology-model.svelte';
  import { Sparkles, Compass, ShieldCheck } from 'lucide-svelte';

  interface Props {
    copy: NumerologyCopy;
  }

  let { copy }: Props = $props();

  const auth = getAuthStore();
  const model = untrack(() => createNumerologyModel({ auth, copy }));

  function goToWallet(): void {
    void goto(resolve('/wallet'));
  }
</script>

<AppScaffold eyebrow={copy.heroEyebrow} title={copy.heroTitle} subtitle={copy.heroSubtitle}>
  <div class="numerology-container">
    {#if model.calculatedResult}
      {@const res = model.calculatedResult}
      <section class="result-section celestial-card-glass" aria-live="polite">
        <div class="result-header">
          <div class="result-badge">
            <Sparkles class="badge-icon" />
            <span>Kết Quả Kim Tự Tháp Pythagoras</span>
          </div>
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
      <section class="form-section celestial-card-glass">
        <div class="section-header">
          <div class="section-badge">
            <Compass class="badge-icon" />
            <span>Thần Số Học Pythagoras</span>
          </div>
          <p class="section-subtitle">Giải mã mật mã rung động sóng năng lượng vũ trụ từ danh xưng và thời khắc sinh</p>
        </div>

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

        <div class="submit-wrapper">
          <PrimaryButton
            type="button"
            onclick={() => model.calculate()}
          >
            <div class="submit-btn-content">
              <Sparkles class="submit-sparkle-icon" />
              <span class="submit-btn-text">KHÁM PHÁ BẢN MỆNH THẦN SỐ</span>
            </div>
          </PrimaryButton>

          <div class="trust-footer">
            <ShieldCheck class="trust-icon" />
            <span>Hệ thống tính toán Pythagoras chuẩn quốc tế • Bảo mật dữ liệu cá nhân</span>
          </div>
        </div>
      </section>
    {/if}
  </div>
</AppScaffold>

<style>
  .numerology-container {
    max-width: 680px;
    margin: 0 auto;
    padding: 0.5rem 0 3rem;
  }

  .section-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .section-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #d4af37;
    background: rgba(212, 175, 55, 0.08);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 9999px;
    padding: 0.35rem 0.9rem;
    margin-bottom: 0.6rem;
  }

  :global(.badge-icon) {
    width: 1rem;
    height: 1rem;
    color: #d4af37;
  }

  .section-subtitle {
    font-size: 0.92rem;
    line-height: 1.55;
    color: rgba(255, 255, 255, 0.65);
    max-width: 520px;
    margin: 0 auto;
  }

  .celestial-card-glass {
    background: linear-gradient(145deg, rgba(16, 20, 32, 0.75) 0%, rgba(10, 14, 24, 0.88) 100%);
    border: 1px solid rgba(212, 175, 55, 0.22);
    box-shadow: 0 16px 40px -10px rgba(0, 0, 0, 0.55), 0 0 25px rgba(212, 175, 55, 0.06);
    border-radius: 20px;
    padding: 2rem;
    backdrop-filter: blur(16px);
  }

  @media (max-width: 640px) {
    .celestial-card-glass {
      padding: 1.25rem;
      border-radius: 16px;
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
    font-size: 0.85rem;
    font-weight: 600;
    color: #d4af37;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .text-input {
    width: 100%;
    padding: 0.9rem 1.1rem;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 12px;
    color: #f5f2ed;
    font-size: 1rem;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  .text-input:focus {
    outline: none;
    border-color: #d4af37;
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.18);
    background: rgba(0, 0, 0, 0.5);
  }

  .date-input::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
  }

  .submit-wrapper {
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .submit-btn-content {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  :global(.submit-sparkle-icon) {
    width: 1.1rem;
    height: 1.1rem;
    animation: pulse-spin 3s infinite linear;
  }

  @keyframes pulse-spin {
    0% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(180deg) scale(1.15); }
    100% { transform: rotate(360deg) scale(1); }
  }

  .submit-btn-text {
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  .trust-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.45);
    text-align: center;
  }

  :global(.trust-icon) {
    width: 0.95rem;
    height: 0.95rem;
    color: #d4af37;
    flex-shrink: 0;
  }

  .result-section {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .result-header {
    text-align: center;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid rgba(212, 175, 55, 0.15);
  }

  .result-title {
    margin: 0 0 0.5rem;
    font-size: 1.4rem;
    color: #ffffff;
    font-weight: 700;
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
    color: rgba(255, 255, 255, 0.6);
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
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(157, 114, 231, 0.1) 100%);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 16px;
    padding: 1.75rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .action-title {
    margin: 0 0 0.35rem;
    font-size: 1.2rem;
    font-weight: 700;
    color: #ffffff;
  }

  .action-desc {
    margin: 0;
    font-size: 0.92rem;
    color: rgba(255, 255, 255, 0.75);
    line-height: 1.5;
  }

  .error-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .recharge-btn {
    background: #d4af37;
    color: #0b0f19;
    font-weight: 700;
    font-size: 0.9rem;
    border: none;
    padding: 0.5rem 1.25rem;
    border-radius: 8px;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .recharge-btn:hover {
    opacity: 0.9;
  }

  .ai-reading {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 16px;
    padding: 1.75rem;
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
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.88);
  }

  .footer-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
  }

  /* ==================== LIGHT THEME OVERRIDES ==================== */
  :global([data-theme="light"]) .section-badge {
    background: rgba(180, 130, 40, 0.12);
    border-color: rgba(180, 130, 40, 0.35);
    color: #854d0e;
  }

  :global([data-theme="light"]) .section-subtitle {
    color: #57534e;
  }

  :global([data-theme="light"]) .celestial-card-glass {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 246, 240, 0.98) 100%);
    border: 1px solid rgba(180, 130, 40, 0.35);
    box-shadow: 0 16px 40px -10px rgba(180, 130, 40, 0.15), 0 0 30px rgba(180, 130, 40, 0.08);
  }

  :global([data-theme="light"]) .field-label {
    color: #854d0e;
  }

  :global([data-theme="light"]) .text-input {
    background: #ffffff;
    border-color: rgba(180, 130, 40, 0.35);
    color: #1c1917;
  }

  :global([data-theme="light"]) .text-input:focus {
    background: #ffffff;
    border-color: #b48228;
    box-shadow: 0 0 0 3px rgba(180, 130, 40, 0.2);
  }

  :global([data-theme="light"]) .date-input::-webkit-calendar-picker-indicator {
    filter: none;
  }

  :global([data-theme="light"]) .trust-footer {
    color: #78716c;
  }

  :global([data-theme="light"]) .result-title,
  :global([data-theme="light"]) .action-title {
    color: #1c1917;
  }

  :global([data-theme="light"]) .profile-dob,
  :global([data-theme="light"]) .action-desc {
    color: #57534e;
  }

  :global([data-theme="light"]) .ai-action-box {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(157, 114, 231, 0.08) 100%);
    border-color: rgba(180, 130, 40, 0.35);
  }

  :global([data-theme="light"]) .ai-reading {
    background: #ffffff;
    border-color: rgba(180, 130, 40, 0.3);
  }

  :global([data-theme="light"]) .reading-body {
    color: #292524;
  }
</style>
