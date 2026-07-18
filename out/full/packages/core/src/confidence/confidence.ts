export const calculationConfidenceLevels = ['high', 'medium', 'low', 'blocked'] as const;
export type CalculationConfidenceLevel = (typeof calculationConfidenceLevels)[number];

export const calculationConfidenceReasonCodes = [
  'UNKNOWN_BIRTH_TIME',
  'MANUAL_TIMEZONE',
  'DST_AMBIGUOUS',
  'NO_TRUE_SOLAR_TIME',
  'FIXTURE_UNVERIFIED',
  'PLACE_UNRESOLVED',
] as const;
export type CalculationConfidenceReasonCode = (typeof calculationConfidenceReasonCodes)[number];

export function isBlockingConfidenceLevel(level: CalculationConfidenceLevel): boolean {
  return level === 'blocked';
}

export function blocksExactReading(
  reasons: readonly CalculationConfidenceReasonCode[],
): boolean {
  return reasons.includes('UNKNOWN_BIRTH_TIME') || reasons.includes('DST_AMBIGUOUS');
}
