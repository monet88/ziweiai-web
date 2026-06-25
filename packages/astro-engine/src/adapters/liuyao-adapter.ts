import type { BirthInput, ChartSnapshot, LiuyaoLineStateKey, LiuyaoMethod } from '@ziweiai/contracts';
import { chartSystemRequiresGender } from '@ziweiai/contracts';

// US-026: map a Luc Hao line state to the vendored runtime's manualYaoShu code
// (0=youngYang, 1=youngYin, 2=oldYang[moving], 3=oldYin[moving]), bottom-to-top.
const LIUYAO_STATE_TO_MANUAL_CODE: Record<LiuyaoLineStateKey, number> = {
  youngYang: 0,
  youngYin: 1,
  oldYang: 2,
  oldYin: 3,
};
import { normalizeBirthInput } from '../normalization/normalize-birth-input';
import { PHASE3_CONFIG_PROFILE } from './phase-3-config';
import { createBaseSnapshotFields, createBlockedChartSnapshot } from './runtime-support';
import type { AstrologyChartAdapter, ChartCalculationOptions } from './astro-adapter';
import {
  buildXuanshuBridgeSettings,
  buildXuanshuRuntimeUnavailableConfidence,
  isXuanshuReferenceRuntimeAvailable,
  runXuanshuBridge,
} from './xuanshu-bridge';
import {
  buildDerivedNuclearHexagram,
  buildHexagramFromXuanshuLines,
  buildLiuyaoMethodLabel,
  buildLiuyaoMovingLinesLabel,
  buildLiuyaoRoleLineLabel,
  buildPillarsFromGanZhi,
} from './liuyao-maps';

const LIUYAO_ADAPTER_VERSION = {
  name: 'xuanshu-liuyao-bridge',
  version: 'phase-5-bridge-v1',
  configProfile: PHASE3_CONFIG_PROFILE,
} as const;

type XuanshuLiuyaoResult = {
  solar: string;
  lunar: string;
  shangGua: string;
  xiaGua: string;
  benGua: string;
  benGuaAs: string;
  bianGua: string;
  bianGuaAs: string;
  huGua: string;
  huGuaAs: string;
  ganZhi: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  liuYao: {
    benGua: {
      yaoAs: string[];
      yaoAsMarkName: string[];
      shiYing: string[];
      liuQin: string[];
      ganZhi: string[];
      wuXing: string[];
      naYin: string[];
      liuShen: string[];
      fuShen: string[];
    };
    bianGua: {
      yaoAs: string[];
      shiYing: string[];
      liuQin: string[];
      ganZhi: string[];
      wuXing: string[];
      naYin: string[];
      liuShen: string[];
    };
  };
};

function toXuanshuSex(input: BirthInput): 0 | 1 {
  return input.sexOrGenderForChart === 'female' ? 0 : 1;
}

function extractBaseStateKeys(result: XuanshuLiuyaoResult): LiuyaoLineStateKey[] {
  return result.liuYao.benGua.yaoAs.map((_, index) => {
    const name = result.liuYao.benGua.yaoAsMarkName[index]?.trim();
    switch (name) {
      case '老阴':
      case '老陰':
        return 'oldYin';
      case '老阳':
      case '老陽':
        return 'oldYang';
      case '少阳':
      case '少陽':
        return 'youngYang';
      default:
        return 'youngYin';
    }
  });
}

export class LiuyaoAdapter implements AstrologyChartAdapter {
  readonly system = 'liu-yao' as const;
  readonly adapterName = 'xuanshu-liuyao-bridge';
  readonly adapterVersion = 'phase-5-bridge-v1';
  readonly usesViewYear = false;

