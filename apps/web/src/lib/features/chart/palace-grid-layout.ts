import type { PalaceView } from './chart-display';

const CANONICAL_BRANCH_KEYS = new Set([
  'siEarthly',
  'wuEarthly',
  'weiEarthly',
  'shenEarthly',
  'chenEarthly',
  'maoEarthly',
  'youEarthly',
  'xuEarthly',
  'yinEarthly',
  'chouEarthly',
  'ziEarthly',
  'haiEarthly',
]);

export function shouldUseWidePalaceGrid(isWide: boolean, palaces: PalaceView[]): boolean {
  return isWide && palaces.every((palace) => CANONICAL_BRANCH_KEYS.has(palace.earthlyBranchKey));
}
