import { z } from 'zod';

export const chartSystems = [
  'zi-wei-dou-shu',
  'ba-zi',
  'mei-hua-yi-shu',
  'liu-yao',
  'da-liu-ren',
  'qi-men-dun-jia',
  // 6 hệ mới (US-017 framework, decision 0012)
  'hepan',
  'mangpai',
  'tarot',
  'mbti',
  'face',
  'palm',
] as const;

export const implementedChartSystems = [
  'zi-wei-dou-shu',
  'ba-zi',
  'mei-hua-yi-shu',
  'liu-yao',
  'da-liu-ren',
  'qi-men-dun-jia',
  // US-017d: Mạnh Phái dùng chung flow POST /charts (bazi mở rộng), không endpoint mới.
  // Lối vào ở web vẫn fail-closed theo cờ EXTENDED_SYSTEM_MANGPAI_ENABLED (GET /features).
  'mangpai',
] as const;

export const chartSystemSchema = z.enum(chartSystems);

export type ChartSystem = (typeof chartSystems)[number];
export type ImplementedChartSystem = (typeof implementedChartSystems)[number];
