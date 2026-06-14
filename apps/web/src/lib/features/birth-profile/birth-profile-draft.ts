import type { CreateChartRequest } from '@ziweiai/contracts';

export type BirthFormDraft = {
  chartSystem: 'zi-wei-dou-shu' | 'ba-zi' | 'mei-hua-yi-shu' | 'liu-yao' | 'da-liu-ren' | 'qi-men-dun-jia';
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
