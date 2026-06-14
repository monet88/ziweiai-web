import { z } from 'zod';
import {
  calculationConfidenceSchema,
  chartProvenanceSchema,
  engineVersionSchema,
  inputHashSchema,
  normalizedBirthSchema,
  ruleSourceSchema,
} from './chart-metadata';
import {
  baziEarthlyBranchKeys,
  baziFiveElementKeys,
  baziHeavenlyStemKeys,
  baziPillarSlots,
  baziTenGodKeys,
} from './bazi-terms';
import {
  meihuaElementKeys,
  meihuaLineValueKeys,
  meihuaMethodKeys,
  meihuaRelationKeys,
  meihuaTrigramKeys,
} from './meihua-terms';
import {
  liuyaoLineStateKeys,
  liuyaoLineValueKeys,
  liuyaoMethodKeys,
  liuyaoRoleKeys,
  liuyaoSixKinKeys,
  liuyaoSixSpiritKeys,
} from './liuyao-terms';
import {
  daliurenBoardTypeKeys,
  daliurenMonthGeneralKeys,
  daliurenSpiritKeys,
  daliurenTransmissionSlots,
} from './daliuren-terms';
import { qimenDunKeys, qimenGateKeys, qimenSpiritKeys, qimenStarKeys, qimenYuanKeys } from './qimen-terms';
import { chartSystems } from './chart-system';

const keyPattern = /^[A-Za-z][A-Za-z0-9_]*$/;

type LegacyPalace = {
  name: string;
  stars: string[];
};

function isLegacyPalace(value: unknown): value is LegacyPalace {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'name' in value &&
      'stars' in value &&
      !('nameKey' in value) &&
      typeof (value as { name: unknown }).name === 'string' &&
      Array.isArray((value as { stars: unknown }).stars),
  );
}

function normalizeLegacyChartSnapshot(value: unknown): unknown {
  if (!value || typeof value !== 'object' || !('palaces' in value) || !Array.isArray((value as { palaces: unknown }).palaces)) {
    return value;
  }

  const snapshot = value as Record<string, unknown> & { palaces: unknown[] };
  if (!snapshot.palaces.some(isLegacyPalace)) {
    return value;
  }

  return {
    ...snapshot,
    palaces: snapshot.palaces.map((palace, index) =>
      isLegacyPalace(palace)
        ? {
            nameKey: `legacyPalace${index}`,
            displayName: palace.name,
            index,
            heavenlyStemKey: `legacyHeavenlyStem${index}`,
            earthlyBranchKey: `legacyEarthlyBranch${index}`,
            isBodyPalace: false,
            isOriginalPalace: false,
            majorStars: palace.stars.map((starName, starIndex) => ({
              nameKey: `legacyStar${index}_${starIndex}`,
              group: 'major' as const,
              displayName: starName,
            })),
            minorStars: [],
            adjectiveStars: [],
            ages: [],
          }
        : palace,
    ),
  };
}

const chartSystemSchema = z.enum(chartSystems);
export const chartKeySchema = z.string().regex(keyPattern);
export const starGroupSchema = z.enum(['major', 'minor', 'adjective']);
export const brightnessKeySchema = z.enum(['miao', 'wang', 'de', 'li', 'ping', 'bu', 'xian']);
export const mutagenKeySchema = z.enum(['lu', 'quyen', 'khoa', 'ky']);
export const baziPillarSlotSchema = z.enum(baziPillarSlots);
export const baziHeavenlyStemKeySchema = z.enum(baziHeavenlyStemKeys);
export const baziEarthlyBranchKeySchema = z.enum(baziEarthlyBranchKeys);
export const baziFiveElementKeySchema = z.enum(baziFiveElementKeys);
export const baziTenGodKeySchema = z.enum(baziTenGodKeys);
export const meihuaTrigramKeySchema = z.enum(meihuaTrigramKeys);
export const meihuaElementKeySchema = z.enum(meihuaElementKeys);
export const meihuaLineValueSchema = z.enum(meihuaLineValueKeys);
export const meihuaMethodSchema = z.enum(meihuaMethodKeys);
export const meihuaRelationKeySchema = z.enum(meihuaRelationKeys);
export const liuyaoLineValueSchema = z.enum(liuyaoLineValueKeys);
export const liuyaoLineStateKeySchema = z.enum(liuyaoLineStateKeys);
export const liuyaoRoleKeySchema = z.enum(liuyaoRoleKeys);
export const liuyaoSixKinKeySchema = z.enum(liuyaoSixKinKeys);
export const liuyaoSixSpiritKeySchema = z.enum(liuyaoSixSpiritKeys);
export const liuyaoMethodSchema = z.enum(liuyaoMethodKeys);
export const daliurenSpiritKeySchema = z.enum(daliurenSpiritKeys);
export const daliurenMonthGeneralKeySchema = z.enum(daliurenMonthGeneralKeys);
export const daliurenBoardTypeKeySchema = z.enum(daliurenBoardTypeKeys);
export const daliurenTransmissionSlotSchema = z.enum(daliurenTransmissionSlots);
export const qimenStarKeySchema = z.enum(qimenStarKeys);
export const qimenGateKeySchema = z.enum(qimenGateKeys);
export const qimenSpiritKeySchema = z.enum(qimenSpiritKeys);
export const qimenDunKeySchema = z.enum(qimenDunKeys);
export const qimenYuanKeySchema = z.enum(qimenYuanKeys);

