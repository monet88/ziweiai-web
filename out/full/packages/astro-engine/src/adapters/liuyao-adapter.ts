import type {
  BirthInput,
  ChartSnapshot,
  LiuyaoHexagram,
  LiuyaoLine,
  LiuyaoLineStateKey,
  LiuyaoMethod,
  LiuyaoRoleKey,
  LiuyaoSixKinKey,
  LiuyaoSixSpiritKey,
} from '@ziweiai/contracts';
import { chartSystemRequiresGender } from '@ziweiai/contracts';

// US-026: map a Lục Hào line state to the vendored runtime's manualYaoShu code
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
import { buildHexagramKey, formatMeihuaHexagramLabel, getTrigramKeyByLines } from './meihua-maps';

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

const FALLBACK_BRANCH_KEYS: LiuyaoLine['earthlyBranchKey'][] = [
  'ziEarthly',
  'chouEarthly',
  'yinEarthly',
  'maoEarthly',
  'chenEarthly',
  'siEarthly',
];
const FALLBACK_ELEMENT_KEYS: LiuyaoLine['fiveElementKey'][] = ['water', 'earth', 'wood', 'wood', 'earth', 'fire'];
const FALLBACK_SIX_KIN_KEYS: LiuyaoSixKinKey[] = ['parent', 'officerGhost', 'wifeWealth', 'sibling', 'childDescendant', 'parent'];
const FALLBACK_SIX_SPIRIT_KEYS: LiuyaoSixSpiritKey[] = [
  'azureDragon',
  'vermilionBird',
  'hookSnake',
  'soaringSerpent',
  'whiteTiger',
  'blackTortoise',
];
function stateToValue(state: LiuyaoLineStateKey): LiuyaoLine['value'] {
  return state === 'youngYang' || state === 'oldYang' ? 'yang' : 'yin';
}

function buildFallbackLineStates(input: BirthInput, manualLineStates?: readonly LiuyaoLineStateKey[]): LiuyaoLineStateKey[] {
  if (manualLineStates) {
    return [...manualLineStates];
  }

  const seed =
    input.date.year * 10_000 +
    input.date.month * 100 +
    input.date.day +
    (input.time.hour ?? 0) * 13 +
    (input.time.minute ?? 0) * 7;
  const movingIndex = Math.abs(seed) % 6;

  return Array.from({ length: 6 }, (_, index) => {
    const isYang = ((seed >> index) & 1) === 1;
    if (index === movingIndex) {
      return isYang ? 'oldYang' : 'oldYin';
    }
    return isYang ? 'youngYang' : 'youngYin';
  });
}

function buildFallbackHexagram(
  states: readonly LiuyaoLineStateKey[],
  changed = false,
): LiuyaoHexagram {
  const values = states.map((state) => {
    const base = stateToValue(state);
    return changed && (state === 'oldYang' || state === 'oldYin')
      ? base === 'yang'
        ? 'yin'
        : 'yang'
      : base;
  });
  const bottomTrigramKey = getTrigramKeyByLines(values.slice(0, 3));
  const topTrigramKey = getTrigramKeyByLines(values.slice(3, 6));
  const shiPosition = states.findIndex((state) => state === 'oldYang' || state === 'oldYin') + 1 || 1;
  const yingPosition = ((shiPosition + 2) % 6) + 1;

  const lines = values.map((value, index) => {
    const position = index + 1;
    const roleKey: LiuyaoRoleKey = position === shiPosition ? 'shi' : position === yingPosition ? 'ying' : 'none';

    return {
      position,
      value,
      stateKey: states[index]!,
      isMoving: states[index] === 'oldYang' || states[index] === 'oldYin',
      roleKey,
      sixKinKey: FALLBACK_SIX_KIN_KEYS[index]!,
      earthlyBranchKey: FALLBACK_BRANCH_KEYS[index]!,
      fiveElementKey: FALLBACK_ELEMENT_KEYS[index]!,
      naYin: 'Nạp âm tham khảo',
      sixSpiritKey: FALLBACK_SIX_SPIRIT_KEYS[index]!,
      hiddenSpirit: null,
    } satisfies LiuyaoLine;
  });

  return {
    key: buildHexagramKey(topTrigramKey, bottomTrigramKey),
    topTrigramKey,
    bottomTrigramKey,
    name: formatMeihuaHexagramLabel({ topTrigramKey, bottomTrigramKey }),
    symbol: values.map((value) => (value === 'yang' ? '1' : '0')).join(''),
    lines,
  };
}

function buildFallbackLiuyaoSnapshot(
  input: BirthInput,
  normalizedBirth: ReturnType<typeof normalizeBirthInput>,
  warnings: string[],
  manualLineStates?: readonly LiuyaoLineStateKey[],
): ChartSnapshot {
  const method: LiuyaoMethod = manualLineStates ? 'manual' : 'time-based';
  const states = buildFallbackLineStates(input, manualLineStates);
  const baseHexagram = buildFallbackHexagram(states);
  const changedHexagram = buildFallbackHexagram(states, true);
  const nuclearHexagram = buildDerivedNuclearHexagram(baseHexagram);
  const base = createBaseSnapshotFields({
    input,
    chartSystem: 'liu-yao',
    canonicalLibrary: { name: 'ziweiai-internal', version: 'liuyao-fallback-v1' },
    adapterVersion: {
      ...LIUYAO_ADAPTER_VERSION,
      version: `${LIUYAO_ADAPTER_VERSION.version}+fallback`,
    },
    normalizedBirth,
    calculationConfidence: {
      ...normalizedBirth.normalizationConfidence,
      level: normalizedBirth.normalizationConfidence.level === 'high' ? 'medium' : normalizedBirth.normalizationConfidence.level,
      blocksExactReading: false,
    },
    warnings: [...warnings, 'XUANSHU_REFERENCE_RUNTIME_FALLBACK'],
  });

  return {
    ...base,
    birth: normalizedBirth,
    palaces: [],
    pillars: [],
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
      movingLinePositions: baseHexagram.lines.filter((line) => line.isMoving).map((line) => line.position),
      baseHexagram,
      changedHexagram,
      nuclearHexagram,
    },
  };
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
      return buildFallbackLiuyaoSnapshot(input, normalizedBirth, warnings, manualLineStates);
    }

    let result: XuanshuLiuyaoResult;
    try {
      result = await runXuanshuBridge<XuanshuLiuyaoResult>(
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
    } catch {
      return buildFallbackLiuyaoSnapshot(input, normalizedBirth, warnings, manualLineStates);
    }
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
