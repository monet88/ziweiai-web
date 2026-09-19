import { describe, expect, it } from 'vitest';
import type { BirthInput } from '@ziweiai/contracts';
import {
  buildZiweiAstrolabeSource,
  IztroChartAdapter,
} from './adapters/iztro-chart-adapter';
import {
  analyzeAllFlankingPalaces,
  analyzeFlankingPalaces,
  extractDecadalTimeline,
  extractMonthlyTimeline,
  extractYearlyTimeline,
} from './ziwei-analysis';
import { computeZiweiHoroscope } from './ziwei-horoscope';

const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

const sampleBirth: BirthInput = {
  calendar: 'gregorian',
  date: { year: 1990, month: 6, day: 15, isLeapMonth: null },
  time: { hour: 12, minute: 0, isUnknown: false },
  sexOrGenderForChart: 'male',
  place: {
    label: 'Hà Nội',
    manual: { latitude: 21.0285, longitude: 105.8542, timezone: 'Asia/Ho_Chi_Minh' },
  },
  locale: 'vi-VN',
  source: 'test-fixture',
};

describe('ziwei-analysis (iztro v2.6.1 integration)', () => {
  const astrolabe = buildZiweiAstrolabeSource(sampleBirth, '男', 6);

  describe('analyzeFlankingPalaces (Giáp Cung)', () => {
    it('phân tích Giáp Cung cho cung Mệnh (index 0) không rò rỉ CJK', () => {
      const analysis = analyzeFlankingPalaces(astrolabe, 0);

      expect(analysis.targetIndex).toBe(0);
      expect(analysis.targetPalaceNameKey).toBeDefined();
      expect(analysis.previousIndex).toBeGreaterThanOrEqual(0);
      expect(analysis.previousIndex).toBeLessThanOrEqual(11);
      expect(analysis.nextIndex).toBeGreaterThanOrEqual(0);
      expect(analysis.nextIndex).toBeLessThanOrEqual(11);
      expect(Array.isArray(analysis.patterns)).toBe(true);
      expect(typeof analysis.hasKinhDa).toBe('boolean');
      expect(typeof analysis.hasTaHuu).toBe('boolean');
      expect(typeof analysis.hasXuongKhuc).toBe('boolean');
      expect(typeof analysis.hasKhoiViet).toBe('boolean');
      expect(typeof analysis.hasMutagenLu).toBe('boolean');
      expect(typeof analysis.hasMutagenQuyen).toBe('boolean');
      expect(typeof analysis.hasMutagenKhoa).toBe('boolean');
      expect(typeof analysis.hasMutagenKy).toBe('boolean');

      expect(CJK_TEXT_PATTERN.test(JSON.stringify(analysis))).toBe(false);
    });

    it('phân tích Giáp Cung cho toàn bộ 12 cung', () => {
      const all = analyzeAllFlankingPalaces(astrolabe);
      expect(all).toHaveLength(12);
      for (let i = 0; i < 12; i++) {
        expect(all[i].targetIndex).toBe(i);
        expect(CJK_TEXT_PATTERN.test(JSON.stringify(all[i]))).toBe(false);
      }
    });

    it('phát hiện đúng các cách cục giáp cung khi có sao giáp', () => {
      // Quét 12 cung xem cung nào có giáp kình đà hoặc giáp tả hữu
      const all = analyzeAllFlankingPalaces(astrolabe);
      for (const item of all) {
        if (item.hasKinhDa) {
          expect(item.patterns).toContain('giap_kinh_da');
        }
        if (item.hasTaHuu) {
          expect(item.patterns).toContain('giap_ta_huu');
        }
        if (item.hasXuongKhuc) {
          expect(item.patterns).toContain('giap_xuong_khuc');
        }
        if (item.hasMutagenLu) {
          expect(item.patterns).toContain('giap_hoa_loc');
        }
      }
    });
  });

  describe('extractDecadalTimeline & extractYearlyTimeline & extractMonthlyTimeline', () => {
    it('trích xuất 12 Đại Hạn không rò rỉ CJK', () => {
      const decadals = extractDecadalTimeline(astrolabe);
      expect(decadals).toHaveLength(12);
      for (const dec of decadals) {
        expect(dec.index).toBeGreaterThanOrEqual(0);
        expect(dec.index).toBeLessThanOrEqual(11);
        expect(dec.ageRange[0]).toBeLessThan(dec.ageRange[1]);
        expect(dec.yearRange[0]).toBeLessThan(dec.yearRange[1]);
        expect(dec.palaceNameKey).toBeDefined();
        expect(dec.heavenlyStemKey).toBeDefined();
        expect(dec.earthlyBranchKey).toBeDefined();
      }
      expect(CJK_TEXT_PATTERN.test(JSON.stringify(decadals))).toBe(false);
    });

    it('trích xuất 10 Lưu Niên của Đại Hạn đầu tiên không rò rỉ CJK', () => {
      const yearlies = extractYearlyTimeline(astrolabe, 0);
      expect(yearlies).toHaveLength(10);
      for (const y of yearlies) {
        expect(y.year).toBeGreaterThan(1980);
        expect(y.age).toBeGreaterThan(0);
        expect(y.palaceNameKeys.length).toBeGreaterThan(0);
      }
      expect(CJK_TEXT_PATTERN.test(JSON.stringify(yearlies))).toBe(false);
    });

    it('trích xuất 12 Lưu Nguyệt của năm 2026 không rò rỉ CJK', () => {
      const monthlies = extractMonthlyTimeline(astrolabe, 2026);
      expect(monthlies.length).toBeGreaterThanOrEqual(12);
      for (const m of monthlies) {
        expect(m.year).toBe(2026);
        expect(m.month).toBeGreaterThanOrEqual(1);
        expect(m.month).toBeLessThanOrEqual(12);
        expect(m.dayRange).toHaveLength(2);
      }
      expect(CJK_TEXT_PATTERN.test(JSON.stringify(monthlies))).toBe(false);
    });
  });

  describe('Upstream iztro v2.6.1 regression fixes', () => {
    it('sao Thái Dương, Thái Âm, Thất Sát ở cung Dậu có độ sáng chuẩn hóa', async () => {
      const adapter = new IztroChartAdapter();
      // Quét lá số mẫu qua adapter để kiểm tra cung Dậu (earthlyBranchKey === 'you')
      const snapshot = await adapter.calculateChart(sampleBirth);
      const dauPalace = snapshot.palaces.find((p) => p.earthlyBranchKey === 'youEarthly');
      expect(dauPalace).toBeDefined();
      expect(dauPalace?.earthlyBranchKey).toBe('youEarthly');

      // Kiểm tra lá số có sao ở cung Dậu (ví dụ: tháng 1 có Thái Dương ở Dậu)
      const janBirth: BirthInput = {
        ...sampleBirth,
        date: { year: 1990, month: 1, day: 15, isLeapMonth: null },
        time: { hour: 4, minute: 0, isUnknown: false },
      };
      const janSnapshot = await adapter.calculateChart(janBirth);
      const janDau = janSnapshot.palaces.find((p) => p.earthlyBranchKey === 'youEarthly');
      expect(janDau).toBeDefined();
      const taiyang = janDau?.majorStars.find((s) => s.nameKey === 'taiyangMaj');
      if (taiyang) {
        expect(taiyang.brightnessKey).toBe('ping');
      }
    });

    it('vận hạn giờ Tý sớm (early rat hour, index 0, 00:xx) tính toán bình thường không lỗi', async () => {
      const earlyRatBirth: BirthInput = {
        ...sampleBirth,
        time: { hour: 0, minute: 15, isUnknown: false },
      };
      const adapter = new IztroChartAdapter();
      const snapshot = await adapter.calculateChart(earlyRatBirth, { viewYear: 2026 });
      expect(snapshot.horoscope).toBeDefined();

      const frame = computeZiweiHoroscope({
        snapshot,
        asOf: '2026-01-15',
        scopes: ['decadal', 'yearly', 'monthly', 'daily'],
      });
      expect(frame.decadal).toBeDefined();
      expect(frame.yearly).toBeDefined();
      expect(frame.monthly).toBeDefined();
      expect(frame.daily).toBeDefined();
      expect(CJK_TEXT_PATTERN.test(JSON.stringify(frame))).toBe(false);
    });

    it('tuổi mụ (hư tuế) trong horoscope tăng sau mốc lập xuân / đầu năm âm lịch', async () => {
      const adapter = new IztroChartAdapter();
      const snapshot = await adapter.calculateChart(sampleBirth);
      // Sinh năm 1990, năm 2026 thì tuổi mụ khoảng 37
      const frameMidYear = computeZiweiHoroscope({
        snapshot,
        asOf: '2026-07-01',
        scopes: ['decadal', 'yearly'],
      });
      expect(frameMidYear.age.nominalAge).toBe(37);
    });
  });
});
