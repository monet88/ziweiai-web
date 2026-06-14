<script lang="ts">
  // BirthForm: form nhập thông tin sinh. Trình bày thuần — đọc model.draft, đẩy thay đổi
  // qua model.setField (state bất biến ở model), submit qua model.submit. Lỗi field chỉ
  // hiện sau khi đã thử submit (model.submitAttempted) để không nhuộm đỏ form lúc trống.
  //
  // Lịch lunar mới hiện loại tháng nhuận; biết giờ mới hiện giờ/phút (khớp ràng buộc
  // birthInputSchema). Toạ độ + múi giờ nhập tay (chưa có geocoding — xem warnings).
  import {
    PrimaryButton,
    TextInputField,
    SelectField,
    NoticeBanner,
  } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import type { DashboardModel } from './dashboard-model.svelte';
  import ChartSystemPicker from './ChartSystemPicker.svelte';

  interface Props {
    model: DashboardModel;
  }

  let { model }: Props = $props();

  const copy = viCopy.dashboard;

  const calendarOptions = [
    { label: copy.gregorianCalendar, value: 'gregorian' },
    { label: copy.lunarCalendar, value: 'lunar' },
  ];

  const leapOptions = [
    { label: copy.regularMonth, value: 'regular' },
    { label: copy.leapMonth, value: 'leap' },
  ];

  const genderOptions = [
    { label: copy.male, value: 'male' },
    { label: copy.female, value: 'female' },
    { label: copy.unknown, value: 'unknown' },
  ];

  const timeOptions = [
    { label: copy.knownTime, value: 'known' },
    { label: copy.unknownTime, value: 'unknown' },
  ];

  // Lỗi chỉ hiển thị sau lần submit đầu (UX). errorFor trả null khi chưa submit.
  function errorFor(field: keyof typeof model.fieldErrors): string | null {
    return model.submitAttempted ? (model.fieldErrors[field] ?? null) : null;
  }

  function handleSubmit(event: Event): void {
    event.preventDefault();
    model.submit();
  }
</script>

<form class="form" onsubmit={handleSubmit}>
  <ChartSystemPicker
    value={model.draft.chartSystem}
    disabled={model.isSubmitting}
    onchange={(system) => model.setField('chartSystem', system)}
  />

  <div class="grid-3">
    <TextInputField
      label={copy.day}
      fieldId="birth-day"
      type="number"
      value={model.draft.birthDay}
      onValueChange={(value) => model.setField('birthDay', value)}
      errorText={errorFor('birthDay')}
      disabled={model.isSubmitting}
    />
    <TextInputField
      label={copy.month}
      fieldId="birth-month"
      type="number"
      value={model.draft.birthMonth}
      onValueChange={(value) => model.setField('birthMonth', value)}
      errorText={errorFor('birthMonth')}
      disabled={model.isSubmitting}
    />
    <TextInputField
      label={copy.year}
      fieldId="birth-year"
      type="number"
      value={model.draft.birthYear}
      onValueChange={(value) => model.setField('birthYear', value)}
      errorText={errorFor('birthYear')}
      disabled={model.isSubmitting}
    />
  </div>

  <SelectField
    label={copy.calendar}
    fieldId="birth-calendar"
    value={model.draft.calendar}
    options={calendarOptions}
    disabled={model.isSubmitting}
    onValueChange={(value) => model.setField('calendar', value as 'gregorian' | 'lunar')}
  />

  {#if model.draft.calendar === 'lunar'}
    <SelectField
      label={copy.lunarMonthKind}
      fieldId="birth-leap-month"
      value={model.draft.isLeapMonth ? 'leap' : 'regular'}
      options={leapOptions}
      disabled={model.isSubmitting}
      onValueChange={(value) => model.setField('isLeapMonth', value === 'leap')}
    />
  {/if}

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

  {#if model.draft.isUnknownTime}
    <NoticeBanner message={viCopy.warnings.unknownBirthTime} tone="warning" />
  {:else}
    <div class="grid-2">
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
  {/if}

  <TextInputField
    label={copy.placeLabel}
    fieldId="birth-place"
    value={model.draft.placeLabel}
    placeholder={copy.locationPlaceholder}
    onValueChange={(value) => model.setField('placeLabel', value)}
    disabled={model.isSubmitting}
  />

  <div class="grid-2">
    <TextInputField
      label={copy.latitude}
      fieldId="birth-latitude"
      type="number"
      value={model.draft.latitude}
      onValueChange={(value) => model.setField('latitude', value)}
      errorText={errorFor('latitude')}
      disabled={model.isSubmitting}
    />
    <TextInputField
      label={copy.longitude}
      fieldId="birth-longitude"
      type="number"
      value={model.draft.longitude}
      onValueChange={(value) => model.setField('longitude', value)}
      errorText={errorFor('longitude')}
      disabled={model.isSubmitting}
    />
  </div>

  <TextInputField
    label={copy.timezone}
    fieldId="birth-timezone"
    value={model.draft.timezone}
    placeholder={copy.timezonePlaceholder}
    onValueChange={(value) => model.setField('timezone', value)}
    errorText={errorFor('timezone')}
    disabled={model.isSubmitting}
  />

  <NoticeBanner message={viCopy.warnings.manualLocation} tone="info" />

  {#if model.submitAttempted && !model.isValid}
    <NoticeBanner message={viCopy.dashboardValidation.formInvalid} tone="danger" />
  {/if}

  {#if model.isError && model.errorMessage}
    <NoticeBanner message={model.errorMessage} tone="danger" />
  {/if}

  <PrimaryButton
    label={copy.createChart}
    type="submit"
    loading={model.isSubmitting}
  />
</form>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .grid-2,
  .grid-3 {
    display: grid;
    gap: var(--space-md);
  }

  .grid-2 {
    grid-template-columns: 1fr 1fr;
  }

  .grid-3 {
    grid-template-columns: 1fr 1fr 1fr;
  }

  /* Màn hẹp (<480px): gom lưới về 1 cột để ô nhập không bị bóp hẹp/vỡ giao diện. */
  @media (max-width: 480px) {
    .grid-2,
    .grid-3 {
      grid-template-columns: 1fr;
    }
  }
</style>
