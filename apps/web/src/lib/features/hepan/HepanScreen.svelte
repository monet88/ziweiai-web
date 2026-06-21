<script lang="ts">
  // HepanScreen (US-017c): ghép đôi Hợp Hôn — 2 cụm nhập sinh + chọn loại quan hệ + màn kết quả
  // (điểm tổng + mức + các chiều + diễn giải). Submit gọi POST /pairings. Nhãn toàn tiếng Việt.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
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

  function goToDashboard(): void {
    void goto(resolve('/'));
  }
</script>

<AppScaffold eyebrow={copy.heroEyebrow} title={copy.heroTitle} subtitle={copy.heroSubtitle}>
  {#snippet action()}
    <PrimaryButton label={copy.returnToDashboard} variant="surface" onclick={goToDashboard} />
  {/snippet}

  {#if model.result}
    <section class="result" aria-live="polite">
      <p class="result-eyebrow">{copy.resultTitle}</p>
      <p class="result-score">{model.result.compatibility.overallScore}<span class="result-max">/100</span></p>
      <p class="result-level">{model.result.compatibility.level}</p>
      <p class="narrative">{model.result.compatibility.narrative}</p>

      <p class="dimensions-title">{copy.dimensionsTitle}</p>
      <ul class="dimensions">
        {#each model.result.compatibility.dimensions as dimension (dimension.name)}
          <li class="dimension">
            <div class="dimension-head">
              <span class="dimension-name">{dimension.name}</span>
              <span class="dimension-score">{dimension.score}%</span>
            </div>
            <p class="dimension-desc">{dimension.description}</p>
          </li>
        {/each}
      </ul>
      <PrimaryButton label={copy.retakeButton} variant="surface" onclick={() => model.reset()} />
    </section>
  {:else}
    <section class="form">
      <SelectField
        label={copy.relationTypeLabel}
        fieldId="hepan-relation-type"
        value={model.relationType}
        options={relationOptions}
        disabled={model.isSubmitting}
        onValueChange={(value) => model.setRelationType(value as PairingRelationType)}
      />

      <div class="people">
        <div class="person">
          <h2 class="person-heading">{copy.primaryHeading}</h2>
          <HepanBirthFields
            idPrefix="hepan-primary"
            draft={model.primary}
            disabled={model.isSubmitting}
            onField={(field, value) => model.setPrimaryField(field, value)}
          />
        </div>
        <div class="person">
          <h2 class="person-heading">{copy.partnerHeading}</h2>
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

      <PrimaryButton
        label={copy.submitButton}
        loading={model.isSubmitting}
        onclick={() => model.submit()}
      />
    </section>
  {/if}
</AppScaffold>

<style>
  .form,
  .result {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    max-width: 760px;
  }

  .people {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-lg);
  }

  .person {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .person-heading {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }

  .result-eyebrow {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 14px;
    text-transform: uppercase;
  }

  .result-score {
    margin: 0;
    font-size: 48px;
    font-weight: 700;
    line-height: 1;
  }

  .result-max {
    font-size: 20px;
    color: var(--color-text-muted);
  }

  .result-level {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .narrative {
    margin: 0;
    line-height: 1.6;
  }

  .dimensions-title {
    margin: 0;
    font-weight: 600;
  }

  .dimensions {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .dimension {
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    padding: var(--space-md);
  }

  .dimension-head {
    display: flex;
    justify-content: space-between;
    font-weight: 600;
  }

  .dimension-desc {
    margin: 4px 0 0;
    color: var(--color-text-muted);
    font-size: 14px;
  }

  @media (max-width: 640px) {
    .people {
      grid-template-columns: 1fr;
    }
  }
</style>
