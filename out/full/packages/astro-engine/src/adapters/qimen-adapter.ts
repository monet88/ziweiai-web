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
  buildQimenChartFromXuanshu,
  buildQimenPillarsFromGanZhi,
  type XuanshuQimenResult,
} from './qimen-maps';

const QIMEN_ADAPTER_VERSION = {
  name: 'xuanshu-qimen-bridge',
  version: 'phase-7-bridge-v1',
  configProfile: PHASE3_CONFIG_PROFILE,
} as const;

const CANONICAL_LIBRARY = { name: 'xuanshu', version: 'qimen-reference' } as const;

// Cấu hình mặc định cho Kỳ Môn theo nguồn xuanshu: thời gia (paiPanType=3),
// Trực sử theo Âm/Dương Độn (zhiShiType=1), tháng/ngày/giờ theo nguồn chuẩn.
const DEFAULT_QIMEN_SETTINGS = {
  panType: 'zhuan',
  paiPanType: 3,
  zhiShiType: 1,
  yueJiaQiJuType: 0,
  jieQiType: 0,
  yearGanZhiType: 1,
  monthGanZhiType: 0,
  dayGanZhiType: 0,
  xuShiSuiType: 0,
} as const;

export class QimenAdapter implements AstrologyChartAdapter {
  readonly system = 'qi-men-dun-jia' as const;
  readonly adapterName = 'xuanshu-qimen-bridge';
  readonly adapterVersion = 'phase-7-bridge-v1';
  readonly usesViewYear = false;

  async calculateChart(input: BirthInput, _options?: ChartCalculationOptions): Promise<ChartSnapshot> {
    const normalizedBirth = normalizeBirthInput(input, { requiresGender: chartSystemRequiresGender('qi-men-dun-jia') });
    const warnings = [...normalizedBirth.normalizationConfidence.reasons];

    if (normalizedBirth.normalizationConfidence.blocksExactReading) {
      return createBlockedChartSnapshot({
        input,
        normalizedBirth,
        chartSystem: 'qi-men-dun-jia',
        canonicalLibrary: CANONICAL_LIBRARY,
        adapterVersion: QIMEN_ADAPTER_VERSION,
        confidence: normalizedBirth.normalizationConfidence,
        warnings,
      });
    }

    if (!isXuanshuReferenceRuntimeAvailable()) {
      return createBlockedChartSnapshot({
        input,
        normalizedBirth,
        chartSystem: 'qi-men-dun-jia',
        canonicalLibrary: CANONICAL_LIBRARY,
        adapterVersion: QIMEN_ADAPTER_VERSION,
        confidence: buildXuanshuRuntimeUnavailableConfidence(normalizedBirth.normalizationConfidence),
        warnings: [...warnings, 'XUANSHU_REFERENCE_RUNTIME_UNAVAILABLE'],
      });
    }

    const result = await runXuanshuBridge<XuanshuQimenResult>(
      'xuanshu-qimen-runner.js',
      { ...buildXuanshuBridgeSettings(input), ...DEFAULT_QIMEN_SETTINGS },
      'Kỳ Môn',
    );
    const { chart, summary } = buildQimenChartFromXuanshu(result);
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
      chartSystem: 'qi-men-dun-jia',
      canonicalLibrary: CANONICAL_LIBRARY,
      adapterVersion: QIMEN_ADAPTER_VERSION,
      normalizedBirth: normalizedBirthWithGanZhi,
      calculationConfidence: normalizedBirth.normalizationConfidence,
      warnings,
    });

    return {
      ...base,
      birth: normalizedBirthWithGanZhi,
      palaces: [],
      pillars: buildQimenPillarsFromGanZhi(result),
      summary,
      qimen: chart,
    };
  }
}
