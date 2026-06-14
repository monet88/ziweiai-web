import type { BirthInput, DaliurenChartSnapshot, Pillar } from '@ziweiai/contracts';
import { Lunar, Solar } from 'lunar-javascript';
import type { AstrologyChartAdapter, ChartCalculationOptions } from './astro-adapter';
import { normalizeBirthInput } from '../normalization/normalize-birth-input';
import { PHASE3_CONFIG_PROFILE } from './phase-3-config';
import { createBaseSnapshotFields, createBlockedChartSnapshot } from './runtime-support';
import { toGanZhiPair } from './shared/gan-zhi-keys';
import { buildDaLiuRenSummary, type DaLiuRenLunarSource } from './shared/liuyao-daliuren-summary';
import { resolveLunarMonthNumber } from './shared/resolve-lunar-month-number';

const DALIUREN_ADAPTER_VERSION = {
  name: 'lunar-javascript',
  version: '1.7.7',
  configProfile: PHASE3_CONFIG_PROFILE,
} as const;

function toLunarSource(input: BirthInput): DaLiuRenLunarSource {
  const hour = input.time.hour ?? 0;
  const minute = input.time.minute ?? 0;

  if (input.calendar === 'gregorian') {
    return Solar.fromYmdHms(input.date.year, input.date.month, input.date.day, hour, minute, 0).getLunar() as unknown as DaLiuRenLunarSource;
  }

  return Lunar.fromYmdHms(input.date.year, resolveLunarMonthNumber(input), input.date.day, hour, minute, 0) as unknown as DaLiuRenLunarSource;
}

function buildPillars(lunar: DaLiuRenLunarSource): Pillar[] {
  const values = [
    { name: 'Year', value: lunar.getYearInGanZhiExact() },
    { name: 'Month', value: lunar.getMonthInGanZhi?.() ?? lunar.getMonthInGanZhiExact() },
    { name: 'Day', value: lunar.getDayInGanZhiExact() },
    { name: 'Hour', value: lunar.getTimeInGanZhi() },
  ];

  return values.map((pillar) => {
    const pair = toGanZhiPair(pillar.value);
    return {
      name: pillar.name,
      heavenlyStemKey: pair.heavenlyStemKey,
      earthlyBranchKey: pair.earthlyBranchKey,
    };
  });
}

export class LunarJavascriptDaliurenAdapter implements AstrologyChartAdapter {
  readonly system = 'da-liu-ren' as const;
  readonly adapterName = 'lunar-javascript';
  readonly adapterVersion = '1.7.7';
  readonly usesViewYear = false;

  async calculateChart(input: BirthInput, _options?: ChartCalculationOptions): Promise<DaliurenChartSnapshot> {
    const normalizedBirth = normalizeBirthInput(input);
    const warnings = [...normalizedBirth.normalizationConfidence.reasons];

    if (normalizedBirth.normalizationConfidence.blocksExactReading) {
      return createBlockedChartSnapshot({
        input,
        normalizedBirth,
        chartSystem: 'da-liu-ren',
        canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
        adapterVersion: DALIUREN_ADAPTER_VERSION,
        confidence: normalizedBirth.normalizationConfidence,
        warnings,
      }) as DaliurenChartSnapshot;
    }

    const lunar = toLunarSource(input);
    const monthPillar = lunar.getMonthInGanZhi?.() ?? lunar.getMonthInGanZhiExact();
    const base = createBaseSnapshotFields({
      input,
      chartSystem: 'da-liu-ren',
      canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
      adapterVersion: DALIUREN_ADAPTER_VERSION,
      normalizedBirth: {
        ...normalizedBirth,
        lunarDate: `${lunar.getYear()}-${Math.abs(lunar.getMonth())}-${lunar.getDay()}`,
        ganZhi: {
          yearPillar: lunar.getYearInGanZhiExact(),
          monthPillar,
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
        lunarDate: `${lunar.getYear()}-${Math.abs(lunar.getMonth())}-${lunar.getDay()}`,
        ganZhi: {
          yearPillar: lunar.getYearInGanZhiExact(),
          monthPillar,
          dayPillar: lunar.getDayInGanZhiExact(),
          hourPillar: lunar.getTimeInGanZhi(),
        },
      },
      chartSystem: 'da-liu-ren',
      palaces: [],
      pillars: buildPillars(lunar),
      summary: buildDaLiuRenSummary(lunar, 0),
    };
  }
}
