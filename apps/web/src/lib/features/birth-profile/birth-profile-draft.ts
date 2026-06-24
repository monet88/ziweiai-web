import type { ImplementedChartSystem, CreateChartRequest } from '@ziweiai/contracts';
import { viCopy } from '$lib/i18n/vi';

export type BirthFormDraft = {
  // Web chỉ tạo lá số cho hệ đã có adapter (ImplementedChartSystem = 6 hệ), khớp ràng buộc
  // createChartRequestSchema. ChartSystemPicker cũng chỉ render danh sách này.
  chartSystem: ImplementedChartSystem;
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
}>;

/**
 * Mặc định địa điểm cho bản Việt Nam. Toạ độ + múi giờ không còn nhập tay trên form
 * (xem decision 0015): engine chỉ dùng `timezone` để quy giờ sinh sang UTC, còn vĩ/kinh độ
 * hiện CHƯA tham gia phép tính lá số (true solar time đang `deferred`). Vẫn phải gửi
 * `place.manual` đầy đủ để snapshot không rơi vào trạng thái `blocked` (PLACE_UNRESOLVED).
 * Toạ độ là trung tâm TP.HCM — giá trị mồi, không ảnh hưởng kết quả khi true solar time tắt.
 */
const VN_DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';
const VN_DEFAULT_LATITUDE = '10.8231';
const VN_DEFAULT_LONGITUDE = '106.6297';
const VN_DEFAULT_PLACE_LABEL = 'Việt Nam';

/**
 * Draft mặc định cho form (port từ Expo defaultBirthFormState).
 * chartSystem nhận từ wrapper hệ (US-007) qua initialChartSystem; mặc định Tử Vi.
 * Địa điểm điền sẵn mặc định Việt Nam — form không hiển thị các trường này nữa.
 */
export function createBirthFormDraft(initialChartSystem: ImplementedChartSystem = 'zi-wei-dou-shu'): BirthFormDraft {
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
    latitude: VN_DEFAULT_LATITUDE,
    longitude: VN_DEFAULT_LONGITUDE,
    minute: '',
    placeLabel: VN_DEFAULT_PLACE_LABEL,
    timezone: VN_DEFAULT_TIMEZONE,
  };
}

function isIntInRange(value: string, min: number, max: number): boolean {
  // Guard phòng thủ: dù BirthFormDraft khai báo string, chặn null/undefined lọt vào
  // (vd input số ép kiểu) trước khi gọi .trim() để không crash runtime.
  if (typeof value !== 'string') {
    return false;
  }
  const trimmed = value.trim();
  // Chỉ chấp nhận chuỗi chữ số thập phân thuần. Number()/Number.isInteger sẽ nuốt cả
  // hex (0x12), ký hiệu khoa học (1e1) và thập phân (12.0) — không phải thứ người dùng
  // gõ cho ngày/tháng/năm/giờ/phút. Các trường này đều không âm nên không cần dấu '-'.
  if (!/^\d+$/.test(trimmed)) {
    return false;
  }
  const parsed = Number.parseInt(trimmed, 10);
  return parsed >= min && parsed <= max;
}

/**
 * Xác thực thuần draft → lỗi từng trường tiếng Việt. Logic này phản chiếu ràng buộc
 * birthInputSchema (@ziweiai/contracts) ở phía client để chặn submit sớm + báo lỗi
 * trước khi gọi API; backend vẫn là nguồn kiểm tra cuối. KHÔNG ghi ngược state —
 * dùng làm $derived trong dashboard-model.
 *
 * Quy ước theo bất biến (parseNumericField): trống/khoảng trắng = không hợp lệ,
 * không mặc định 0. Giờ/phút bỏ qua khi isUnknownTime. Toạ độ + múi giờ KHÔNG còn
 * validate ở đây vì form không hiển thị chúng nữa — luôn điền sẵn mặc định VN
 * (xem createBirthFormDraft + decision 0014).
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
      // Form web chỉ nhập DƯƠNG LỊCH (đã bỏ ô chọn lịch + tháng nhuận, xem decision 0018);
      // backend tự quy đổi sang âm lịch (chart-snapshot.lunarDate). Đây là consumer DUY NHẤT
      // của builder (cả Tử Vi lẫn Hợp Hôn), nên ghim cứng calendar='gregorian'/isLeapMonth=null
      // tại biên: dù draft bị hydrate/khởi tạo lệch mang calendar='lunar' thì request vẫn không
      // nhãn sai lịch (chặn hỏng dữ liệu thầm lặng). draft.calendar/isLeapMonth giữ lại để
      // BirthFormDraft + @ziweiai/contracts không đổi, nhưng builder không còn đọc chúng.
      calendar: 'gregorian',
      date: {
        year: parseNumericField(draft.birthYear),
        month: parseNumericField(draft.birthMonth),
        day: parseNumericField(draft.birthDay),
        isLeapMonth: null,
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
