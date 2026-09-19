import { describe, expect, it } from 'vitest';
import type { ChartSnapshot } from '@ziweiai/contracts';
import { buildBaziDossierData } from './bazi-dossier-interpretations';

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

describe('bazi-dossier-interpretations', () => {
  it('tạo đầy đủ payload cho hồ sơ 17 trang Bát Tự Hoàng Gia', () => {
    const snapshot = createMockBaziSnapshot();
    const data = buildBaziDossierData(snapshot, 'Hoàng Thân Đại Thần');

    expect(data.userName).toBe('Hoàng Thân Đại Thần');
    expect(data.genderText).toBe('Nam Mạng');
    expect(data.dayMasterText).toBe('Bính');
    expect(data.dayMasterElement).toBe('Hỏa');

    // 4 trụ
    expect(data.pillars.length).toBe(4);
    expect(data.pillars[0]?.slot).toBe('year');
    expect(data.pillars[1]?.slot).toBe('month');
    expect(data.pillars[2]?.slot).toBe('day');
    expect(data.pillars[3]?.slot).toBe('hour');
    data.pillars.forEach((p) => {
      expect(p.stemBranchLabel).toBeTruthy();
      expect(p.deepReading).toBeTruthy();
    });

    // Phụ trụ
    expect(data.extraPillars.taiYuan).toBeTruthy();
    expect(data.extraPillars.taiXi).toBeTruthy();
    expect(data.extraPillars.mingGong).toBeTruthy();
    expect(data.extraPillars.shenGong).toBeTruthy();

    // Ngũ hành & Dụng thần
    expect(data.fiveElements.summaryText).toBeTruthy();
    expect(data.usefulGods.yongShen.name).toBeTruthy();
    expect(data.usefulGods.xiShen.name).toBeTruthy();
    expect(data.usefulGods.jiShen.name).toBeTruthy();
    expect(data.usefulGods.diaoHou.name).toBeTruthy();

    // Thập thần đại luận
    expect(data.tenGodsAnalysis.anTinh.title).toBeTruthy();
    expect(data.tenGodsAnalysis.quanSat.title).toBeTruthy();
    expect(data.tenGodsAnalysis.taiTinh.title).toBeTruthy();
    expect(data.tenGodsAnalysis.thucThuong.title).toBeTruthy();
    expect(data.tenGodsAnalysis.tyKiep.title).toBeTruthy();

    // Thập niên đại vận
    expect(data.decadals.length).toBe(8);

    // Lưu niên 2026 và 12 tháng
    expect(data.yearly2026.yearCanChi).toBe('Bính Ngọ 2026');
    expect(data.yearly2026.career).toBeTruthy();
    expect(data.yearly2026.wealth).toBeTruthy();
    expect(data.yearly2026.months.length).toBe(12);

    // Cải vận
    expect(data.remedies.luckyColors.length).toBeGreaterThan(0);
    expect(data.remedies.luckyDirections.length).toBeGreaterThan(0);
    expect(data.remedies.luckyNumbers.length).toBeGreaterThan(0);
  });

  it('tuyệt đối không chứa bất kỳ ký tự chữ Hán nào trong toàn bộ payload', () => {
    const snapshot = createMockBaziSnapshot();
    const data = buildBaziDossierData(snapshot);
    const jsonStr = JSON.stringify(data);

    // Regex kiểm tra chữ Hán / CJK ideographs
    const hanRegex = /[\u4e00-\u9fa5]/g;
    const matches = jsonStr.match(hanRegex);

    expect(matches).toBeNull();
  });
});