  async calculateChart(input: BirthInput, options?: ChartCalculationOptions): Promise<ChartSnapshot> {
    const normalizedBirth = normalizeBirthInput(input, { requiresGender: chartSystemRequiresGender('liu-yao') });
    const warnings = [...normalizedBirth.normalizationConfidence.reasons];
    const manualLineStates = options?.liuyaoManual?.lineStates;

    if (normalizedBirth.normalizationConfidence.blocksExactReading) {
      return createBlockedChartSnapshot({
        input,
        normalizedBirth,
        chartSystem: 'liu-yao',
        canonicalLibrary: { name: 'xuanshu', version: 'liuyao-reference' },
        adapterVersion: LIUYAO_ADAPTER_VERSION,
        confidence: normalizedBirth.normalizationConfidence,
        warnings,
      });
    }

    if (!isXuanshuReferenceRuntimeAvailable()) {
      return createBlockedChartSnapshot({
        input,
        normalizedBirth,
        chartSystem: 'liu-yao',
        canonicalLibrary: { name: 'xuanshu', version: 'liuyao-reference' },
        adapterVersion: LIUYAO_ADAPTER_VERSION,
        confidence: buildXuanshuRuntimeUnavailableConfidence(normalizedBirth.normalizationConfidence),
        warnings: [...warnings, 'XUANSHU_REFERENCE_RUNTIME_UNAVAILABLE'],
      });
    }

    const result = await runXuanshuBridge<XuanshuLiuyaoResult>(
      'xuanshu-liuyao-runner.js',
      {
        ...buildXuanshuBridgeSettings(input),
        sex: toXuanshuSex(input),
        // US-026: paiPanType 2 = manual line input (manualYaoShu codes bottom-to-top);
        // 0 = time-based (default). Manual states map to the runtime's 0-3 codes.
        paiPanType: manualLineStates ? 2 : 0,
        ...(manualLineStates
          ? { manualYaoShu: manualLineStates.map((state) => LIUYAO_STATE_TO_MANUAL_CODE[state]) }
          : {}),
      },
      'Lục Hào',
    );
    const method: LiuyaoMethod = manualLineStates ? 'manual' : 'time-based';
    const baseHexagram = buildHexagramFromXuanshuLines({
      lineData: result.liuYao.benGua,
      topTrigramLabel: result.shangGua,
      bottomTrigramLabel: result.xiaGua,
      hiddenSpiritMode: 'preserve',
    });
    const baseStateKeys = extractBaseStateKeys(result);
    const changedHexagram = buildHexagramFromXuanshuLines({
      lineData: result.liuYao.bianGua,
      hiddenSpiritMode: 'drop',
      baseStateKeys,
    });
    const movingLinePositions = baseHexagram.lines.filter((line) => line.isMoving).map((line) => line.position);
    const nuclearHexagram = buildDerivedNuclearHexagram(baseHexagram);
    const normalizedBirthWithGanZhi = {
      ...normalizedBirth,
      lunarDate: result.lunar,
      ganZhi: {
        yearPillar: result.ganZhi.year,
        monthPillar: result.ganZhi.month,
        dayPillar: result.ganZhi.day,
        hourPillar: result.ganZhi.hour,
      },
    };
    const base = createBaseSnapshotFields({
      input,
      chartSystem: 'liu-yao',
      canonicalLibrary: { name: 'xuanshu', version: 'liuyao-reference' },
      adapterVersion: LIUYAO_ADAPTER_VERSION,
      normalizedBirth: normalizedBirthWithGanZhi,
      calculationConfidence: normalizedBirth.normalizationConfidence,
      warnings,
    });

    return {
      ...base,
      birth: normalizedBirthWithGanZhi,
      palaces: [],
      pillars: buildPillarsFromGanZhi(result.ganZhi),
      summary: {
        method: buildLiuyaoMethodLabel(method),
        baseHexagram: baseHexagram.name,
        changedHexagram: changedHexagram.name,
        movingLines: buildLiuyaoMovingLinesLabel(baseHexagram.lines),
        shiLine: buildLiuyaoRoleLineLabel(baseHexagram.lines, 'shi'),
        yingLine: buildLiuyaoRoleLineLabel(baseHexagram.lines, 'ying'),
      },
      liuyao: {
        method,
        movingLinePositions,
        baseHexagram,
        changedHexagram,
        nuclearHexagram,
      },
    };
  }
}
