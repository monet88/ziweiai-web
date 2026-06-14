import {
  type BirthInput,
  type ChartSnapshot,
  type MeihuaChart,
  type MeihuaHexagram,
  type MeihuaLine,
} from '@ziweiai/contracts';
import { chartSystemRequiresGender } from '@ziweiai/contracts';
import { Lunar, Solar } from 'lunar-javascript';
import { normalizeBirthInput } from '../normalization/normalize-birth-input';
import { PHASE3_CONFIG_PROFILE } from './phase-3-config';
import { createBaseSnapshotFields, createBlockedChartSnapshot } from './runtime-support';
import type { AstrologyChartAdapter, ChartCalculationOptions } from './astro-adapter';
import {
  buildHexagramKey,
  buildTimeBasedNumbers,
  formatMeihuaHexagramLabel,
  getRelationKey,
  getTrigramKeyByLines,
  getTrigramKeyByNumber,
  meihuaTrigramElementByKey,
  meihuaTrigramLinePatterns,
  translateMeihuaRelationKey,
  translateMeihuaTrigramKey,
} from './meihua-maps';

const MEIHUA_ADAPTER_VERSION = {
  name: 'lunar-javascript-meihua',
  version: '1.7.7-time-port',
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

function createLine(value: MeihuaLine['value'], position: number, movingLine: number): MeihuaLine {
  return {
    position,
    value,
    isMoving: position === movingLine,
  };
}

function flipLine(value: MeihuaLine['value']): MeihuaLine['value'] {
  return value === 'yang' ? 'yin' : 'yang';
}

function buildHexagram(topTrigramKey: MeihuaHexagram['topTrigramKey'], bottomTrigramKey: MeihuaHexagram['bottomTrigramKey'], movingLine: number): MeihuaHexagram {
  const bottomLines = [...meihuaTrigramLinePatterns[bottomTrigramKey]];
  const topLines = [...meihuaTrigramLinePatterns[topTrigramKey]];
  const lines = [...bottomLines, ...topLines].map((value, index) => createLine(value, index + 1, movingLine));

  return {
    key: buildHexagramKey(topTrigramKey, bottomTrigramKey),
    topTrigramKey,
    bottomTrigramKey,
    lines,
  };
}

function buildChangedHexagram(mainHexagram: MeihuaHexagram, movingLine: number): MeihuaHexagram {
  const changedLines = mainHexagram.lines.map((line) =>
    line.position === movingLine ? { ...line, value: flipLine(line.value), isMoving: true } : { ...line, isMoving: false },
  );
  const bottomLines = changedLines.slice(0, 3).map((line) => line.value);
  const topLines = changedLines.slice(3, 6).map((line) => line.value);
  const bottomTrigramKey = getTrigramKeyByLines(bottomLines);
  const topTrigramKey = getTrigramKeyByLines(topLines);

  return {
    key: buildHexagramKey(topTrigramKey, bottomTrigramKey),
    topTrigramKey,
    bottomTrigramKey,
    lines: changedLines,
  };
}

function buildNuclearHexagram(mainHexagram: MeihuaHexagram): MeihuaHexagram {
  const source = mainHexagram.lines.map((line) => line.value);
  const bottomLines = [source[1]!, source[2]!, source[3]!];
  const topLines = [source[2]!, source[3]!, source[4]!];
  const bottomTrigramKey = getTrigramKeyByLines(bottomLines);
  const topTrigramKey = getTrigramKeyByLines(topLines);

  return {
    key: buildHexagramKey(topTrigramKey, bottomTrigramKey),
    topTrigramKey,
    bottomTrigramKey,
    lines: [...bottomLines, ...topLines].map((value, index) => ({
      position: index + 1,
      value,
      isMoving: false,
    })),
  };
}

export class MeiHuaAdapter implements AstrologyChartAdapter {
  readonly system = 'mei-hua-yi-shu' as const;
  readonly adapterName = 'lunar-javascript-meihua';
  readonly adapterVersion = '1.7.7-time-port';
  readonly usesViewYear = false;

  async calculateChart(input: BirthInput, _options?: ChartCalculationOptions): Promise<ChartSnapshot> {
    const normalizedBirth = normalizeBirthInput(input, { requiresGender: chartSystemRequiresGender('mei-hua-yi-shu') });
    const warnings = [...normalizedBirth.normalizationConfidence.reasons];

    if (normalizedBirth.normalizationConfidence.blocksExactReading) {
      return createBlockedChartSnapshot({
        input,
        normalizedBirth,
        chartSystem: 'mei-hua-yi-shu',
        canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
        adapterVersion: MEIHUA_ADAPTER_VERSION,
        confidence: normalizedBirth.normalizationConfidence,
        warnings,
      });
    }

    const lunar = toLunarSource(input);
    const yearBranch = lunar.getYearInGanZhiExact().slice(1);
    const hourBranch = lunar.getTimeInGanZhi().slice(1);
    const numbers = buildTimeBasedNumbers({
      lunarDay: lunar.getDay(),
      lunarMonth: Math.abs(lunar.getMonth()),
      yearBranch,
      hourBranch,
    });
    const topTrigramKey = getTrigramKeyByNumber(numbers.topNumber);
    const bottomTrigramKey = getTrigramKeyByNumber(numbers.bottomNumber);
    const mainHexagram = buildHexagram(topTrigramKey, bottomTrigramKey, numbers.movingLine);
    const changedHexagram = buildChangedHexagram(mainHexagram, numbers.movingLine);
    const nuclearHexagram = buildNuclearHexagram(mainHexagram);
    const bodyTrigramKey = numbers.movingLine > 3 ? bottomTrigramKey : topTrigramKey;
    const useTrigramKey = numbers.movingLine > 3 ? topTrigramKey : bottomTrigramKey;
    const bodyElementKey = meihuaTrigramElementByKey[bodyTrigramKey];
    const useElementKey = meihuaTrigramElementByKey[useTrigramKey];
    const relationKey = getRelationKey(bodyElementKey, useElementKey);
    const meihua: MeihuaChart = {
      method: 'time-based',
      guaCode: numbers.topNumber * 100 + numbers.bottomNumber * 10 + numbers.movingLine,
      movingLine: numbers.movingLine,
      mainHexagram,
      changedHexagram,
      nuclearHexagram,
      bodyTrigramKey,
      useTrigramKey,
      bodyElementKey,
      useElementKey,
      relationKey,
    };
    const base = createBaseSnapshotFields({
      input,
      chartSystem: 'mei-hua-yi-shu',
      canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
      adapterVersion: MEIHUA_ADAPTER_VERSION,
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
      pillars: [],
      summary: {
        method: 'Theo thời gian',
        mainHexagram: formatMeihuaHexagramLabel(mainHexagram),
        changedHexagram: formatMeihuaHexagramLabel(changedHexagram),
        nuclearHexagram: formatMeihuaHexagramLabel(nuclearHexagram),
        movingLine: `Hào ${numbers.movingLine}`,
        bodyTrigram: translateMeihuaTrigramKey(bodyTrigramKey),
        useTrigram: translateMeihuaTrigramKey(useTrigramKey),
        relation: translateMeihuaRelationKey(relationKey),
      },
      meihua,
    };
  }
}
