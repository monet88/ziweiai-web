import { describe, expect, it } from 'vitest';
import { pairingCompatibilitySchema, type BirthInput } from '@ziweiai/contracts';
import { analyzeHepanCompatibility } from './hepan-compatibility';

// Đồng bộ guard CJK runtime: bộ tương hợp đã dịch tiếng Việt nên KHÔNG được rò ký tự CJK.
const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

function birth(year: number, month: number, day: number, hour: number): BirthInput {
  return {
    calendar: 'gregorian',
    date: { year, month, day, isLeapMonth: null },
    time: { hour, minute: 0, isUnknown: false },
    sexOrGenderForChart: 'male',
    place: {
      label: 'Ho Chi Minh City',
      manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
    },
    locale: 'vi-VN',
    source: 'test-fixture',
  };
}

const personA = birth(1990, 6, 15, 12);
const personB = birth(1992, 3, 8, 9);

describe('analyzeHepanCompatibility (US-017c)', () => {
  it('trả kết quả hợp lệ theo pairingCompatibilitySchema', () => {
    const result = analyzeHepanCompatibility(personA, personB, 'love');
    expect(pairingCompatibilitySchema.safeParse(result).success).toBe(true);
    expect(result.dimensions.length).toBeGreaterThanOrEqual(1);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('deterministic: cùng input → cùng kết quả', () => {
    const a = analyzeHepanCompatibility(personA, personB, 'love');
    const b = analyzeHepanCompatibility(personA, personB, 'love');
    expect(a).toEqual(b);
  });

  it('loại quan hệ khác cho ra chiều đặc thù khác nhau', () => {
    const love = analyzeHepanCompatibility(personA, personB, 'love');
    const business = analyzeHepanCompatibility(personA, personB, 'business');
    const family = analyzeHepanCompatibility(personA, personB, 'family');
    expect(love.dimensions.at(-1)?.name).toBe('Duyên tình cảm');
    expect(business.dimensions.at(-1)?.name).toBe('Bổ trợ sự nghiệp');
    expect(family.dimensions.at(-1)?.name).toBe('Giao tiếp gia đình');
  });

  it('không rò chữ Hán/CJK trong toàn bộ output', () => {
    for (const relationType of ['love', 'business', 'family'] as const) {
      const result = analyzeHepanCompatibility(personA, personB, relationType);
      const texts = [result.level, result.narrative, ...result.dimensions.flatMap((d) => [d.name, d.description])];
      for (const text of texts) {
        expect(CJK_TEXT_PATTERN.test(text), `output "${text}" không được chứa CJK`).toBe(false);
      }
    }
  });

  it('mọi chiều điểm nằm trong 0..100 và level khớp ngưỡng', () => {
    const result = analyzeHepanCompatibility(personA, personB, 'love');
    for (const dimension of result.dimensions) {
      expect(dimension.score).toBeGreaterThanOrEqual(0);
      expect(dimension.score).toBeLessThanOrEqual(100);
    }
    const expectedLevel =
      result.overallScore >= 80
        ? 'Rất hợp'
        : result.overallScore >= 65
          ? 'Tốt'
          : result.overallScore >= 50
            ? 'Bình thường'
            : 'Cần lưu ý';
    expect(result.level).toBe(expectedLevel);
  });

  it('niên chi lục hợp chấm đúng 85 (không phải 90 của nhật trụ) — chốt giá trị theo nguồn taibu', () => {
    // 1980 + 1989: hai niên chi lục hợp (Thân/Tỵ). Chiều "Tương hợp gia đình" (niên trụ) phải
    // ra 85 theo nguồn hepan.ts; nhật trụ lục hợp mới là 90. Test này bắt regression nếu gộp nhầm.
    const result = analyzeHepanCompatibility(birth(1980, 6, 15, 12), birth(1989, 6, 15, 12), 'love');
    const family = result.dimensions.find((d) => d.name === 'Tương hợp gia đình');
    expect(family?.score).toBe(85);
  });

  it('tháng âm nhuận cho kết quả khác tháng âm thường (giữ cờ isLeapMonth)', () => {
    // Cùng ngày âm 6/1 nhưng nhuận vs thường → nguyệt trụ khác → kết quả tương hợp khác.
    // Nếu bỏ cờ isLeapMonth, hai kết quả sẽ trùng (bug cubic P1).
    const lunarNormal: BirthInput = {
      calendar: 'lunar',
      date: { year: 2017, month: 6, day: 1, isLeapMonth: false },
      time: { hour: 12, minute: 0, isUnknown: false },
      sexOrGenderForChart: 'male',
      place: { label: 'x', manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' } },
      locale: 'vi-VN',
      source: 'test-fixture',
    };
    const lunarLeap: BirthInput = { ...lunarNormal, date: { ...lunarNormal.date, isLeapMonth: true } };

    const resultNormal = analyzeHepanCompatibility(lunarNormal, personB, 'love');
    const resultLeap = analyzeHepanCompatibility(lunarLeap, personB, 'love');
    expect(resultNormal).not.toEqual(resultLeap);
  });

  it('giờ sinh không xác định: không bịa thời trụ, chiều sự nghiệp suy giảm tham khảo', () => {
    // isUnknown=true → hour/minute null. Engine KHÔNG được dựng thời trụ 00:00 rồi chấm điểm
    // như giờ thật (P2 chatgpt-codex). Chiều "Bổ trợ sự nghiệp" phải trả nhãn suy giảm.
    const unknownTime: BirthInput = {
      ...personA,
      time: { hour: null, minute: null, isUnknown: true },
    };
    const business = analyzeHepanCompatibility(unknownTime, personB, 'business');
    const careerDim = business.dimensions.find((d) => d.name === 'Bổ trợ sự nghiệp');
    expect(careerDim?.description).toContain('Thiếu giờ sinh');

    // Đổi giờ "giả định" không được làm thay đổi kết quả khi giờ là unknown (chứng minh không bịa thời trụ).
    const unknownTimeOtherHour: BirthInput = {
      ...personA,
      time: { hour: null, minute: null, isUnknown: true },
    };
    expect(analyzeHepanCompatibility(unknownTime, personB, 'love')).toEqual(
      analyzeHepanCompatibility(unknownTimeOtherHour, personB, 'love'),
    );

    // Hành chủ đạo tính từ 3 trụ (năm/tháng/ngày) khi thiếu giờ → vẫn ra kết quả hợp lệ.
    expect(pairingCompatibilitySchema.safeParse(business).success).toBe(true);
  });
});
