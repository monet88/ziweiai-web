import { describe, expect, it } from 'vitest';
import {
  buildCreateChartRequest,
  createBirthFormDraft,
  isBirthFormDraftValid,
  validateBirthFormDraft,
  type BirthFormDraft,
} from './birth-profile-draft';

function buildDraft(overrides?: Partial<BirthFormDraft>): BirthFormDraft {
  return {
    chartSystem: 'zi-wei-dou-shu',
    birthDay: '14',
    birthMonth: '8',
    birthYear: '1992',
    calendar: 'gregorian',
    isLeapMonth: false,
    explanationLanguage: 'vi-VN',
    gender: 'female',
    hour: '9',
    isUnknownTime: false,
    latitude: '10.8231',
    longitude: '106.6297',
    minute: '30',
    placeLabel: 'Thành phố Hồ Chí Minh',
    timezone: 'Asia/Ho_Chi_Minh',
    ...overrides,
  };
}

describe('buildCreateChartRequest', () => {
  it('forces gregorian + null leap-month even if a stale draft still carries lunar values', () => {
    // Form web đã bỏ ô chọn lịch (decision 0018) → builder ghim cứng dương lịch tại biên.
    // Dù draft bị hydrate lệch mang calendar='lunar'/isLeapMonth=true thì request vẫn không
    // bị nhãn sai lịch (chặn hỏng dữ liệu thầm lặng cho người nhập ngày dương).
    const request = buildCreateChartRequest(
      buildDraft({
        calendar: 'lunar',
        isLeapMonth: true,
      }),
    );

    expect(request.birthInput.calendar).toBe('gregorian');
    expect(request.birthInput.date.isLeapMonth).toBeNull();
  });

  it('clears leap-month flag for gregorian input', () => {
    const request = buildCreateChartRequest(buildDraft());

    expect(request.birthInput.date.isLeapMonth).toBeNull();
  });

  it('marks blank coordinates as invalid instead of defaulting to (0, 0)', () => {
    const request = buildCreateChartRequest(buildDraft({ latitude: '', longitude: '   ' }));

    expect(request.birthInput.place.manual?.latitude).toBeNaN();
    expect(request.birthInput.place.manual?.longitude).toBeNaN();
  });

  it('maps blank place label to null so manual coordinates still satisfy the API schema', () => {
    const request = buildCreateChartRequest(buildDraft({ placeLabel: '   ' }));

    expect(request.birthInput.place.label).toBeNull();
  });

  it('marks blank known birth time as invalid instead of midnight', () => {
    const request = buildCreateChartRequest(buildDraft({ hour: '', minute: '', isUnknownTime: false }));

    expect(request.birthInput.time.hour).toBeNaN();
    expect(request.birthInput.time.minute).toBeNaN();
  });
});

describe('createBirthFormDraft', () => {
  it('defaults to Tử Vi and pre-fills Vietnam location so charts never block on place', () => {
    const draft = createBirthFormDraft();

    expect(draft.chartSystem).toBe('zi-wei-dou-shu');
    expect(draft.latitude).toBe('10.8231');
    expect(draft.longitude).toBe('106.6297');
    expect(draft.timezone).toBe('Asia/Ho_Chi_Minh');
    expect(draft.placeLabel).toBe('Việt Nam');
  });

  it('builds a valid create-chart request straight from defaults plus date/time/gender', () => {
    const draft = createBirthFormDraft();
    const request = buildCreateChartRequest({
      ...draft,
      birthDay: '14',
      birthMonth: '8',
      birthYear: '1992',
      hour: '9',
      minute: '30',
      gender: 'female',
    });

    // place.manual đầy đủ → snapshot không rơi vào PLACE_UNRESOLVED/blocked.
    expect(request.birthInput.place.manual).toEqual({
      latitude: 10.8231,
      longitude: 106.6297,
      timezone: 'Asia/Ho_Chi_Minh',
    });
    expect(request.birthInput.place.label).toBe('Việt Nam');
  });

  it('honours the initial chart system from a system wrapper', () => {
    const draft = createBirthFormDraft('ba-zi');

    expect(draft.chartSystem).toBe('ba-zi');
  });
});

describe('validateBirthFormDraft', () => {
  it('returns no errors for a fully valid draft', () => {
    expect(validateBirthFormDraft(buildDraft())).toEqual({});
    expect(isBirthFormDraftValid(buildDraft())).toBe(true);
  });

  it('flags blank required date fields with Vietnamese messages', () => {
    const errors = validateBirthFormDraft(buildDraft({ birthYear: '', birthMonth: '', birthDay: '' }));

    expect(errors.birthYear).toBeTruthy();
    expect(errors.birthMonth).toBeTruthy();
    expect(errors.birthDay).toBeTruthy();
    expect(isBirthFormDraftValid(buildDraft({ birthYear: '' }))).toBe(false);
  });

  it('rejects out-of-range date components', () => {
    const errors = validateBirthFormDraft(buildDraft({ birthMonth: '13', birthDay: '40' }));

    expect(errors.birthMonth).toBeTruthy();
    expect(errors.birthDay).toBeTruthy();
  });

  it('skips hour/minute validation when birth time is unknown', () => {
    const errors = validateBirthFormDraft(buildDraft({ hour: '', minute: '', isUnknownTime: true }));

    expect(errors.hour).toBeUndefined();
    expect(errors.minute).toBeUndefined();
  });

  it('requires hour and minute when birth time is known', () => {
    const errors = validateBirthFormDraft(buildDraft({ hour: '', minute: '', isUnknownTime: false }));

    expect(errors.hour).toBeTruthy();
    expect(errors.minute).toBeTruthy();
  });

  it('rejects hex, scientific, and decimal notations for integer date fields', () => {
    // Number('0x12')=18, Number('1e1')=10, Number('12.0')=12 đều lọt Number.isInteger;
    // chỉ chữ số thập phân thường mới hợp lệ cho ngày/tháng/năm/giờ/phút.
    expect(validateBirthFormDraft(buildDraft({ birthDay: '0x12' })).birthDay).toBeTruthy();
    expect(validateBirthFormDraft(buildDraft({ birthMonth: '1e1' })).birthMonth).toBeTruthy();
    expect(validateBirthFormDraft(buildDraft({ birthDay: '12.0' })).birthDay).toBeTruthy();
    expect(validateBirthFormDraft(buildDraft({ hour: '0x1' })).hour).toBeTruthy();
  });
});
