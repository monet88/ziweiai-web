import {
  type BaziPillarDetail,
  type BaziEarthlyBranchKey,
  type BaziHeavenlyStemKey,
  type BirthInput,
  type ChartSnapshot,
} from '@ziweiai/contracts';
import { chartSystemRequiresGender } from '@ziweiai/contracts';
import { Lunar, Solar } from 'lunar-javascript';
import { normalizeBirthInput } from '../normalization/normalize-birth-input';
import { PHASE3_CONFIG_PROFILE } from './phase-3-config';
import { createBaseSnapshotFields, createBlockedChartSnapshot } from './runtime-support';
import type { AstrologyChartAdapter, ChartCalculationOptions } from './astro-adapter';
import {
  baziBranchElementByKey,
  baziHiddenStemKeysByBranch,
  formatBaziNaYinLabel,
  baziStemElementByKey,
  formatBaziStemBranchLabel,
  toBaziStemBranchKeyPair,
  toBaziTenGodKey,
} from './bazi-maps';

const BAZI_ADAPTER_VERSION = {
  name: 'lunar-javascript',
  version: '1.7.7',
  configProfile: PHASE3_CONFIG_PROFILE,
} as const;

function toLunarSource(input: BirthInput) {
  const hour = input.time.hour ?? 0;
  const minute = input.time.minute ?? 0;

  if (input.calendar === 'gregorian') {
    return Solar.fromYmdHms(input.date.year, input.date.month, input.date.day, hour, minute, 0).getLunar();
  }

  return Lunar.fromYmdHms(input.date.year, input.date.month, input.date.day, hour, minute, 0);
}

function buildStemBranchValue(heavenlyStemKey: BaziHeavenlyStemKey, earthlyBranchKey: BaziEarthlyBranchKey) {
  return formatBaziStemBranchLabel({
    heavenlyStemKey,
    earthlyBranchKey,
  });
}

function buildBaziPillarDetail(
  slot: BaziPillarDetail['slot'],
  stem: string,
  branch: string,
  stemTenGod: string,
  branchTenGods: string[],
  naYin: string,
): BaziPillarDetail {
  const { heavenlyStemKey, earthlyBranchKey } = toBaziStemBranchKeyPair(`${stem}${branch}`);

  return {
    slot,
    heavenlyStemKey,
    earthlyBranchKey,
    heavenlyStemElementKey: baziStemElementByKey[heavenlyStemKey],
    earthlyBranchElementKey: baziBranchElementByKey[earthlyBranchKey],
    heavenlyStemTenGodKey: toBaziTenGodKey(stemTenGod),
    earthlyBranchTenGodKeys: branchTenGods.map((value) => toBaziTenGodKey(value)),
    hiddenStems: baziHiddenStemKeysByBranch[earthlyBranchKey].map((hiddenStemKey, index) => ({
      heavenlyStemKey: hiddenStemKey,
      elementKey: baziStemElementByKey[hiddenStemKey],
      tenGodKey: branchTenGods[index] ? toBaziTenGodKey(branchTenGods[index]!) : undefined,
    })),
    naYin: formatBaziNaYinLabel(naYin),
  };
}

function buildCompoundStemBranch(value: string, naYin: string) {
  const { heavenlyStemKey, earthlyBranchKey } = toBaziStemBranchKeyPair(value);

  return {
    heavenlyStemKey,
    earthlyBranchKey,
    naYin: formatBaziNaYinLabel(naYin),
  };
}

export class LunarJavascriptBaziAdapter implements AstrologyChartAdapter {
  readonly system = 'ba-zi' as const;
  readonly adapterName = 'lunar-javascript';
  readonly adapterVersion = '1.7.7';
  readonly usesViewYear = false;

