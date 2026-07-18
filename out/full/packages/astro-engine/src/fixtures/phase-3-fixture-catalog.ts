type ChartSystem = 'zi-wei-dou-shu' | 'ba-zi';
type CalculationConfidenceLevel = 'high' | 'medium' | 'low' | 'blocked';

export interface Phase3FixtureCase {
  readonly id: string;
  readonly chartSystem: ChartSystem;
  readonly category:
    | 'common-valid'
    | 'calendar-boundary'
    | 'timezone-dst-ambiguity'
    | 'unknown-time'
    | 'upstream-parity'
    | 'provenance-warning';
  readonly expectedConfidence: CalculationConfidenceLevel;
}

export const phase3FixtureCatalog: readonly Phase3FixtureCase[] = [
  { id: 'zwds-common-01', chartSystem: 'zi-wei-dou-shu', category: 'common-valid', expectedConfidence: 'high' },
  { id: 'zwds-common-02', chartSystem: 'zi-wei-dou-shu', category: 'common-valid', expectedConfidence: 'high' },
  { id: 'bazi-common-01', chartSystem: 'ba-zi', category: 'common-valid', expectedConfidence: 'high' },
  { id: 'bazi-common-02', chartSystem: 'ba-zi', category: 'common-valid', expectedConfidence: 'high' },
  { id: 'zwds-boundary-01', chartSystem: 'zi-wei-dou-shu', category: 'calendar-boundary', expectedConfidence: 'medium' },
  { id: 'zwds-boundary-02', chartSystem: 'zi-wei-dou-shu', category: 'calendar-boundary', expectedConfidence: 'medium' },
  { id: 'bazi-boundary-01', chartSystem: 'ba-zi', category: 'calendar-boundary', expectedConfidence: 'medium' },
  { id: 'bazi-boundary-02', chartSystem: 'ba-zi', category: 'calendar-boundary', expectedConfidence: 'medium' },
  { id: 'dst-ambiguous-01', chartSystem: 'zi-wei-dou-shu', category: 'timezone-dst-ambiguity', expectedConfidence: 'blocked' },
  { id: 'dst-ambiguous-02', chartSystem: 'ba-zi', category: 'timezone-dst-ambiguity', expectedConfidence: 'blocked' },
  { id: 'unknown-time-01', chartSystem: 'zi-wei-dou-shu', category: 'unknown-time', expectedConfidence: 'low' },
  { id: 'unknown-time-02', chartSystem: 'ba-zi', category: 'unknown-time', expectedConfidence: 'low' },
  { id: 'upstream-iztro-01', chartSystem: 'zi-wei-dou-shu', category: 'upstream-parity', expectedConfidence: 'medium' },
  { id: 'upstream-iztro-02', chartSystem: 'zi-wei-dou-shu', category: 'upstream-parity', expectedConfidence: 'medium' },
  { id: 'upstream-lunar-01', chartSystem: 'ba-zi', category: 'upstream-parity', expectedConfidence: 'medium' },
  { id: 'warning-provenance-01', chartSystem: 'zi-wei-dou-shu', category: 'provenance-warning', expectedConfidence: 'low' },
];
