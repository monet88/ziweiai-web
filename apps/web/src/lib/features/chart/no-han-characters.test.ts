// US-007: chốt bất biến ngôn ngữ TOÀN HỆ. Quét \p{Script=Han} (qua CJK_TEXT_PATTERN —
// guard runtime web dùng) trên output đại diện của mọi formatter 5 hệ thuật số khác Tử Vi
// (Bát Tự / Mai Hoa / Lục Hào / Đại Lục Nhâm / Kỳ Môn) + nhãn hệ + summary.
//
// Hai lớp kiểm:
//   1. Snapshot key ASCII hợp lệ → mọi formatter trả tiếng Việt Latin, 0 ký tự CJK.
//   2. Chuỗi tự do (naYin, tên quẻ, phục thần) mang chữ Hán → guard đổi "Thuật ngữ cũ",
//      KHÔNG rò Hán ra output (chứng minh guardFreeText chặn đúng chỗ).
//
// Test logic thuần: gọi formatter với fixture từng hệ con (cast snapshot tối thiểu — các
// formatter chỉ đọc field con tương ứng). Tử Vi đã có palace-view-cjk.test.ts riêng.
import { describe, expect, it } from 'vitest';
import type { ChartDetailResponse } from '@ziweiai/contracts';
import { CJK_TEXT_PATTERN } from '$lib/text/cjk';
import { viCopy } from '$lib/i18n/vi';
import {
  formatBaziPillarRows,
  formatBaziMetaItems,
  formatMangpaiInsightItems,
  formatMangpaiNarrative,
  formatMangpaiTitle,
  formatMeihuaMetaItems,
  formatMeihuaHexagramItems,
  formatLiuyaoHexagramItems,
  formatLiuyaoMetaItems,
  formatLiuyaoLineDescription,
  formatDaliurenMetaItems,
  formatDaliurenLessonItems,
  formatDaliurenTransmissionItems,
  formatQimenMetaItems,
  buildQimenPalaceCells,
  formatChartSystemLabel,
} from './chart-display';

type Snapshot = ChartDetailResponse['snapshot'];

// Cast tối thiểu: formatter chỉ đọc field con tương ứng (snapshot.bazi, snapshot.liuyao…).
function asSnapshot(partial: Record<string, unknown>): Snapshot {
  return partial as unknown as Snapshot;
}

function assertNoCjk(values: readonly string[]): void {
  for (const value of values) {
    expect(CJK_TEXT_PATTERN.test(value), `rò chữ Hán/CJK: "${value}"`).toBe(false);
  }
}

function collectItems(items: readonly { label: string; value: string }[]): string[] {
  return items.flatMap((item) => [item.label, item.value]);
}

// --- Fixtures key ASCII hợp lệ (naYin dạng Latin tiếng Việt) ---

const baziPillar = (slot: 'year' | 'month' | 'day' | 'hour') => ({
  slot,
  heavenlyStemKey: 'jiaHeavenly',
  earthlyBranchKey: 'ziEarthly',
  heavenlyStemElementKey: 'wood',
  earthlyBranchElementKey: 'water',
  heavenlyStemTenGodKey: 'biJian',
  earthlyBranchTenGodKeys: ['zhengYin'],
  hiddenStems: [{ heavenlyStemKey: 'guiHeavenly', elementKey: 'water', tenGodKey: 'zhengYin' }],
  naYin: 'Hải Trung Kim',
});

const baziStemBranch = { heavenlyStemKey: 'jiaHeavenly', earthlyBranchKey: 'ziEarthly', naYin: 'Hải Trung Kim' };

const baziSnapshot = asSnapshot({
  bazi: {
    dayMasterHeavenlyStemKey: 'jiaHeavenly',
    pillars: [baziPillar('year'), baziPillar('month'), baziPillar('day'), baziPillar('hour')],
    taiYuan: baziStemBranch,
    taiXi: baziStemBranch,
    mingGong: baziStemBranch,
    shenGong: baziStemBranch,
  },
  pillars: [],
});

const meihuaSnapshot = asSnapshot({
  meihua: {
    method: 'time-based',
    guaCode: 111,
    movingLine: 3,
    mainHexagram: { topTrigramKey: 'qianTrigram', bottomTrigramKey: 'kunTrigram' },
    nuclearHexagram: { topTrigramKey: 'kanTrigram', bottomTrigramKey: 'liTrigram' },
    changedHexagram: { topTrigramKey: 'zhenTrigram', bottomTrigramKey: 'genTrigram' },
    bodyTrigramKey: 'qianTrigram',
    useTrigramKey: 'kunTrigram',
    bodyElementKey: 'metal',
    useElementKey: 'earth',
    relationKey: 'useGeneratesBody',
  },
});