  async calculateChart(input: BirthInput, _options?: ChartCalculationOptions): Promise<ChartSnapshot> {
    const normalizedBirth = normalizeBirthInput(input, { requiresGender: chartSystemRequiresGender('ba-zi') });
    const warnings = [...normalizedBirth.normalizationConfidence.reasons];

    if (normalizedBirth.normalizationConfidence.blocksExactReading) {
      return createBlockedChartSnapshot({
        input,
        normalizedBirth,
        chartSystem: 'ba-zi',
        canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
        adapterVersion: BAZI_ADAPTER_VERSION,
        confidence: normalizedBirth.normalizationConfidence,
        warnings,
      });
    }

    const lunar = toLunarSource(input);
    const eightChar = lunar.getEightChar();
    const yearPillar = buildBaziPillarDetail(
      'year',
      eightChar.getYearGan(),
      eightChar.getYearZhi(),
      eightChar.getYearShiShenGan(),
      eightChar.getYearShiShenZhi(),
      eightChar.getYearNaYin(),
    );
    const monthPillar = buildBaziPillarDetail(
      'month',
      eightChar.getMonthGan(),
      eightChar.getMonthZhi(),
      eightChar.getMonthShiShenGan(),
      eightChar.getMonthShiShenZhi(),
      eightChar.getMonthNaYin(),
    );
    const dayPillar = buildBaziPillarDetail(
      'day',
      eightChar.getDayGan(),
      eightChar.getDayZhi(),
      eightChar.getDayShiShenGan(),
      eightChar.getDayShiShenZhi(),
      eightChar.getDayNaYin(),
    );
    const hourPillar = buildBaziPillarDetail(
      'hour',
      eightChar.getTimeGan(),
      eightChar.getTimeZhi(),
      eightChar.getTimeShiShenGan(),
      eightChar.getTimeShiShenZhi(),
      eightChar.getTimeNaYin(),
    );
    const mingGong = buildCompoundStemBranch(eightChar.getMingGong(), eightChar.getMingGongNaYin());
    const shenGong = buildCompoundStemBranch(eightChar.getShenGong(), eightChar.getShenGongNaYin());
    const taiYuan = buildCompoundStemBranch(eightChar.getTaiYuan(), eightChar.getTaiYuanNaYin());
    const taiXi = buildCompoundStemBranch(eightChar.getTaiXi(), eightChar.getTaiXiNaYin());
    const dayMaster = dayPillar.heavenlyStemKey;
    const base = createBaseSnapshotFields({
      input,
      chartSystem: 'ba-zi',
      canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
      adapterVersion: BAZI_ADAPTER_VERSION,
      normalizedBirth: {
        ...normalizedBirth,
        lunarDate: lunar.toString(),
        ganZhi: {
          yearPillar: lunar.getYearInGanZhiExact(),
          monthPillar: lunar.getMonthInGanZhiExact(),
          dayPillar: lunar.getDayInGanZhiExact(),
          hourPillar: lunar.getTimeInGanZhi(),
        },
      },
      calculationConfidence: normalizedBirth.normalizationConfidence,
      warnings,
    });

    return {
      ...base,
      birth: {
        ...normalizedBirth,
        lunarDate: lunar.toString(),
        ganZhi: {
          yearPillar: lunar.getYearInGanZhiExact(),
          monthPillar: lunar.getMonthInGanZhiExact(),
          dayPillar: lunar.getDayInGanZhiExact(),
          hourPillar: lunar.getTimeInGanZhi(),
        },
      },
      palaces: [],
      pillars: [
        { name: 'year', value: buildStemBranchValue(yearPillar.heavenlyStemKey, yearPillar.earthlyBranchKey) },
        { name: 'month', value: buildStemBranchValue(monthPillar.heavenlyStemKey, monthPillar.earthlyBranchKey) },
        { name: 'day', value: buildStemBranchValue(dayPillar.heavenlyStemKey, dayPillar.earthlyBranchKey) },
        { name: 'hour', value: buildStemBranchValue(hourPillar.heavenlyStemKey, hourPillar.earthlyBranchKey) },
      ],
      summary: {
        lunarDate: lunar.toString(),
        mingGong: buildStemBranchValue(mingGong.heavenlyStemKey, mingGong.earthlyBranchKey),
        shenGong: buildStemBranchValue(shenGong.heavenlyStemKey, shenGong.earthlyBranchKey),
        dayMaster: buildStemBranchValue(dayPillar.heavenlyStemKey, dayPillar.earthlyBranchKey),
        taiYuan: buildStemBranchValue(taiYuan.heavenlyStemKey, taiYuan.earthlyBranchKey),
        taiXi: buildStemBranchValue(taiXi.heavenlyStemKey, taiXi.earthlyBranchKey),
      },
      bazi: {
        dayMasterHeavenlyStemKey: dayMaster,
        pillars: [yearPillar, monthPillar, dayPillar, hourPillar],
        taiYuan,
        taiXi,
        mingGong,
        shenGong,
      },
    };
  }
}
