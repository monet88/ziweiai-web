import { describe, expect, it } from 'vitest';
import type { ChartSnapshot } from '@ziweiai/contracts';
import {
  calculateFiveElementsBalance,
  evaluateDayMaster,
  determineUsefulGods,
  calculateShenSha,
  calculateDecadalPillars,
  evaluateYear2026,
  calculate12Months2026,
  getLifeStage,
  calculateTenGod,
} from './bazi-dossier-calculator';

function createMockBaziSnapshot(): ChartSnapshot {
  return {
    snapshotId: 'test-bazi-snapshot-123',
    chartSystem: 'ba-zi',
    engineVersion: { name: 'lunar-javascript', version: '1.7.7' },
    ruleSource: { name: 'canonical-bazi', version: '1.0.0' },
    inputHash: 'mock-input-hash',
    calculationConfidence: {
      isExact: true,
      blocksExactReading: false,
      reasons: [],
    },
    provenance: {
      calculatedAt: '2026-09-09T12:00:00.000Z',
      input: {
        calendar: 'gregorian',
        date: { year: 1990, month: 5, day: 15 },
        time: { hour: 8, minute: 30 },
        gender: 'male',
      },
    },
    createdAt: '2026-09-09T12:00:00.000Z',
    birth: {
      name: 'Nguyễn Văn Hoàng',
      gender: 'male',
      solarDate: '15/05/1990',
      lunarDate: '21/04/Canh Ngọ',
      normalizationConfidence: {
        isExact: true,
        blocksExactReading: false,
        reasons: [],
      },
      time: { hour: 8, minute: 30 },
      date: { year: 1990, month: 5, day: 15 },
      calendar: 'gregorian',
    },
    palaces: [],
    pillars: [
      { name: 'year', value: 'Canh Ngọ' },
      { name: 'month', value: 'Tân Tỵ' },
      { name: 'day', value: 'Bính Dần' },
      { name: 'hour', value: 'Nhâm Thìn' },
    ],
    summary: {
      lunarDate: '21/04/Canh Ngọ',
      mingGong: 'Giáp Thân',
      shenGong: 'Mậu Tý',
      dayMaster: 'Bính Dần',
      taiYuan: 'Nhâm Thân',
      taiXi: 'Tân Hợi',
    },
    bazi: {
      dayMasterHeavenlyStemKey: 'bingHeavenly',
      pillars: [
        {
          slot: 'year',
          heavenlyStemKey: 'gengHeavenly',
          earthlyBranchKey: 'wuEarthly',
          heavenlyStemElementKey: 'metal',
          earthlyBranchElementKey: 'fire',
          heavenlyStemTenGodKey: 'pianCai',
          earthlyBranchTenGodKeys: ['jieCai'],
          hiddenStems: [
            { heavenlyStemKey: 'dingHeavenly', elementKey: 'fire', tenGodKey: 'jieCai' },
            { heavenlyStemKey: 'jiHeavenly', elementKey: 'earth', tenGodKey: 'shangGuan' },
          ],
          naYin: 'Lộ Bàng Thổ',
        },
        {
          slot: 'month',
          heavenlyStemKey: 'xinHeavenly',
          earthlyBranchKey: 'siEarthly',
          heavenlyStemElementKey: 'metal',
          earthlyBranchElementKey: 'fire',
          heavenlyStemTenGodKey: 'zhengCai',
          earthlyBranchTenGodKeys: ['biJian'],
          hiddenStems: [
            { heavenlyStemKey: 'bingHeavenly', elementKey: 'fire', tenGodKey: 'biJian' },
            { heavenlyStemKey: 'wuHeavenly', elementKey: 'earth', tenGodKey: 'shiShen' },
            { heavenlyStemKey: 'gengHeavenly', elementKey: 'metal', tenGodKey: 'pianCai' },
          ],
          naYin: 'Bạch Lạp Kim',
        },
        {
          slot: 'day',
          heavenlyStemKey: 'bingHeavenly',
          earthlyBranchKey: 'yinEarthly',
          heavenlyStemElementKey: 'fire',
          earthlyBranchElementKey: 'wood',
          heavenlyStemTenGodKey: 'riZhu',
          earthlyBranchTenGodKeys: ['pianYin'],
          hiddenStems: [
            { heavenlyStemKey: 'jiaHeavenly', elementKey: 'wood', tenGodKey: 'pianYin' },
            { heavenlyStemKey: 'bingHeavenly', elementKey: 'fire', tenGodKey: 'biJian' },
            { heavenlyStemKey: 'wuHeavenly', elementKey: 'earth', tenGodKey: 'shiShen' },
          ],
          naYin: 'Lô Trung Hỏa',
        },
        {
          slot: 'hour',
          heavenlyStemKey: 'renHeavenly',
          earthlyBranchKey: 'chenEarthly',
          heavenlyStemElementKey: 'water',
          earthlyBranchElementKey: 'earth',
          heavenlyStemTenGodKey: 'qiSha',
          earthlyBranchTenGodKeys: ['shiShen'],
          hiddenStems: [
            { heavenlyStemKey: 'wuHeavenly', elementKey: 'earth', tenGodKey: 'shiShen' },
            { heavenlyStemKey: 'yiHeavenly', elementKey: 'wood', tenGodKey: 'zhengYin' },
            { heavenlyStemKey: 'guiHeavenly', elementKey: 'water', tenGodKey: 'zhengGuan' },
          ],
          naYin: 'Trường Lưu Thủy',
        },
      ],
      taiYuan: { heavenlyStemKey: 'renHeavenly', earthlyBranchKey: 'shenEarthly', naYin: 'Kiếm Phong Kim' },
      taiXi: { heavenlyStemKey: 'xinHeavenly', earthlyBranchKey: 'haiEarthly', naYin: 'Thoa Xuyến Kim' },
      mingGong: { heavenlyStemKey: 'jiaHeavenly', earthlyBranchKey: 'shenEarthly', naYin: 'Tuyền Trung Thủy' },
      shenGong: { heavenlyStemKey: 'wuHeavenly', earthlyBranchKey: 'ziEarthly', naYin: 'Tích Lịch Hỏa' },
    },
  } as unknown as ChartSnapshot;
}

