export const PHASE3_ENGINE_SEMVER = '0.1.0';
export const PHASE3_SCHEMA_VERSION = 'phase-3-contracts-v2';
export const PHASE3_FIXTURE_SET_VERSION = 'phase-3-fixtures-v1';
export const PHASE3_CONFIG_PROFILE = 'phase-3-default';

export const PHASE3_REFERENCE_REPOS = ['.ref/iztro', '.ref/lunar-javascript'] as const;

export const PHASE3_IZTRO_CONFIG = {
  algorithm: 'default' as const,
  yearDivide: 'normal' as const,
  horoscopeDivide: 'normal' as const,
  ageDivide: 'normal' as const,
  dayDivide: 'forward' as const,
};
