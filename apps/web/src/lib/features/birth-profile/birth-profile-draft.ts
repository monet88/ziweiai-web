import type { ChartSystem, CreateChartRequest } from '@ziweiai/contracts';
import { viCopy } from '$lib/i18n/vi';

export type BirthFormDraft = {
  chartSystem: ChartSystem;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  calendar: 'gregorian' | 'lunar';
  isLeapMonth: boolean;
  explanationLanguage: string;
  gender: 'male' | 'female' | 'unknown';
  hour: string;
  isUnknownTime: boolean;
  latitude: string;
  longitude: string;
  minute: string;
  placeLabel: string;
  timezone: string;
};

/** Trường có thể gắn lỗi xác thực (khớp khoá vi.ts dashboardValidation). */
export type BirthFormFieldErrors = Partial<{
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  hour: string;
  minute: string;
  latitude: string;
  longitude: string;
  timezone: string;
}>;

/**
 * Draft mặc định cho form (port từ Expo defaultBirthFormState).
 * chartSystem nhận từ wrapper hệ (US-007) qua initialChartSystem; mặc định Tử Vi.
 * Toạ độ/múi giờ để trống — người dùng nhập tay (chưa có tìm kiếm địa điểm, xem warnings).
 */
export function createBirthFormDraft(initialChartSystem: ChartSystem = 'zi-wei-dou-shu'): BirthFormDraft {
  return {
    chartSystem: initialChartSystem,
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    calendar: 'gregorian',
    isLeapMonth: false,
    explanationLanguage: viCopy.dashboard.explanationLanguageDefault,
    gender: 'unknown',
    hour: '',
    isUnknownTime: false,
    latitude: '',
    longitude: '',
    minute: '',
    placeLabel: '',
    timezone: '',
  };
}

function isIntInRange(value: string, min: number, max: number): boolean {
  const trimmed = value.trim();
  if (trimmed === '') {
    return false;
  }
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max;
}

function isNumberInRange(value: string, min: number, max: number): boolean {
  const trimmed = value.trim();
  if (trimmed === '') {
    return false;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max;
}

/**
 * Xác thực thuần draft → lỗi từng trường tiếng Việt. Logic này phản chiếu ràng buộc
 * birthInputSchema (@ziweiai/contracts) ở phía client để chặn submit sớm + báo lỗi
 * trước khi gọi API; backend vẫn là nguồn kiểm tra cuối. KHÔNG ghi ngược state —
 * dùng làm $derived trong dashboard-model.
 *
 * Quy ước theo bất biến (parseNumericField): trống/khoảng trắng = không hợp lệ,
 * không mặc định 0. Giờ/phút bỏ qua khi isUnknownTime. Vĩ/kinh độ bắt buộc vì luồng
 * MVP nhập tay (chưa có geocoding).
 */
export function validateBirthFormDraft(draft: BirthFormDraft): BirthFormFieldErrors {
  const errors: BirthFormFieldErrors = {};
  const copy = viCopy.dashboardValidation;

  if (!isIntInRange(draft.birthYear, 1, 9999)) {
    errors.birthYear = copy.birthYearInvalid;
  }
  if (!isIntInRange(draft.birthMonth, 1, 12)) {
    errors.birthMonth = copy.birthMonthInvalid;
  }
  if (!isIntInRange(draft.birthDay, 1, 31)) {
    errors.birthDay = copy.birthDayInvalid;
  }

  if (!draft.isUnknownTime) {
    if (!isIntInRange(draft.hour, 0, 23)) {
      errors.hour = copy.hourInvalid;
    }
    if (!isIntInRange(draft.minute, 0, 59)) {
      errors.minute = copy.minuteInvalid;
    }
  }

  if (!isNumberInRange(draft.latitude, -90, 90)) {
    errors.latitude = copy.latitudeInvalid;
  }
  if (!isNumberInRange(draft.longitude, -180, 180)) {
    errors.longitude = copy.longitudeInvalid;
  }
  if (draft.timezone.trim() === '') {
    errors.timezone = copy.timezoneRequired;
  }

  return errors;
}

/** Draft hợp lệ khi không còn lỗi trường nào — dùng cho $derived disabled submit. */
export function isBirthFormDraftValid(draft: BirthFormDraft): boolean {
  return Object.keys(validateBirthFormDraft(draft)).length === 0;
}

// Chuỗi rỗng hoặc chỉ gồm khoảng trắng phải bị coi là không hợp lệ (NaN) thay vì
// để Number('') trả về 0 — nếu không người dùng sẽ nhận lá số cho toạ độ (0,0)
// hoặc giờ nửa đêm thay vì được báo lỗi nhập liệu.
function parseNumericField(value: string): number {
  return value.trim() === '' ? Number.NaN : Number(value);
}

export function buildCreateChartRequest(draft: BirthFormDraft): CreateChartRequest {
  const latitude = parseNumericField(draft.latitude);
  const longitude = parseNumericField(draft.longitude);

  return {
    birthInput: {
      calendar: draft.calendar,
      date: {
        year: parseNumericField(draft.birthYear),
        month: parseNumericField(draft.birthMonth),
        day: parseNumericField(draft.birthDay),
        isLeapMonth: draft.calendar === 'lunar' ? draft.isLeapMonth : null,
      },
      time: {
        hour: draft.isUnknownTime ? null : parseNumericField(draft.hour),
        minute: draft.isUnknownTime ? null : parseNumericField(draft.minute),
        isUnknown: draft.isUnknownTime,
      },
      sexOrGenderForChart: draft.gender,
      place: {
        label: draft.placeLabel.trim() || null,
        manual: {
          latitude,
          longitude,
          timezone: draft.timezone,
        },
      },
      locale: draft.explanationLanguage,
      source: 'user-entered',
    },
    chartSystem: draft.chartSystem,
    makeActiveBirthProfile: true,
  };
}
