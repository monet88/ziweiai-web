<script lang="ts">
  // BirthForm: form nhập thông tin sinh theo chuẩn phong cách Celestial Luxury.
  // Trình bày thuần — đọc model.draft, đẩy thay đổi qua model.setField, submit qua model.submit.
  import {
    PrimaryButton,
    SelectField,
    TextInputField,
    NoticeBanner,
  } from '$lib/components/ui';
  import { page } from '$app/state';
  import { fade, slide } from 'svelte/transition';
  import { viCopy } from '$lib/i18n/vi';
  import type { DashboardModel } from './dashboard-model.svelte';
  import ChartSystemPicker from './ChartSystemPicker.svelte';
  import BirthSkeleton from './BirthSkeleton.svelte';
  import BirthTimeEstimatorModal from './BirthTimeEstimatorModal.svelte';
  import {
    Compass,
    Calendar,
    User,
    Clock,
    Sparkles,
    ShieldCheck
  } from 'lucide-svelte';

  interface Props {
    model: DashboardModel;
  }

  let { model }: Props = $props();

  const copy = viCopy.dashboard;

  const CURRENT_YEAR = new Date().getFullYear();
  const EARLIEST_YEAR = 1900;
  const dayOptions = Array.from({ length: 31 }, (_, index) => {
    const value = String(index + 1);
    return { label: `Ngày ${value}`, value };
  });
  const monthOptions = Array.from({ length: 12 }, (_, index) => {
    const value = String(index + 1);
    return { label: `Tháng ${value}`, value };
  });
  const yearOptions = Array.from({ length: CURRENT_YEAR - EARLIEST_YEAR + 1 }, (_, index) => {
    const value = String(CURRENT_YEAR - index);
    return { label: `Năm ${value}`, value };
  });

  const genderOptions = [
    { label: copy.male, value: 'male' },
    { label: copy.female, value: 'female' },
    { label: copy.unknown, value: 'unknown' },
  ];

  const timeOptions = [
    { label: copy.knownTime, value: 'known' },
    { label: copy.unknownTime, value: 'unknown' },
  ];

  let isEstimatorOpen = $state(false);

  $effect(() => {
    const estHour = page.url.searchParams.get('estimatedHour');
    const estMin = page.url.searchParams.get('estimatedMinute');
    if (estHour !== null && estMin !== null) {
      model.setField('isUnknownTime', false);
      model.setField('hour', estHour);
      model.setField('minute', estMin);
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete('estimatedHour');
        url.searchParams.delete('estimatedMinute');
        window.history.replaceState({}, '', url.pathname + (url.search || ''));
      }
    }
  });

  const isZiweiMissingBirthTime = $derived(
    model.draft.chartSystem === 'zi-wei-dou-shu' && model.draft.isUnknownTime,
  );

  const submitButtonText = $derived.by(() => {
    if (isZiweiMissingBirthTime) {
      return 'ƯỚC LƯỢNG GIỜ SINH ĐỂ LẬP TỬ VI';
    }
    switch (model.draft.chartSystem) {
      case 'zi-wei-dou-shu':
        return 'KHỞI TẠO THIÊN BÀN 12 CUNG';
      case 'ba-zi':
        return model.draft.isUnknownTime ? 'LẬP BÁT TỰ TAM TRỤ (KHUYẾT GIỜ)' : 'LẬP LÁ SỐ BÁT TỰ TỨ TRỤ';
      case 'mangpai':
        return model.draft.isUnknownTime ? 'LẬP BÁT TỰ MANH PHÁI TAM TRỤ' : 'LẬP BÁT TỰ MANH PHÁI';
      case 'mei-hua-yi-shu':
        return 'KHỞI QUẺ MAI HOA DỊCH SỐ';
      case 'liu-yao':
        return 'GIEO QUẺ LỤC HÀO KINH DỊCH';
      case 'da-liu-ren':
        return 'LẬP KHÓA ĐẠI LỤC NHÂM';
      case 'qi-men-dun-jia':
        return 'BÀY TRẬN KỲ MÔN ĐỘN GIÁP';
      default:
        return 'LẬP LÁ SỐ THUẬT SỐ';
    }
  });

  function errorFor(field: keyof typeof model.fieldErrors): string | null {
    return model.submitAttempted ? (model.fieldErrors[field] ?? null) : null;
  }

  function handleSubmit(event: Event): void {
    event.preventDefault();
    if (isZiweiMissingBirthTime) {
      isEstimatorOpen = true;
      return;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(50);
      } catch {
        // Ignore fallback
      }
    }
    model.submit();
  }