const liuyaoLine = (position: number, roleKey: 'none' | 'shi' | 'ying') => ({
  position,
  value: 'yang',
  stateKey: 'youngYang',
  isMoving: false,
  roleKey,
  sixKinKey: 'wifeWealth',
  earthlyBranchKey: 'ziEarthly',
  fiveElementKey: 'water',
  naYin: 'Hải Trung Kim',
  sixSpiritKey: 'azureDragon',
  hiddenSpirit: 'Tý Thủy Phụ Mẫu',
});

const liuyaoSnapshot = asSnapshot({
  liuyao: {
    method: 'time-based',
    movingLinePositions: [3],
    baseHexagram: {
      name: 'Thuần Càn',
      lines: [
        liuyaoLine(1, 'shi'),
        liuyaoLine(2, 'none'),
        liuyaoLine(3, 'none'),
        liuyaoLine(4, 'ying'),
        liuyaoLine(5, 'none'),
        liuyaoLine(6, 'none'),
      ],
    },
    changedHexagram: { name: 'Thiên Phong Cấu', lines: [] },
    nuclearHexagram: { name: 'Thuần Càn', lines: [] },
  },
});

const daliurenSnapshot = asSnapshot({
  daliuren: {
    boardTypeKey: 'forwardSanHe',
    monthGeneralBranchKey: 'ziEarthly',
    monthGeneralKey: 'shenHou',
    fourLessons: [
      { position: 1, upperBranchKey: 'ziEarthly', lowerStemKey: 'jiaHeavenly', lowerBranchKey: null, dunGanKey: 'jiaHeavenly', spiritKey: 'noblePerson' },
      { position: 2, upperBranchKey: 'chouEarthly', lowerStemKey: null, lowerBranchKey: 'ziEarthly', dunGanKey: null, spiritKey: 'azureDragon' },
      { position: 3, upperBranchKey: 'yinEarthly', lowerStemKey: null, lowerBranchKey: 'chouEarthly', dunGanKey: null, spiritKey: 'whiteTiger' },
      { position: 4, upperBranchKey: 'maoEarthly', lowerStemKey: null, lowerBranchKey: 'yinEarthly', dunGanKey: null, spiritKey: 'greatYin' },
    ],
    threeTransmissions: [
      { slot: 'initial', branchKey: 'ziEarthly', dunGanKey: 'jiaHeavenly', spiritKey: 'noblePerson', sixKinKey: 'parent' },
      { slot: 'middle', branchKey: 'chouEarthly', dunGanKey: null, spiritKey: 'azureDragon', sixKinKey: 'wifeWealth' },
      { slot: 'final', branchKey: 'yinEarthly', dunGanKey: null, spiritKey: 'whiteTiger', sixKinKey: 'sibling' },
    ],
  },
});

const qimenPalace = (palaceIndex: number) => ({
  palaceIndex,
  diPanStemKey: 'jiaHeavenly',
  tianPanStemKey: 'yiHeavenly',
  starKey: 'tianPeng',
  companionStarKey: palaceIndex === 2 ? 'tianQin' : null,
  gateKey: palaceIndex === 5 ? null : 'restGate',
  spiritKey: palaceIndex === 5 ? null : 'dutyChief',
});

const qimenSnapshot = asSnapshot({
  qimen: {
    dunKey: 'yangDun',
    yuanKey: 'upperYuan',
    juShu: 1,
    dutyChiefStarKey: 'tianPeng',
    dutyGateKey: 'restGate',
    palaces: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(qimenPalace),
  },
});

