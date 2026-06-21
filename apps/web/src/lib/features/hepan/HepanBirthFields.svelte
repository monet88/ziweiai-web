<script lang="ts">
  // HepanBirthFields (US-017c): cụm nhập thông tin sinh cho MỘT người trong ghép đôi Hợp Hôn.
  // Dùng lại SelectField + dropdown ngày/tháng/năm như BirthForm; toạ độ/múi giờ mặc định VN
  // (ẩn, điền sẵn createBirthFormDraft). State một chiều: đọc draft, đẩy thay đổi qua onField.
  import { SelectField, TextInputField, NoticeBanner } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import type { BirthFormDraft } from '$lib/features/birth-profile/birth-profile-draft';

  interface Props {
    idPrefix: string;
    draft: BirthFormDraft;
    disabled?: boolean;
    onField: <K extends keyof BirthFormDraft>(field: K, value: BirthFormDraft[K]) => void;
  }

  let { idPrefix, draft, disabled = false, onField }: Props = $props();

  const copy = viCopy.dashboard;
  const CURRENT_YEAR = new Date().getFullYear();
  const dayOptions = Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: String(i + 1) }));
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1), value: String(i + 1) }));
  const yearOptions = Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, i) => ({
    label: String(CURRENT_YEAR - i),
    value: String(CURRENT_YEAR - i),
  }));
  const genderOptions = [
    { label: copy.male, value: 'male' },
    { label: copy.female, value: 'female' },
    { label: copy.unknown, value: 'unknown' },
  ];
  const timeOptions = [
    { label: copy.knownTime, value: 'known' },
    { label: copy.unknownTime, value: 'unknown' },
  ];
</script>

<div class="fields">
  <div class="grid-3">
    <SelectField
      label={copy.day}
      fieldId={`${idPrefix}-birth-day`}
      value={draft.birthDay}
      options={dayOptions}
      placeholder={copy.dayPlaceholder}
      {disabled}
      onValueChange={(value) => onField('birthDay', value)}
    />
    <SelectField
      label={copy.month}
      fieldId={`${idPrefix}-birth-month`}
      value={draft.birthMonth}
      options={monthOptions}
      placeholder={copy.monthPlaceholder}
      {disabled}
      onValueChange={(value) => onField('birthMonth', value)}
    />
    <SelectField
      label={copy.year}
      fieldId={`${idPrefix}-birth-year`}
      value={draft.birthYear}
      options={yearOptions}
      placeholder={copy.yearPlaceholder}
      {disabled}
      onValueChange={(value) => onField('birthYear', value)}
    />
  </div>

  <SelectField
    label={copy.genderForChart}
    fieldId={`${idPrefix}-birth-gender`}
    value={draft.gender}
    options={genderOptions}
    {disabled}
    onValueChange={(value) => onField('gender', value as 'male' | 'female' | 'unknown')}
  />

  <SelectField
    label={copy.birthTimeCertainty}
    fieldId={`${idPrefix}-birth-time-certainty`}
    value={draft.isUnknownTime ? 'unknown' : 'known'}
    options={timeOptions}
    {disabled}
    onValueChange={(value) => onField('isUnknownTime', value === 'unknown')}
  />

  {#if draft.isUnknownTime}
    <NoticeBanner message={viCopy.warnings.unknownBirthTime} tone="warning" />
  {:else}
    <div class="grid-2">
      <TextInputField
        label={copy.hour}
        fieldId={`${idPrefix}-birth-hour`}
        type="number"
        value={draft.hour}
        {disabled}
        onValueChange={(value) => onField('hour', value)}
      />
      <TextInputField
        label={copy.minute}
        fieldId={`${idPrefix}-birth-minute`}
        type="number"
        value={draft.minute}
        {disabled}
        onValueChange={(value) => onField('minute', value)}
      />
    </div>
  {/if}
</div>

<style>
  .fields {
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

  @media (max-width: 480px) {
    .grid-2,
    .grid-3 {
      grid-template-columns: 1fr;
    }
  }
</style>