export const starSchema = z.object({
  nameKey: chartKeySchema,
  group: starGroupSchema,
  brightnessKey: brightnessKeySchema.optional(),
  mutagen: mutagenKeySchema.optional(),
  // Original human-readable label carried over from pre-key (v1) snapshots so
  // display layers can show the real star name instead of a synthetic key.
  displayName: z.string().min(1).optional(),
});

export const palaceSchema = z.object({
  nameKey: chartKeySchema,
  index: z.number().int().min(0).max(11),
  heavenlyStemKey: chartKeySchema,
  earthlyBranchKey: chartKeySchema,
  isBodyPalace: z.boolean(),
  isOriginalPalace: z.boolean(),
  majorStars: z.array(starSchema),
  minorStars: z.array(starSchema),
  adjectiveStars: z.array(starSchema),
  changsheng12Key: chartKeySchema.optional(),
  decadalRange: z.tuple([z.number().int(), z.number().int()]).optional(),
  ages: z.array(z.number().int().nonnegative()),
  // Original human-readable label carried over from pre-key (v1) snapshots so
  // display layers can show the real palace name instead of a synthetic key.
  displayName: z.string().min(1).optional(),
});

export const pillarSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1).optional(),
  heavenlyStemKey: chartKeySchema.optional(),
  earthlyBranchKey: chartKeySchema.optional(),
  hiddenStemKeys: z.array(chartKeySchema).optional(),
  stemTenGodKey: chartKeySchema.optional(),
  branchTenGodKeys: z.array(chartKeySchema).optional(),
});

export const baziStemBranchSchema = z.object({
  heavenlyStemKey: baziHeavenlyStemKeySchema,
  earthlyBranchKey: baziEarthlyBranchKeySchema,
});

export const baziHiddenStemSchema = z.object({
  heavenlyStemKey: baziHeavenlyStemKeySchema,
  elementKey: baziFiveElementKeySchema,
  tenGodKey: baziTenGodKeySchema.optional(),
});

export const baziPillarDetailSchema = z.object({
  slot: baziPillarSlotSchema,
  heavenlyStemKey: baziHeavenlyStemKeySchema,
  earthlyBranchKey: baziEarthlyBranchKeySchema,
  heavenlyStemElementKey: baziFiveElementKeySchema,
  earthlyBranchElementKey: baziFiveElementKeySchema,
  heavenlyStemTenGodKey: baziTenGodKeySchema,
  earthlyBranchTenGodKeys: z.array(baziTenGodKeySchema),
  hiddenStems: z.array(baziHiddenStemSchema),
  naYin: z.string().min(1),
});

export const baziChartSchema = z.object({
  dayMasterHeavenlyStemKey: baziHeavenlyStemKeySchema,
  pillars: z.array(baziPillarDetailSchema).length(4),
  taiYuan: baziStemBranchSchema.extend({ naYin: z.string().min(1) }),
  taiXi: baziStemBranchSchema.extend({ naYin: z.string().min(1) }),
  mingGong: baziStemBranchSchema.extend({ naYin: z.string().min(1) }),
  shenGong: baziStemBranchSchema.extend({ naYin: z.string().min(1) }),
});

export const meihuaLineSchema = z.object({
  position: z.number().int().min(1).max(6),
  value: meihuaLineValueSchema,
  isMoving: z.boolean(),
});

export const meihuaHexagramSchema = z.object({
  key: z.string().min(1),
  topTrigramKey: meihuaTrigramKeySchema,
  bottomTrigramKey: meihuaTrigramKeySchema,
  lines: z.array(meihuaLineSchema).length(6),
});