describe('no chữ Hán — output toàn hệ (US-007)', () => {
  it('nhãn 12 hệ thuật số đều tiếng Việt, 0 ký tự CJK', () => {
    const labels = ([
      'ba-zi',
      'mei-hua-yi-shu',
      'liu-yao',
      'da-liu-ren',
      'qi-men-dun-jia',
      'zi-wei-dou-shu',
      'hepan',
      'mangpai',
      'tarot',
      'mbti',
      'face',
      'palm',
    ] as const).map((system) => formatChartSystemLabel(system));
    expect(labels).toContain(viCopy.chartSystem['ba-zi']);
    expect(labels).toContain(viCopy.chartSystem.tarot);
    assertNoCjk(labels);
  });

  it('Bát Tự: tứ trụ + mệnh bàn không rò Hán', () => {
    assertNoCjk([...collectItems(formatBaziPillarRows(baziSnapshot)), ...collectItems(formatBaziMetaItems(baziSnapshot))]);
  });

  it('Mạnh Phái: tiêu đề + diễn giải + insight không rò Hán', () => {
    const mangpaiSnapshot = asSnapshot({
      mangpai: {
        dayPillarHeavenlyStemKey: 'jiaHeavenly',
        dayPillarEarthlyBranchKey: 'ziEarthly',
        dayMasterElementKey: 'wood',
        monthCommandElementKey: 'water',
        title: 'Nhật chủ Giáp Mộc tọa chi Tý',
        narrative: 'Theo phép Mạnh Phái lấy nhật chủ làm trọng, lá số luận quanh Giáp Mộc.',
        insights: [
          { heading: 'Nhật chủ', detail: 'Giáp Mộc chủ về khí sinh phát, vươn lên.' },
          { heading: 'Cường nhược: thân vượng', detail: 'Được nguyệt lệnh sinh phù nên thân vượng.' },
        ],
      },
    });
    assertNoCjk([
      formatMangpaiTitle(mangpaiSnapshot),
      formatMangpaiNarrative(mangpaiSnapshot),
      ...collectItems(formatMangpaiInsightItems(mangpaiSnapshot)),
    ]);
  });

  it('Mai Hoa: meta + quẻ tượng không rò Hán', () => {
    assertNoCjk([...collectItems(formatMeihuaMetaItems(meihuaSnapshot)), ...collectItems(formatMeihuaHexagramItems(meihuaSnapshot))]);
  });

  it('Lục Hào: quẻ + meta + sáu hào không rò Hán', () => {
    const lineText = liuyaoSnapshot.liuyao!.baseHexagram.lines.map((line) => formatLiuyaoLineDescription(line));
    assertNoCjk([
      ...collectItems(formatLiuyaoHexagramItems(liuyaoSnapshot)),
      ...collectItems(formatLiuyaoMetaItems(liuyaoSnapshot)),
      ...lineText,
    ]);
  });

  it('Đại Lục Nhâm: thiên địa bàn + tứ khóa + tam truyền không rò Hán', () => {
    assertNoCjk([
      ...collectItems(formatDaliurenMetaItems(daliurenSnapshot)),
      ...collectItems(formatDaliurenLessonItems(daliurenSnapshot)),
      ...collectItems(formatDaliurenTransmissionItems(daliurenSnapshot)),
    ]);
  });

  it('Kỳ Môn: cục + cửu cung không rò Hán', () => {
    const cellText = buildQimenPalaceCells(qimenSnapshot).flatMap((cell) =>
      [cell.star, cell.companionStar, cell.gate, cell.spirit, cell.heavenStem, cell.earthStem].filter(
        (value): value is string => value !== null,
      ),
    );
    assertNoCjk([...collectItems(formatQimenMetaItems(qimenSnapshot)), ...cellText]);
  });

  it('chuỗi tự do mang chữ Hán → guard đổi "Thuật ngữ cũ", không rò Hán', () => {
    // naYin Hán (Bát Tự) + tên quẻ Hán (Lục Hào) là chuỗi engine tự do; guardFreeText phải chặn.
    const hanBazi = asSnapshot({
      bazi: {
        ...baziSnapshot.bazi,
        taiYuan: { heavenlyStemKey: 'jiaHeavenly', earthlyBranchKey: 'ziEarthly', naYin: '海中金' },
      },
      pillars: [],
    });
    const hanLiuyao = asSnapshot({
      liuyao: {
        ...liuyaoSnapshot.liuyao,
        baseHexagram: { name: '乾為天', lines: [] },
        changedHexagram: { name: '天風姤', lines: [] },
        nuclearHexagram: undefined,
      },
    });

    const baziValues = collectItems(formatBaziMetaItems(hanBazi));
    const liuyaoValues = collectItems(formatLiuyaoHexagramItems(hanLiuyao));

    expect(baziValues.some((value) => value.includes('Thuật ngữ cũ'))).toBe(true);
    expect(liuyaoValues).toContain('Quẻ gốc');
    expect(liuyaoValues.some((value) => value.includes('Thuật ngữ cũ'))).toBe(true);
    assertNoCjk([...baziValues, ...liuyaoValues]);
  });
});
