import { z } from 'zod';

export const chartSystems = [
  'zi-wei-dou-shu',
  'ba-zi',
  'mei-hua-yi-shu',
  'liu-yao',
  'da-liu-ren',
  'qi-men-dun-jia',
] as const;

export const implementedChartSystems = ['zi-wei-dou-shu', 'ba-zi', 'mei-hua-yi-shu', 'liu-yao', 'da-liu-ren', 'qi-men-dun-jia'] as const;

export const chartSystemSchema = z.enum(chartSystems);

export type ChartSystem = (typeof chartSystems)[number];
export type ImplementedChartSystem = (typeof implementedChartSystems)[number];