export const meihuaChartSchema = z.object({
  method: meihuaMethodSchema,
  guaCode: z.number().int().min(111).max(886),
  movingLine: z.number().int().min(1).max(6),
  mainHexagram: meihuaHexagramSchema,
  changedHexagram: meihuaHexagramSchema,
  nuclearHexagram: meihuaHexagramSchema,
  bodyTrigramKey: meihuaTrigramKeySchema,
  useTrigramKey: meihuaTrigramKeySchema,
  bodyElementKey: meihuaElementKeySchema,
  useElementKey: meihuaElementKeySchema,
  relationKey: meihuaRelationKeySchema,
});

export const liuyaoLineSchema = z.object({
  position: z.number().int().min(1).max(6),
  value: liuyaoLineValueSchema,
  stateKey: liuyaoLineStateKeySchema,
  isMoving: z.boolean(),
  roleKey: liuyaoRoleKeySchema,
  sixKinKey: liuyaoSixKinKeySchema,
  earthlyBranchKey: baziEarthlyBranchKeySchema,
  fiveElementKey: baziFiveElementKeySchema,
  naYin: z.string().min(1),
  sixSpiritKey: liuyaoSixSpiritKeySchema,
  hiddenSpirit: z.string().min(1).nullable(),
});

export const liuyaoHexagramSchema = z.object({
  key: z.string().min(1),
  topTrigramKey: meihuaTrigramKeySchema,
  bottomTrigramKey: meihuaTrigramKeySchema,
  name: z.string().min(1),
  symbol: z.string().min(1),
  lines: z.array(liuyaoLineSchema).length(6),
});

export const liuyaoChartSchema = z.object({
  method: liuyaoMethodSchema,
  movingLinePositions: z.array(z.number().int().min(1).max(6)).min(1).max(6),
  baseHexagram: liuyaoHexagramSchema,
  changedHexagram: liuyaoHexagramSchema,
  nuclearHexagram: liuyaoHexagramSchema.optional(),
  oppositeHexagram: liuyaoHexagramSchema.optional(),
  inverseHexagram: liuyaoHexagramSchema.optional(),
});

export const daliurenCellSchema = z.object({
  // diPan: địa bàn cố định (Dần→Sửu), heaven: thiên bàn phủ lên, spirit: thiên tướng, stem: độn can (có thể trống).
  positionBranchKey: baziEarthlyBranchKeySchema,
  heavenBranchKey: baziEarthlyBranchKeySchema,
  spiritKey: daliurenSpiritKeySchema,
  stemKey: baziHeavenlyStemKeySchema.nullable(),
});

export const daliurenLessonSchema = z.object({
  position: z.number().int().min(1).max(4),
  upperBranchKey: baziEarthlyBranchKeySchema,
  // Khóa 1 lấy nhật can (lowerStemKey); khóa 2-4 lấy địa chi (lowerBranchKey). Đúng một trong hai có giá trị.
  lowerStemKey: baziHeavenlyStemKeySchema.nullable(),
  lowerBranchKey: baziEarthlyBranchKeySchema.nullable(),
  dunGanKey: baziHeavenlyStemKeySchema.nullable(),
  spiritKey: daliurenSpiritKeySchema,
});

export const daliurenTransmissionSchema = z.object({
  slot: daliurenTransmissionSlotSchema,
  branchKey: baziEarthlyBranchKeySchema,
  dunGanKey: baziHeavenlyStemKeySchema.nullable(),
  spiritKey: daliurenSpiritKeySchema,
  sixKinKey: liuyaoSixKinKeySchema,
});

export const daliurenChartSchema = z.object({
  boardTypeKey: daliurenBoardTypeKeySchema,
  monthGeneralBranchKey: baziEarthlyBranchKeySchema,
  monthGeneralKey: daliurenMonthGeneralKeySchema,
  cells: z.array(daliurenCellSchema).length(12),
  fourLessons: z.array(daliurenLessonSchema).length(4),
  threeTransmissions: z.array(daliurenTransmissionSchema).length(3),
});

export const qimenPalaceSchema = z.object({
  // palaceIndex 1-9 theo Lạc Thư; cung 5 (trung cung) không có cửa/thần.
  palaceIndex: z.number().int().min(1).max(9),
  diPanStemKey: baziHeavenlyStemKeySchema.nullable(),
  tianPanStemKey: baziHeavenlyStemKeySchema.nullable(),
  starKey: qimenStarKeySchema.nullable(),
  // Sao Cầm gửi cùng cung (芮禽) khi thiên cầm không nhập trung.
  companionStarKey: qimenStarKeySchema.nullable(),
  gateKey: qimenGateKeySchema.nullable(),
  spiritKey: qimenSpiritKeySchema.nullable(),
});

