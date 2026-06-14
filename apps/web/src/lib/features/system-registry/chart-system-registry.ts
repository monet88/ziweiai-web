import type { ChartSystem } from '@ziweiai/contracts';

export type ChartDetailRenderMode = 'ziwei-board' | 'pillars' | 'hexagram' | 'liuyao' | 'daliuren' | 'qimen' | 'unsupported';

const renderModeBySystem: Record<ChartSystem, ChartDetailRenderMode> = {
  'zi-wei-dou-shu': 'ziwei-board',
  'ba-zi': 'pillars',
  'mei-hua-yi-shu': 'hexagram',
  'liu-yao': 'liuyao',
  'da-liu-ren': 'daliuren',
  'qi-men-dun-jia': 'qimen',
};

export function getChartDetailRenderMode(chartSystem: ChartSystem): ChartDetailRenderMode {
  return renderModeBySystem[chartSystem];
}

export function supportsPillarDetail(chartSystem: ChartSystem): boolean {
  return getChartDetailRenderMode(chartSystem) === 'pillars';
}