</script>

{#if model.isSubmitting}
  <div class="skeleton-container" in:fade={{ duration: 300, delay: 200 }} out:fade={{ duration: 200 }}>
    <BirthSkeleton />
  </div>
{:else}
<form class="form" onsubmit={handleSubmit} in:fade={{ duration: 300, delay: 100 }} out:fade={{ duration: 200 }}>
  <!-- Section 1: Hệ Thuật Số -->
  <div class="celestial-card">
    <div class="card-header">
      <div class="title-with-icon">
        <Compass class="section-icon" />
        <h4 class="section-title">Hệ Thuật Số Bản Mệnh</h4>
      </div>
      <span class="card-badge">Khâm Thiên Giám</span>
    </div>
    <div class="card-body">
      <ChartSystemPicker
        value={model.draft.chartSystem}
        disabled={model.isSubmitting}
        onchange={(system) => model.setField('chartSystem', system)}
      />
    </div>
  </div>

  <!-- Section 2: Thời Khắc Giáng Sinh -->
  <div class="celestial-card">
    <div class="card-header">
      <div class="title-with-icon">
        <Calendar class="section-icon" />
        <h4 class="section-title">Thời Khắc Giáng Sinh</h4>
      </div>
      <span class="card-badge gold">Dương Lịch Chuẩn</span>
    </div>
    <div class="card-body">
      <div class="date-grid">
        <SelectField
          label={copy.day}
          fieldId="birth-day"
          value={model.draft.birthDay}
          options={dayOptions}
          placeholder={copy.dayPlaceholder}
          onValueChange={(value) => model.setField('birthDay', value)}
          errorText={errorFor('birthDay')}
          disabled={model.isSubmitting}
        />
        <SelectField
          label={copy.month}
          fieldId="birth-month"
          value={model.draft.birthMonth}
          options={monthOptions}
          placeholder={copy.monthPlaceholder}
          onValueChange={(value) => model.setField('birthMonth', value)}
          errorText={errorFor('birthMonth')}
          disabled={model.isSubmitting}
        />
        <SelectField
          label={copy.year}
          fieldId="birth-year"
          value={model.draft.birthYear}
          options={yearOptions}
          placeholder={copy.yearPlaceholder}
          onValueChange={(value) => model.setField('birthYear', value)}
          errorText={errorFor('birthYear')}
          disabled={model.isSubmitting}
        />
      </div>
      <p class="solar-hint">
        <span>✦</span> {copy.solarDateHint}
      </p>
    </div>
  </div>

  <!-- Section 3: Nhân Mệnh & Giờ Sinh -->
  <div class="celestial-card">
    <div class="card-header">
      <div class="title-with-icon">
        <User class="section-icon" />
        <h4 class="section-title">Nhân Mệnh & Khắc Giờ Can Chi</h4>
      </div>
    </div>
    <div class="card-body">
      <div class="two-col-grid">
        <SelectField
          label={copy.genderForChart}
          fieldId="birth-gender"
          value={model.draft.gender}
          options={genderOptions}
          disabled={model.isSubmitting}
          onValueChange={(value) => model.setField('gender', value as 'male' | 'female' | 'unknown')}
        />

        <SelectField
          label={copy.birthTimeCertainty}
          fieldId="birth-time-certainty"
          value={model.draft.isUnknownTime ? 'unknown' : 'known'}
          options={timeOptions}
          disabled={model.isSubmitting}
          onValueChange={(value) => model.setField('isUnknownTime', value === 'unknown')}
        />
      </div>

      {#if model.draft.isUnknownTime}
        <div class="unknown-time-guidance mt-3" transition:slide={{ duration: 250 }}>
          <div class="unknown-time-alert">
            <div class="alert-icon-col">
              <Clock class="alert-clock-icon" />
            </div>
            <div class="alert-body">
              <h5 class="alert-title">Lưu Ý Quan Trọng Về Giờ Sinh</h5>
              <p class="alert-text">
                {#if model.draft.chartSystem === 'zi-wei-dou-shu'}
                  Tử Vi Đẩu Số <strong>bắt buộc cần giờ sinh</strong> để an vị trí Cung Mệnh, Thân và 14 chính tinh. Nếu thiếu giờ sinh, hệ thống không thể dựng thiên bàn 12 cung.
                {:else if model.draft.chartSystem === 'ba-zi' || model.draft.chartSystem === 'mangpai'}
                  Bát Tự Tứ Trụ nếu thiếu giờ sinh sẽ chỉ an được <strong>Tam Trụ (6 chữ)</strong>, khuyết mất Trụ Giờ (đại diện Cung Con Cái và hậu vận).
                {:else}
                  Thiếu mốc giờ sinh cụ thể có thể hạn chế độ sâu của bài luận giải học thuật.
                {/if}
              </p>
              <div class="alert-actions">
                <button
                  type="button"
                  class="btn-estimate-trigger"
                  onclick={() => (isEstimatorOpen = true)}
                >
                  <Sparkles size={14} class="btn-sparkle" />
                  <span>Tra cứu & Ước lượng 12 Canh Giờ Sinh Dân Gian</span>
                </button>
                {#if model.draft.chartSystem === 'zi-wei-dou-shu'}
                  <button
                    type="button"
                    class="btn-switch-system"
                    onclick={() => model.setField('chartSystem', 'ba-zi')}
                  >
                    <span>Hoặc chuyển sang Lập Bát Tự (xem Tam Trụ)</span>
                  </button>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div class="time-input-group mt-3" transition:slide={{ duration: 250 }}>
          <div class="time-title">
            <Clock class="time-icon" />
            <span>Giờ và Phút Sinh (00:00 – 23:59)</span>
          </div>
          <div class="two-col-grid">
            <TextInputField
              label={copy.hour}
              fieldId="birth-hour"
              type="number"
              value={model.draft.hour}
              onValueChange={(value) => model.setField('hour', value)}
              errorText={errorFor('hour')}
              disabled={model.isSubmitting}
            />
            <TextInputField
              label={copy.minute}
              fieldId="birth-minute"
              type="number"
              value={model.draft.minute}
              onValueChange={(value) => model.setField('minute', value)}
              errorText={errorFor('minute')}
              disabled={model.isSubmitting}
            />
          </div>
        </div>
      {/if}
    </div>
  </div>

  {#if model.submitAttempted && !model.isValid}
    <NoticeBanner message={viCopy.dashboardValidation.formInvalid} tone="danger" />
  {/if}

  {#if model.isError && model.errorMessage}
    <NoticeBanner message={model.errorMessage} tone="danger" />
  {/if}

  <!-- Submit Action Bar Hoàng Gia -->
  <div class="submit-wrapper">
    <PrimaryButton
      type="submit"
      loading={model.isSubmitting}
    >
      <div class="submit-btn-content">
        <Sparkles class="submit-sparkle-icon" />
        <span class="submit-btn-text">{submitButtonText}</span>
      </div>
    </PrimaryButton>

    <div class="trust-footer">
      <ShieldCheck class="trust-icon" />
      <span>Phép an sao Khâm Thiên Giám • Dữ liệu mã hóa bảo mật</span>
    </div>
  </div>
</form>

<BirthTimeEstimatorModal
  isOpen={isEstimatorOpen}
  onClose={() => (isEstimatorOpen = false)}
  onSelect={(hour, minute) => {
    model.setField('isUnknownTime', false);
    model.setField('hour', hour);
    model.setField('minute', minute);
  }}
/>
{/if}

<style>
  .skeleton-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 420px;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Thẻ bài phong thủy Celestial Luxury */
  .celestial-card {
    background: rgba(24, 18, 44, 0.65);
    border: 1px solid rgba(212, 175, 55, 0.22);
    border-radius: 18px;
    padding: 16px 18px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .celestial-card:focus-within {
    border-color: rgba(212, 175, 55, 0.45);
    box-shadow: 0 4px 25px rgba(0, 0, 0, 0.35), 0 0 15px rgba(212, 175, 55, 0.12);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .title-with-icon {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  :global(.section-icon) {
    width: 15px;
    height: 15px;
    color: #ffd700;
  }

  .section-title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #e8dcc4;
  }

  .card-badge {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(232, 220, 196, 0.8);
  }

  .card-badge.gold {
    background: rgba(212, 175, 55, 0.12);
    border-color: rgba(212, 175, 55, 0.35);
    color: #ffd700;
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* Grid ngày tháng năm sinh */
  .date-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1.2fr;
    gap: 10px;
  }

  @media (max-width: 440px) {
    .date-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }

  /* Grid 2 cột cho Giới tính & Giờ */
  .two-col-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  @media (max-width: 480px) {
    .two-col-grid {
      grid-template-columns: 1fr;
    }
  }

  .time-input-group {
    padding-top: 10px;
    border-top: 1px dashed rgba(212, 175, 55, 0.2);
  }

  .time-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #ffd700;
    margin-bottom: 10px;
  }

  :global(.time-icon) {
    width: 13px;
    height: 13px;
    color: #ffd700;
  }

  .solar-hint {
    margin: 2px 0 0;
    color: rgba(226, 216, 184, 0.65);
    font-size: 12px;
    line-height: 1.4;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .solar-hint span {
    color: #ffd700;
  }

  .mt-3 {
    margin-top: 12px;
  }

  /* Submit Action Wrapper Hoàng Gia */
  .submit-wrapper {
    position: sticky;
    bottom: -24px; /* Offset content padding */
    padding: 16px 0 6px;
    background: linear-gradient(180deg, transparent 0%, rgba(11, 8, 22, 0.95) 25%, rgba(11, 8, 22, 1) 100%);
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 10px;
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
    transform: translateY(-1.5px);
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

  /* Unknown Time Guidance Alert */
  .unknown-time-guidance {
    margin-top: 12px;
  }

  .unknown-time-alert {
    display: flex;
    gap: 14px;
    padding: 16px;
    background: linear-gradient(135deg, rgba(212, 168, 83, 0.12) 0%, rgba(26, 20, 38, 0.95) 100%);
    border: 1px solid rgba(212, 168, 83, 0.5);
    border-radius: 14px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .alert-icon-col {
    display: flex;
    align-items: flex-start;
    padding-top: 2px;
  }

  :global(.alert-clock-icon) {
    width: 20px;
    height: 20px;
    color: #ffd700;
    flex-shrink: 0;
  }

  .alert-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .alert-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: #ffd700;
    letter-spacing: -0.01em;
  }

  .alert-text {
    margin: 0;
    font-size: 0.88rem;
    color: #fdf8ea;
    line-height: 1.55;
  }

  .alert-text strong {
    color: #ffd700;
    font-weight: 700;
  }

  .alert-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 6px;
  }

  .btn-estimate-trigger {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 15px;
    border-radius: 8px;
    background: rgba(212, 168, 83, 0.25);
    border: 1px solid #ffd700;
    color: #ffd700;
    font-size: 0.84rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-estimate-trigger:hover {
    background: rgba(212, 168, 83, 0.4);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(212, 168, 83, 0.3);
  }

  .btn-switch-system {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(212, 168, 83, 0.35);
    color: #e2d8b8;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-switch-system:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #ffd700;
    border-color: #ffd700;
  }

  :global(.btn-sparkle) {
    color: currentColor;
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
    font-size: 11px;
    color: rgba(226, 216, 184, 0.6);
  }

  :global(.trust-icon) {
    width: 13px;
    height: 13px;
    color: #ffd700;
  }

  /* Tinh chỉnh các trường Select & Input bên trong Form để đồng bộ Celestial Luxury */
  :global(.celestial-card .select),
  :global(.celestial-card .input) {
    background: rgba(12, 9, 24, 0.85) !important;
    border: 1px solid rgba(212, 175, 55, 0.3) !important;
    border-radius: 12px !important;
    color: #f7eed8 !important;
    padding: 12px 14px !important;
    font-size: 16px !important;
    line-height: 1.4 !important;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }

  :global(.celestial-card .select:hover),
  :global(.celestial-card .input:hover) {
    border-color: rgba(212, 175, 55, 0.6) !important;
    background: rgba(18, 14, 34, 0.95) !important;
  }

  :global(.celestial-card .select:focus),
  :global(.celestial-card .input:focus) {
    border-color: #ffd700 !important;
    box-shadow: 0 0 16px rgba(212, 175, 55, 0.3) !important;
    outline: none !important;
  }

  :global(.celestial-card .label) {
    color: #dfd4b8 !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    letter-spacing: 0.03em !important;
  }

  :global(.celestial-card .select-chevron) {
    color: #ffd700 !important;
    right: 12px !important;
  }

  /* Option dropdown styling trên browser */
  :global(.celestial-card .select option) {
    background: #140f28 !important;
    color: #f7eed8 !important;
    font-size: 16px !important;
    padding: 10px 14px !important;
  }

  /* Đồng bộ Theme Light Hoàng Gia */
  :global([data-theme="light"]) .celestial-card {
    background: rgba(255, 255, 255, 0.88);
    border-color: rgba(212, 175, 55, 0.4);
    box-shadow: 0 8px 24px rgba(212, 175, 55, 0.1);
  }

  :global([data-theme="light"]) .section-title {
    color: #180d38;
  }

  :global([data-theme="light"]) :global(.section-icon) {
    color: #b45309;
  }

  :global([data-theme="light"]) .card-badge.gold {
    background: rgba(212, 175, 55, 0.18);
    border-color: rgba(212, 175, 55, 0.4);
    color: #854d0e;
  }

  :global([data-theme="light"]) .time-title {
    color: #854d0e;
  }

  :global([data-theme="light"]) .time-input-group {
    border-top-color: rgba(212, 175, 55, 0.25);
  }

  :global([data-theme="light"]) .submit-wrapper {
    background: linear-gradient(180deg, transparent 0%, rgba(250, 248, 245, 0.92) 25%, rgba(244, 240, 230, 0.98) 100%);
  }

  :global([data-theme="light"]) .trust-footer {
    color: #78716c;
  }

  :global([data-theme="light"]) :global(.trust-icon) {
    color: #b45309;
  }

  :global([data-theme="light"]) :global(.celestial-card .select),
  :global([data-theme="light"]) :global(.celestial-card .input) {
    background: rgba(255, 255, 255, 0.95) !important;
    border-color: rgba(212, 175, 55, 0.35) !important;
    color: #1c1917 !important;
    font-size: 16px !important;
  }

  :global([data-theme="light"]) :global(.celestial-card .select:hover),
  :global([data-theme="light"]) :global(.celestial-card .input:hover) {
    border-color: #b45309 !important;
    background: #ffffff !important;
  }

  :global([data-theme="light"]) :global(.celestial-card .select:focus),
  :global([data-theme="light"]) :global(.celestial-card .input:focus) {
    border-color: #b45309 !important;
    box-shadow: 0 0 16px rgba(212, 175, 55, 0.25) !important;
  }

  :global([data-theme="light"]) :global(.celestial-card .label) {
    color: #78350f !important;
    font-size: 14px !important;
    font-weight: 700 !important;
  }

  :global([data-theme="light"]) .solar-hint {
    color: #78350f !important;
    font-weight: 500 !important;
  }

  :global([data-theme="light"]) .solar-hint span {
    color: #b45309 !important;
  }

  :global([data-theme="light"]) :global(.celestial-card .select-chevron) {
    color: #b45309 !important;
  }

  :global([data-theme="light"]) :global(.celestial-card .select option) {
    background: #ffffff !important;
    color: #1c1917 !important;
    font-size: 16px !important;
    padding: 10px 14px !important;
  }

  /* Light Theme Cảnh Báo Giờ Sinh Tương Phản Cao */
  :global([data-theme="light"]) .unknown-time-alert {
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%) !important;
    border: 1px solid #f59e0b !important;
    box-shadow: 0 4px 18px rgba(217, 119, 6, 0.15) !important;
  }

  :global([data-theme="light"]) :global(.alert-clock-icon) {
    color: #b45309 !important;
  }

  :global([data-theme="light"]) .alert-title {
    color: #92400e !important;
  }

  :global([data-theme="light"]) .alert-text {
    color: #78350f !important;
  }

  :global([data-theme="light"]) .alert-text strong {
    color: #92400e !important;
  }

  :global([data-theme="light"]) .btn-estimate-trigger {
    background: #d97706 !important;
    border-color: #b45309 !important;
    color: #ffffff !important;
    box-shadow: 0 2px 8px rgba(217, 119, 6, 0.25) !important;
  }

  :global([data-theme="light"]) .btn-estimate-trigger:hover {
    background: #b45309 !important;
    border-color: #78350f !important;
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.35) !important;
  }

  :global([data-theme="light"]) .btn-switch-system {
    background: rgba(255, 255, 255, 0.95) !important;
    border-color: #d97706 !important;
    color: #92400e !important;
  }

  :global([data-theme="light"]) .btn-switch-system:hover {
    background: #fef3c7 !important;
    border-color: #b45309 !important;
    color: #78350f !important;
  }
</style>