export const qimenChartSchema = z.object({
  dunKey: qimenDunKeySchema,
  yuanKey: qimenYuanKeySchema,
  juShu: z.number().int().min(1).max(9),
  dutyChiefStarKey: qimenStarKeySchema,
  dutyGateKey: qimenGateKeySchema,
  palaces: z.array(qimenPalaceSchema).length(9),
});

export const lunarDateSummarySchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(30),
  isLeapMonth: z.boolean(),
  sexagenaryYearKey: chartKeySchema.optional(),
});

export const ganZhiPairSchema = z
  .object({
    heavenlyStemKey: chartKeySchema,
    earthlyBranchKey: chartKeySchema,
  })
  .strict();

export const blockedSummarySchema = z
  .object({
    status: z.literal('blocked'),
    reason: z.string().min(1),
  })
  .strict();

export const ziweiSummarySchema = z
  .object({
    genderKey: chartKeySchema.optional(),
    solarDate: z.string().min(1).optional(),
    lunarDate: lunarDateSummarySchema.optional(),
    zodiacKey: chartKeySchema.optional(),
    signKey: chartKeySchema.optional(),
    timeEarthlyBranchKey: chartKeySchema.optional(),
    soulPalaceNameKey: chartKeySchema.optional(),
    bodyPalaceNameKey: chartKeySchema.optional(),
    lifeMasterKey: chartKeySchema.optional(),
    bodyMasterKey: chartKeySchema.optional(),
    fiveElementsClassKey: chartKeySchema.optional(),
  })
  .strict();

export const baziSummarySchema = z
  .object({
    solarDate: z.string().min(1).optional(),
    lunarDate: z.union([lunarDateSummarySchema, z.string().min(1)]),
    zodiacKey: chartKeySchema.optional(),
    signKey: chartKeySchema.optional(),
    mingGong: z.union([z.string().min(1), ganZhiPairSchema]),
    shenGong: z.union([z.string().min(1), ganZhiPairSchema]),
    dayMaster: z.string().min(1).optional(),
    taiYuan: z.string().min(1).optional(),
    taiXi: z.string().min(1).optional(),
  })
  .strict();

export const meihuaSummarySchema = z
  .object({
    solarDate: z.string().min(1).optional(),
    lunarDate: z.union([lunarDateSummarySchema, z.string().min(1)]).optional(),
    zodiacKey: chartKeySchema.optional(),
    signKey: chartKeySchema.optional(),
    yearPillar: ganZhiPairSchema.optional(),
    monthPillar: ganZhiPairSchema.optional(),
    dayPillar: ganZhiPairSchema.optional(),
    hourPillar: ganZhiPairSchema.optional(),
    method: z.string().min(1).optional(),
    mainHexagram: z.string().min(1).optional(),
    changedHexagram: z.string().min(1).optional(),
    nuclearHexagram: z.string().min(1).optional(),
    movingLine: z.union([z.string().min(1), z.number().int().min(1).max(6)]),
    bodyTrigram: z.string().min(1).optional(),
    useTrigram: z.string().min(1).optional(),
    relation: z.string().min(1).optional(),
    upperTrigramKey: chartKeySchema.optional(),
    lowerTrigramKey: chartKeySchema.optional(),
    bodyTrigramKey: chartKeySchema.optional(),
    applicationTrigramKey: chartKeySchema.optional(),
    upperElementKey: chartKeySchema.optional(),
    lowerElementKey: chartKeySchema.optional(),
  })
  .strict();

