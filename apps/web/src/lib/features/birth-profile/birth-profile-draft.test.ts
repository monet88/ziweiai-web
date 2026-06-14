import { describe, expect, it } from 'vitest';
import { buildCreateChartRequest, type BirthFormDraft } from './birth-profile-draft';

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
  it('keeps leap-month births when the draft uses lunar calendar', () => {
    const request = buildCreateChartRequest(
      buildDraft({
        calendar: 'lunar',
        isLeapMonth: true,
      }),
    );

    expect(request.birthInput.date.isLeapMonth).toBe(true);
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
