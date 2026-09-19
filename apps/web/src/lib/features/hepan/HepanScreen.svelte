<script lang="ts">
  // HepanScreen (US-017c): ghép đôi Hợp Hôn — 2 cụm nhập sinh + chọn loại quan hệ + màn kết quả
  // (điểm tổng + mức + các chiều + diễn giải). Submit gọi POST /pairings. Nhãn toàn tiếng Việt.
  import { getAuthStore } from '$lib/auth/auth-context';
  import { AppScaffold, PrimaryButton, SelectField, NoticeBanner } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import type { PairingRelationType } from '@ziweiai/contracts';
  import { createHepanModel } from './hepan-model.svelte';
  import HepanBirthFields from './HepanBirthFields.svelte';

  const copy = viCopy.hepan;
  const auth = getAuthStore();
  const model = createHepanModel({ auth });

  const relationOptions = [
    { label: copy.relationLove, value: 'love' },
    { label: copy.relationBusiness, value: 'business' },
    { label: copy.relationFamily, value: 'family' },
  ];
</script>

<AppScaffold eyebrow={copy.heroEyebrow} title={copy.heroTitle} subtitle={copy.heroSubtitle}>
  {#if model.result}
    <section class="result celestial-card-glass" aria-live="polite">
      <div class="result-header">
        <p class="result-eyebrow">{copy.resultTitle}</p>
        <div class="result-score-ring">
          <p class="result-score">{model.result.compatibility.overallScore}<span class="result-max">/100</span></p>
        </div>
        <p class="result-level">{model.result.compatibility.level}</p>
      </div>

      <p class="narrative">{model.result.compatibility.narrative}</p>

      <div class="dimensions-wrapper">
        <p class="dimensions-title">{copy.dimensionsTitle}</p>
        <ul class="dimensions">
          {#each model.result.compatibility.dimensions as dimension (dimension.name)}
            <li class="dimension">
              <div class="dimension-head">
                <span class="dimension-name">{dimension.name}</span>
                <span class="dimension-score">{dimension.score}%</span>
              </div>
              <div class="progress-track">
                <div class="progress-bar" style="width: {dimension.score}%"></div>
              </div>
              <p class="dimension-desc">{dimension.description}</p>
            </li>
          {/each}
        </ul>
      </div>

      <div class="retake-action">
        <PrimaryButton label={copy.retakeButton} variant="surface" onclick={() => model.reset()} />
      </div>
    </section>
  {:else}
    <section class="form celestial-card-glass">
      <div class="relation-select-box">
        <SelectField
          label={copy.relationTypeLabel}
          fieldId="hepan-relation-type"
          value={model.relationType}
          options={relationOptions}
          disabled={model.isSubmitting}
          onValueChange={(value) => model.setRelationType(value as PairingRelationType)}
        />
      </div>

      <div class="people">
        <div class="person-card">
          <div class="person-header">
            <span class="person-badge">Chủ Mệnh 1</span>
            <h2 class="person-heading">{copy.primaryHeading}</h2>
          </div>
          <HepanBirthFields
            idPrefix="hepan-primary"
            draft={model.primary}
            disabled={model.isSubmitting}
            onField={(field, value) => model.setPrimaryField(field, value)}
          />
        </div>

        <div class="person-card">
          <div class="person-header">
            <span class="person-badge partner">Chủ Mệnh 2</span>
            <h2 class="person-heading">{copy.partnerHeading}</h2>
          </div>
          <HepanBirthFields
            idPrefix="hepan-partner"
            draft={model.partner}
            disabled={model.isSubmitting}
            onField={(field, value) => model.setPartnerField(field, value)}
          />
        </div>
      </div>

      {#if model.validationMessage}
        <NoticeBanner message={model.validationMessage} tone="danger" />
      {/if}
      {#if model.isError && model.errorMessage}
        <NoticeBanner message={model.errorMessage} tone="danger" />
      {/if}

      <div class="submit-action">
        <PrimaryButton
          label={copy.submitButton}
          loading={model.isSubmitting}
          onclick={() => model.submit()}
        />
      </div>
    </section>
  {/if}
</AppScaffold>

<style>
  .celestial-card-glass {
    position: relative;
    background: rgba(18, 12, 38, 0.75);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 24px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(212, 175, 55, 0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    padding: 32px 28px;
    max-width: 840px;
    margin: 0 auto;
  }

  .form,
  .result {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .relation-select-box {
    max-width: 320px;
  }

  .people {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .person-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    background: rgba(10, 7, 22, 0.6);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 18px;
    transition: border-color 0.2s ease, transform 0.2s ease;
  }

  .person-card:focus-within {
    border-color: rgba(212, 175, 55, 0.6);
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.15);
  }

  .person-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.15);
  }

  .person-badge {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.35);
    color: #ffd700;
  }

  .person-badge.partner {
    background: rgba(168, 85, 247, 0.15);
    border-color: rgba(168, 85, 247, 0.4);
    color: #c084fc;
  }

  .person-heading {
    margin: 0;
    font-family: 'Cinzel', 'Noto Serif', serif;
    font-size: 16px;
    font-weight: 700;
    color: #fce99f;
    letter-spacing: 0.02em;
  }

  .submit-action,
  .retake-action {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }

  /* Kết quả Hợp Hôn */
  .result-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
    padding: 24px 16px;
    background: radial-gradient(circle at center, rgba(212, 175, 55, 0.12) 0%, transparent 70%);
    border-radius: 20px;
    border: 1px solid rgba(212, 175, 55, 0.2);
  }

  .result-eyebrow {
    margin: 0;
    color: #e6ca65;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .result-score {
    margin: 0;
    font-size: 64px;
    font-weight: 900;
    line-height: 1;
    font-family: 'Cinzel', 'Noto Serif', serif;
    background: linear-gradient(135deg, #ffffff 0%, #ffd700 50%, #d4af37 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.4));
  }

  .result-max {
    font-size: 24px;
    color: rgba(223, 212, 184, 0.6);
    -webkit-text-fill-color: initial;
  }

  .result-level {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #fff2c4;
    text-shadow: 0 0 12px rgba(212, 175, 55, 0.4);
  }

  .narrative {
    margin: 0;
    font-size: 15px;
    line-height: 1.7;
    color: #dfd4b8;
    background: rgba(10, 7, 22, 0.5);
    padding: 20px;
    border-radius: 16px;
    border-left: 3px solid #ffd700;
  }

  .dimensions-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .dimensions-title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    font-family: 'Cinzel', 'Noto Serif', serif;
    color: #fce99f;
  }

  .dimensions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .dimension {
    background: rgba(10, 7, 22, 0.5);
    border: 1px solid rgba(212, 175, 55, 0.18);
    border-radius: 14px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .dimension-head {
    display: flex;
    justify-content: space-between;
    font-weight: 600;
    color: #f7eed8;
    font-size: 15px;
  }

  .dimension-score {
    color: #ffd700;
    font-weight: 700;
  }

  .progress-track {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #d4af37, #ffd700);
    border-radius: 999px;
    transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .dimension-desc {
    margin: 0;
    color: rgba(223, 212, 184, 0.8);
    font-size: 13px;
    line-height: 1.5;
  }

  @media (max-width: 640px) {
    .celestial-card-glass {
      padding: 20px 16px;
      border-radius: 18px;
    }

    .people {
      grid-template-columns: 1fr;
    }

    .result-score {
      font-size: 48px;
    }
  }

  /* Đồng bộ Theme Light Hoàng Gia */
  :global([data-theme="light"]) .celestial-card-glass {
    background: rgba(255, 255, 255, 0.88);
    border-color: rgba(212, 175, 55, 0.45);
    box-shadow: 0 16px 40px rgba(212, 175, 55, 0.12);
  }

  :global([data-theme="light"]) .person-card {
    background: rgba(248, 246, 240, 0.85);
    border-color: rgba(212, 175, 55, 0.35);
  }

  :global([data-theme="light"]) .person-badge {
    background: rgba(212, 175, 55, 0.18);
    color: #854d0e;
    border-color: rgba(212, 175, 55, 0.5);
  }

  :global([data-theme="light"]) .person-heading {
    color: #78350f;
  }

  :global([data-theme="light"]) .result-header {
    background: radial-gradient(circle at center, rgba(212, 175, 55, 0.15) 0%, transparent 70%);
    border-color: rgba(212, 175, 55, 0.3);
  }

  :global([data-theme="light"]) .result-eyebrow {
    color: #854d0e;
  }

  :global([data-theme="light"]) .result-score {
    background: linear-gradient(135deg, #180d38 0%, #b45309 60%, #78350f 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  :global([data-theme="light"]) .result-max {
    color: #78716c;
  }

  :global([data-theme="light"]) .result-level {
    color: #1c1917;
    text-shadow: none;
  }

  :global([data-theme="light"]) .narrative {
    background: rgba(248, 246, 240, 0.85);
    color: #292524;
    border-left-color: #d97706;
  }

  :global([data-theme="light"]) .dimensions-title {
    color: #78350f;
  }

  :global([data-theme="light"]) .dimension {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(212, 175, 55, 0.3);
  }

  :global([data-theme="light"]) .dimension-head {
    color: #1c1917;
  }

  :global([data-theme="light"]) .dimension-score {
    color: #b45309;
  }

  :global([data-theme="light"]) .dimension-desc {
    color: #57534e;
  }
</style>