export const liuyaoSummarySchema = z
  .object({
    solarDate: z.string().min(1).optional(),
    lunarDate: z.union([lunarDateSummarySchema, z.string().min(1)]).optional(),
    zodiacKey: chartKeySchema.optional(),
    signKey: chartKeySchema.optional(),
    yearPillar: ganZhiPairSchema.optional(),
    monthPillar: ganZhiPairSchema.optional(),
    dayPillar: ganZhiPairSchema.optional(),
    hourPillar: ganZhiPairSchema.optional(),
    method: z.string().min(1).optional(),
    baseHexagram: z.string().min(1).optional(),
    changedHexagram: z.string().min(1).optional(),
    movingLines: z.string().min(1).optional(),
    shiLine: z.string().min(1).optional(),
    yingLine: z.string().min(1).optional(),
    upperTrigramKey: chartKeySchema.optional(),
    lowerTrigramKey: chartKeySchema.optional(),
    transformedUpperTrigramKey: chartKeySchema.optional(),
    transformedLowerTrigramKey: chartKeySchema.optional(),
    yueJiangBranchKey: chartKeySchema.optional(),
    yueJiangSpiritKey: chartKeySchema.optional(),
    kongWangFirstBranchKey: chartKeySchema.optional(),
    kongWangSecondBranchKey: chartKeySchema.optional(),
    movingLine: z.number().int().min(1).max(6).optional(),
  })
  .strict();

export const daliurenSummarySchema = z
  .object({
    solarDate: z.string().min(1).optional(),
    lunarDate: z.union([lunarDateSummarySchema, z.string().min(1)]).optional(),
    zodiacKey: chartKeySchema.optional(),
    signKey: chartKeySchema.optional(),
    yearPillar: ganZhiPairSchema.optional(),
    monthPillar: ganZhiPairSchema.optional(),
    dayPillar: ganZhiPairSchema.optional(),
    hourPillar: ganZhiPairSchema.optional(),
    boardType: z.string().min(1).optional(),
    monthGeneral: z.string().min(1).optional(),
    firstLesson: z.string().min(1).optional(),
    initialTransmission: z.string().min(1).optional(),
    yueJiangBranchKey: chartKeySchema.optional(),
    yueJiangSpiritKey: chartKeySchema.optional(),
    guiRenModeKey: chartKeySchema.optional(),
    guiRenStartBranchKey: chartKeySchema.optional(),
  })
  .strict();

export const qimenSummarySchema = z
  .object({
    solarDate: z.string().min(1).optional(),
    lunarDate: z.union([lunarDateSummarySchema, z.string().min(1)]).optional(),
    zodiacKey: chartKeySchema.optional(),
    signKey: chartKeySchema.optional(),
    yearPillar: ganZhiPairSchema.optional(),
    monthPillar: ganZhiPairSchema.optional(),
    dayPillar: ganZhiPairSchema.optional(),
    hourPillar: ganZhiPairSchema.optional(),
    dun: z.string().min(1).optional(),
    juShu: z.union([z.string().min(1), z.number().int().min(1).max(9)]),
    dutyChief: z.string().min(1).optional(),
    dutyGate: z.string().min(1).optional(),
    jieQiKey: chartKeySchema.optional(),
    sanYuanKey: chartKeySchema.optional(),
    yinYangDunKey: chartKeySchema.optional(),
    xunShou: ganZhiPairSchema.optional(),
    xunShouYiZhangKey: chartKeySchema.optional(),
  })
  .strict();

export const legacySummarySchema = z.record(z.string(), z.string());
export const summarySchema = z.union([
  blockedSummarySchema,
  ziweiSummarySchema,
  baziSummarySchema,
  meihuaSummarySchema,
  liuyaoSummarySchema,
  daliurenSummarySchema,
  qimenSummarySchema,
  legacySummarySchema,
]);

export const horoscopeItemSchema = z.object({
  index: z.number().int().min(0).max(11),
  heavenlyStemKey: chartKeySchema,
  earthlyBranchKey: chartKeySchema,
  palaceNameKeys: z.array(chartKeySchema),
  mutagenStarKeys: z.array(chartKeySchema),
});

export const horoscopeAgeItemSchema = z.object({
  index: z.number().int().min(0).max(11),
  nominalAge: z.number().int().nonnegative(),
});

export const horoscopeSchema = z.object({
  decadal: horoscopeItemSchema,
  age: horoscopeAgeItemSchema,
  yearly: horoscopeItemSchema,
});

const canonicalChartSnapshotSchema = z.object({
  snapshotId: z.string().min(1),
  birth: normalizedBirthSchema,
  chartSystem: chartSystemSchema,
  palaces: z.array(palaceSchema),
  pillars: z.array(pillarSchema),
  summary: summarySchema,
  bazi: baziChartSchema.optional(),
  meihua: meihuaChartSchema.optional(),
  liuyao: liuyaoChartSchema.optional(),
  daliuren: daliurenChartSchema.optional(),
  qimen: qimenChartSchema.optional(),
  horoscope: horoscopeSchema.optional(),
  engineVersion: engineVersionSchema,
  ruleSource: ruleSourceSchema,
  inputHash: inputHashSchema,
  calculationConfidence: calculationConfidenceSchema,
  provenance: chartProvenanceSchema,
  createdAt: z.iso.datetime(),
});

