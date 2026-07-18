import type { BirthInput, ChartSnapshot } from '@ziweiai/contracts';
import { chartSystemRequiresGender } from '@ziweiai/contracts';
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
  buildDaliurenChartFromXuanshu,
  buildDaliurenPillarsFromGanZhi,
  type XuanshuDaliurenResult,
} from './daliuren-maps';

const DALIUREN_ADAPTER_VERSION = {
  name: 'xuanshu-daliuren-bridge',
  version: 'phase-6-bridge-v1',
  configProfile: PHASE3_CONFIG_PROFILE,
} as const;

const CANONICAL_LIBRARY = { name: 'xuanshu', version: 'daliuren-reference' } as const;

export class DaliurenAdapter implements AstrologyChartAdapter {
  readonly system = 'da-liu-ren' as const;
  readonly adapterName = 'xuanshu-daliuren-bridge';
  readonly adapterVersion = 'phase-6-bridge-v1';
  readonly usesViewYear = false;

  async calculateChart(input: BirthInput, _options?: ChartCalculationOptions): Promise<ChartSnapshot> {
    const normalizedBirth = normalizeBirthInput(input, { requiresGender: chartSystemRequiresGender('da-liu-ren') });
    const warnings = [...normalizedBirth.normalizationConfidence.reasons];

    if (normalizedBirth.normalizationConfidence.blocksExactReading) {
      return createBlockedChartSnapshot({
        input,
        normalizedBirth,
        chartSystem: 'da-liu-ren',
        canonicalLibrary: CANONICAL_LIBRARY,
        adapterVersion: DALIUREN_ADAPTER_VERSION,
        confidence: normalizedBirth.normalizationConfidence,
        warnings,
      });
    }

    if (!isXuanshuReferenceRuntimeAvailable()) {
      return createBlockedChartSnapshot({
        input,
        normalizedBirth,
        chartSystem: 'da-liu-ren',
        canonicalLibrary: CANONICAL_LIBRARY,
        adapterVersion: DALIUREN_ADAPTER_VERSION,
        confidence: buildXuanshuRuntimeUnavailableConfidence(normalizedBirth.normalizationConfidence),
        warnings: [...warnings, 'XUANSHU_REFERENCE_RUNTIME_UNAVAILABLE'],
      });
    }

    const result = await runXuanshuBridge<XuanshuDaliurenResult>(
      'xuanshu-daliuren-runner.js',
      buildXuanshuBridgeSettings(input),
      'Đại Lục Nhâm',
    );
    const { chart, summary } = buildDaliurenChartFromXuanshu(result);
    const normalizedBirthWithGanZhi = {
      ...normalizedBirth,
      lunarDate: result.lunar,
      ganZhi: {
        yearPillar: result.yearGanZhi,
        monthPillar: result.monthGanZhi,
        dayPillar: result.dayGanZhi,
        hourPillar: result.hourGanZhi,
      },
    };
    const base = createBaseSnapshotFields({
      input,
      chartSystem: 'da-liu-ren',
      canonicalLibrary: CANONICAL_LIBRARY,
      adapterVersion: DALIUREN_ADAPTER_VERSION,
      normalizedBirth: normalizedBirthWithGanZhi,
      calculationConfidence: normalizedBirth.normalizationConfidence,
      warnings,
    });

    return {
      ...base,
      birth: normalizedBirthWithGanZhi,
      palaces: [],
      pillars: buildDaliurenPillarsFromGanZhi(result),
      summary,
      daliuren: chart,
    };
  }
}
