import type { ChartSystem } from '@ziweiai/contracts';
import { getChartDetailRenderMode } from '../system-registry/chart-system-registry';

export function shouldRenderZiweiBoard(chartSystem: ChartSystem | null | undefined, palaceCount: number): boolean {
  return chartSystem === 'zi-wei-dou-shu' && palaceCount > 0;
}

export function getChartDetailState(chartSystem: ChartSystem | null | undefined, palaceCount: number) {
  if (!chartSystem) {
    return 'unsupported';
  }

  if (shouldRenderZiweiBoard(chartSystem, palaceCount)) {
    return 'ziwei-board';
  }

  if (chartSystem === 'zi-wei-dou-shu') {
    return 'unsupported';
  }

  return getChartDetailRenderMode(chartSystem);
}