export const chartSnapshotSchema = z.preprocess(normalizeLegacyChartSnapshot, canonicalChartSnapshotSchema);

export type ChartKey = z.infer<typeof chartKeySchema>;
export type StarGroup = z.infer<typeof starGroupSchema>;
export type BrightnessKey = z.infer<typeof brightnessKeySchema>;
export type MutagenKey = z.infer<typeof mutagenKeySchema>;
export type Star = z.infer<typeof starSchema>;
export type Palace = z.infer<typeof palaceSchema>;
export type Pillar = z.infer<typeof pillarSchema>;
export type BaziStemBranch = z.infer<typeof baziStemBranchSchema>;
export type BaziHiddenStem = z.infer<typeof baziHiddenStemSchema>;
export type BaziPillarDetail = z.infer<typeof baziPillarDetailSchema>;
export type BaziChart = z.infer<typeof baziChartSchema>;
export type MeihuaTrigramKey = z.infer<typeof meihuaTrigramKeySchema>;
export type MeihuaElementKey = z.infer<typeof meihuaElementKeySchema>;
export type MeihuaLineValue = z.infer<typeof meihuaLineValueSchema>;
export type MeihuaMethod = z.infer<typeof meihuaMethodSchema>;
export type MeihuaRelationKey = z.infer<typeof meihuaRelationKeySchema>;
export type MeihuaLine = z.infer<typeof meihuaLineSchema>;
export type MeihuaHexagram = z.infer<typeof meihuaHexagramSchema>;
export type MeihuaChart = z.infer<typeof meihuaChartSchema>;
export type LiuyaoMethod = z.infer<typeof liuyaoMethodSchema>;
export type LiuyaoLine = z.infer<typeof liuyaoLineSchema>;
export type LiuyaoHexagram = z.infer<typeof liuyaoHexagramSchema>;
export type LiuyaoChart = z.infer<typeof liuyaoChartSchema>;
export type DaliurenCell = z.infer<typeof daliurenCellSchema>;
export type DaliurenLesson = z.infer<typeof daliurenLessonSchema>;
export type DaliurenTransmission = z.infer<typeof daliurenTransmissionSchema>;
export type DaliurenChart = z.infer<typeof daliurenChartSchema>;
export type QimenPalace = z.infer<typeof qimenPalaceSchema>;
export type QimenChart = z.infer<typeof qimenChartSchema>;
export type LunarDateSummary = z.infer<typeof lunarDateSummarySchema>;
export type GanZhiPair = z.infer<typeof ganZhiPairSchema>;
export type BlockedSummary = z.infer<typeof blockedSummarySchema>;
export type ZiweiSummary = z.infer<typeof ziweiSummarySchema>;
export type BaziSummary = z.infer<typeof baziSummarySchema>;
export type MeihuaSummary = z.infer<typeof meihuaSummarySchema>;
export type LiuyaoSummary = z.infer<typeof liuyaoSummarySchema>;
export type DaliurenSummary = z.infer<typeof daliurenSummarySchema>;
export type QimenSummary = z.infer<typeof qimenSummarySchema>;
export type HoroscopeItem = z.infer<typeof horoscopeItemSchema>;
export type Horoscope = z.infer<typeof horoscopeSchema>;
export type ChartSnapshot = z.infer<typeof chartSnapshotSchema>;
export type ZiweiChartSnapshot = ChartSnapshot & { chartSystem: 'zi-wei-dou-shu' };
export type BaziChartSnapshot = ChartSnapshot & { chartSystem: 'ba-zi' };
export type MeihuaChartSnapshot = ChartSnapshot & { chartSystem: 'mei-hua-yi-shu' };
export type LiuyaoChartSnapshot = ChartSnapshot & { chartSystem: 'liu-yao' };
export type DaliurenChartSnapshot = ChartSnapshot & { chartSystem: 'da-liu-ren' };
export type QimenChartSnapshot = ChartSnapshot & { chartSystem: 'qi-men-dun-jia' };

export function isZiweiChartSnapshot(snapshot: ChartSnapshot): snapshot is ZiweiChartSnapshot {
  return snapshot.chartSystem === 'zi-wei-dou-shu';
}

export function isBaziChartSnapshot(snapshot: ChartSnapshot): snapshot is BaziChartSnapshot {
  return snapshot.chartSystem === 'ba-zi';
}