describe('bazi-dossier-calculator', () => {
  it('tính đúng 12 Vòng Trường Sinh cho các Thiên Can', () => {
    // Bính Hỏa trường sinh tại Dần, lâm quan tại Tỵ, đế vượng tại Ngọ
    expect(getLifeStage('bingHeavenly', 'yinEarthly')).toBe('Trường Sinh');
    expect(getLifeStage('bingHeavenly', 'siEarthly')).toBe('Lâm Quan');
    expect(getLifeStage('bingHeavenly', 'wuEarthly')).toBe('Đế Vượng');
    expect(getLifeStage('bingHeavenly', 'shenEarthly')).toBe('Bệnh');

    // Giáp Mộc trường sinh tại Hợi
    expect(getLifeStage('jiaHeavenly', 'haiEarthly')).toBe('Trường Sinh');
  });

  it('tính đúng quan hệ Thập Thần', () => {
    // Bính Hỏa gặp Bính Hỏa là Tỷ Kiên
    expect(calculateTenGod('bingHeavenly', 'bingHeavenly')).toBe('biJian');
    // Bính Hỏa gặp Đinh Hỏa là Kiếp Tài
    expect(calculateTenGod('bingHeavenly', 'dingHeavenly')).toBe('jieCai');
    // Bính Hỏa gặp Canh Kim là Thiên Tài
    expect(calculateTenGod('bingHeavenly', 'gengHeavenly')).toBe('pianCai');
    // Bính Hỏa gặp Tân Kim là Chính Tài
    expect(calculateTenGod('bingHeavenly', 'xinHeavenly')).toBe('zhengCai');
    // Bính Hỏa gặp Nhâm Thủy là Thất Sát
    expect(calculateTenGod('bingHeavenly', 'renHeavenly')).toBe('qiSha');
    // Bính Hỏa gặp Quý Thủy là Chính Quan
    expect(calculateTenGod('bingHeavenly', 'guiHeavenly')).toBe('zhengGuan');
    // Bính Hỏa gặp Giáp Mộc là Thiên Ấn
    expect(calculateTenGod('bingHeavenly', 'jiaHeavenly')).toBe('pianYin');
    // Bính Hỏa gặp Ất Mộc là Chính Ấn
    expect(calculateTenGod('bingHeavenly', 'yiHeavenly')).toBe('zhengYin');
  });

  it('tính cân bằng Ngũ Hành và đánh giá Thân Vượng/Nhược', () => {
    const snapshot = createMockBaziSnapshot();
    const scores = calculateFiveElementsBalance(snapshot);

    expect(scores.total).toBeGreaterThan(0);
    expect(scores.percentages.wood + scores.percentages.fire + scores.percentages.earth + scores.percentages.metal + scores.percentages.water).toBeGreaterThanOrEqual(98);
    expect(scores.fire).toBeGreaterThan(0); // Có Hỏa trong chi Ngọ, Tỵ, can Bính

    const evalResult = evaluateDayMaster(snapshot, scores);
    expect(evalResult.dayMasterStem).toBe('bingHeavenly');
    expect(evalResult.dayMasterElement).toBe('fire');
    expect(evalResult.deLing).toBe(true); // Sinh tháng Tỵ (Hỏa) nên đắc lệnh
    expect(['Thân Vượng', 'Vượng Cực']).toContain(evalResult.status);
  });

  it('xác định đúng Dụng Thần, Hỷ Thần và Điều Hậu', () => {
    const snapshot = createMockBaziSnapshot();
    const scores = calculateFiveElementsBalance(snapshot);
    const evaluation = evaluateDayMaster(snapshot, scores);
    const gods = determineUsefulGods(evaluation, scores, 'siEarthly');

    expect(gods.yongShen).toBeDefined();
    expect(gods.xiShen).toBeDefined();
    expect(gods.jiShen).toBeDefined();
    expect(gods.chouShen).toBeDefined();
    // Sinh tháng Tỵ mùa hạ nên cần Thủy làm mát
    expect(gods.diaoHouShen.element).toBe('water');
  });

  it('tính đúng Thần Sát (Thiên Ất, Lộc Thần, Dịch Mã, Hoa Cái, Đào Hoa, Kình Dương)', () => {
    const snapshot = createMockBaziSnapshot();
    const shenSha = calculateShenSha(snapshot);

    expect(shenSha.length).toBeGreaterThan(0);
    // Bính sinh tháng Tỵ có Lộc Thần tại Tỵ
    const hasLuShen = shenSha.some((s) => s.name === 'Lộc Thần');
    expect(hasLuShen).toBe(true);
    // Bính gặp Ngọ có Kình Dương tại Ngọ
    const hasYangRen = shenSha.some((s) => s.name === 'Kình Dương');
    expect(hasYangRen).toBe(true);
  });

  it('tính đúng chuỗi 8 Thập Niên Đại Vận', () => {
    const snapshot = createMockBaziSnapshot();
    const decadals = calculateDecadalPillars(snapshot);

    expect(decadals.length).toBe(8);
    expect(decadals[0]?.ageRange).toBe('6 - 15 tuổi');
    expect(decadals[7]?.ageRange).toBe('76 - 85 tuổi');
    decadals.forEach((d) => {
      expect(d.stemBranchLabel).toBeTruthy();
      expect(d.tenGod).toBeTruthy();
      expect(d.lifeStage).toBeTruthy();
      expect(d.fortuneSummary).toBeTruthy();
    });
  });

  it('phân tích chuẩn xác Lưu Niên 2026 Bính Ngọ', () => {
    const snapshot = createMockBaziSnapshot();
    const scores = calculateFiveElementsBalance(snapshot);
    const evaluation = evaluateDayMaster(snapshot, scores);
    const gods = determineUsefulGods(evaluation, scores, 'siEarthly');
    const forecast = evaluateYear2026(snapshot, gods);

    expect(forecast.yearCanChi).toContain('2026');
    expect(forecast.tenGodOfYear).toBe('Tỷ Kiên'); // Bính gặp Bính
    expect(forecast.dayMasterRelation).toContain('Tỷ Kiên');
    // Lá số có Chi Dần ở trụ ngày, nên sẽ Tam Hợp Dần Ngọ Tuất
    const hasTamHop = forecast.branchInteractions.some((bi) => bi.type === 'Tam Hợp');
    expect(hasTamHop).toBe(true);
    // Lá số có Chi Ngọ ở trụ năm, nên sẽ Tự Hình Ngọ Ngọ
    const hasTuHinh = forecast.branchInteractions.some((bi) => bi.type === 'Tự Hình');
    expect(hasTuHinh).toBe(true);
  });

  it('tính chuẩn xác 12 tháng năm 2026 Bính Ngọ', () => {
    const months = calculate12Months2026('bingHeavenly');
    expect(months.length).toBe(12);
    expect(months[0]?.monthCanChi).toBe('Canh Dần');
    expect(months[11]?.monthCanChi).toBe('Tân Sửu');
    months.forEach((m) => {
      expect(m.ratingScore).toBeGreaterThanOrEqual(1);
      expect(m.ratingScore).toBeLessThanOrEqual(5);
      expect(m.headline).toBeTruthy();
      expect(m.actionGuidance).toBeTruthy();
    });
  });
});
