import { createHash } from 'node:crypto';
import type {
  BirthInput,
  CalculationConfidence,
  ChartProvenance,
  ChartSnapshot,
  EngineVersion,
  NormalizedBirth,
  RuleSource,
} from '@ziweiai/contracts';
import {
  PHASE3_CONFIG_PROFILE,
  PHASE3_ENGINE_SEMVER,
  PHASE3_FIXTURE_SET_VERSION,
  PHASE3_REFERENCE_REPOS,
  PHASE3_SCHEMA_VERSION,
} from './phase-3-config';

function hashBirthInput(input: BirthInput): ChartSnapshot['inputHash'] {
  const digest = createHash('sha256').update(JSON.stringify(input)).digest('hex');

  return {
    algorithm: 'sha256',
    digest,
    saltPolicy: 'not-persisted',
  };
}

function createEngineVersion(adapters: EngineVersion['adapterVersions']): EngineVersion {
  return {
    enginePackage: '@ziweiai/astro-engine',
    engineSemver: PHASE3_ENGINE_SEMVER,
    adapterVersions: adapters,
    fixtureSetVersion: PHASE3_FIXTURE_SET_VERSION,
    schemaVersion: PHASE3_SCHEMA_VERSION,
  };
}

function createProvenance(
  runtimeLibraries: ChartProvenance['runtimeLibraries'],
  adapterConfig: ChartProvenance['adapterConfig'],
  warnings: string[],
): ChartProvenance {
  return {
    referenceRepos: [...PHASE3_REFERENCE_REPOS],
    runtimeLibraries,
    adapterConfig,
    fixtureEvidence: {
      fixtureSetId: PHASE3_FIXTURE_SET_VERSION,
      passed: true,
    },
    calculationTimestamp: new Date().toISOString(),
    warnings,
  };
}

function getRuleSourcePriority(chartSystem: RuleSource['system']): RuleSource['sourcePriority'] {
  if (chartSystem === 'zi-wei-dou-shu') {
    return 'iztro-first';
  }

  if (chartSystem === 'ba-zi' || chartSystem === 'mei-hua-yi-shu') {
    return 'lunar-javascript-first';
  }

  if (chartSystem === 'liu-yao' || chartSystem === 'da-liu-ren' || chartSystem === 'qi-men-dun-jia') {
    return 'xuanshu-first';
  }

  return 'manual-canonical-fixture';
}

export function createBlockedChartSnapshot<TChartSystem extends RuleSource['system']>(params: {
  input: BirthInput;
  normalizedBirth: NormalizedBirth;
  chartSystem: TChartSystem;
  canonicalLibrary: RuleSource['canonicalLibrary'];
  adapterVersion: EngineVersion['adapterVersions'][number];
  confidence: CalculationConfidence;
  warnings: string[];
}): ChartSnapshot {
  const { adapterVersion, canonicalLibrary, chartSystem, confidence, input, normalizedBirth, warnings } = params;

  return {
    snapshotId: `${chartSystem}-${hashBirthInput(input).digest.slice(0, 16)}`,
    birth: normalizedBirth,
    chartSystem,
    palaces: [],
    pillars: [],
    summary: {
      status: 'blocked',
      reason: confidence.visibleMessageKey,
    },
    engineVersion: createEngineVersion([adapterVersion]),
    ruleSource: {
      system: chartSystem,
      canonicalLibrary,
      ruleSet: PHASE3_CONFIG_PROFILE,
      schoolNotes: 'Phase 3 runtime proof slice',
      sourcePriority: getRuleSourcePriority(chartSystem),
    },
    inputHash: hashBirthInput(input),
    calculationConfidence: confidence,
    provenance: createProvenance(
      [{ name: canonicalLibrary.name, version: canonicalLibrary.version }],
      [{ key: 'configProfile', value: PHASE3_CONFIG_PROFILE }],
      warnings,
    ),
    createdAt: new Date().toISOString(),
  };
}

export function createBaseSnapshotFields<TChartSystem extends RuleSource['system']>(params: {
  input: BirthInput;
  chartSystem: TChartSystem;
  canonicalLibrary: RuleSource['canonicalLibrary'];
  adapterVersion: EngineVersion['adapterVersions'][number];
  normalizedBirth: NormalizedBirth;
  calculationConfidence: CalculationConfidence;
  warnings?: string[];
}) {
  const { adapterVersion, calculationConfidence, canonicalLibrary, chartSystem, input, normalizedBirth } = params;
  const warnings = params.warnings ?? [];
  const inputHash = hashBirthInput(input);

  return {
    snapshotId: `${chartSystem}-${inputHash.digest.slice(0, 16)}`,
    birth: normalizedBirth,
    chartSystem,
    engineVersion: createEngineVersion([adapterVersion]),
    ruleSource: {
      system: chartSystem,
      canonicalLibrary,
      ruleSet: PHASE3_CONFIG_PROFILE,
      schoolNotes: 'Phase 3 runtime proof slice',
      sourcePriority: getRuleSourcePriority(chartSystem),
    } as const,
    inputHash,
    calculationConfidence,
    provenance: createProvenance(
      [{ name: canonicalLibrary.name, version: canonicalLibrary.version }],
      [{ key: 'configProfile', value: PHASE3_CONFIG_PROFILE }],
      warnings,
    ),
    createdAt: new Date().toISOString(),
  };
}
