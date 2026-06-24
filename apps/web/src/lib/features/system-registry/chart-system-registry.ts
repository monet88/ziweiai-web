import type { ChartSystem, ImplementedChartSystem } from '@ziweiai/contracts';
import { implementedChartSystems } from '@ziweiai/contracts';

export type ChartDetailRenderMode = 'ziwei-board' | 'pillars' | 'mangpai' | 'hexagram' | 'liuyao' | 'daliuren' | 'qimen' | 'unsupported';

const renderModeBySystem: Record<ChartSystem, ChartDetailRenderMode> = {
  'zi-wei-dou-shu': 'ziwei-board',
  'ba-zi': 'pillars',
  'mei-hua-yi-shu': 'hexagram',
  'liu-yao': 'liuyao',
  'da-liu-ren': 'daliuren',
  'qi-men-dun-jia': 'qimen',
  hepan: 'unsupported',
  // US-017d: Mạnh Phái luận trên Bát Tự, có khối luận giải riêng → chế độ render 'mangpai'.
  mangpai: 'mangpai',
  tarot: 'unsupported',
  mbti: 'unsupported',
  face: 'unsupported',
  palm: 'unsupported',
};

export function getChartDetailRenderMode(chartSystem: ChartSystem): ChartDetailRenderMode {
  return renderModeBySystem[chartSystem];
}

export function supportsPillarDetail(chartSystem: ChartSystem): boolean {
  return getChartDetailRenderMode(chartSystem) === 'pillars';
}

// US-017d: Mạnh Phái dùng chung POST /charts (đã có adapter → nằm trong implementedChartSystems)
// nhưng có route riêng `/mangpai` + cờ tính năng EXTENDED_SYSTEM_MANGPAI_ENABLED. Trên picker
// dashboard nó bị ẩn mặc định (fail-closed: tránh người dùng chọn rồi POST /charts trả 403 khi
// cờ tắt); lối vào /mangpai trên dashboard gate bằng GET /features. Picker chỉ thêm lại hệ này
// khi value hiện tại đã là nó (vào trực tiếp từ route /mangpai), để SelectField hiển thị đúng.
export const dashboardPickerHiddenSystems = ['mangpai'] as const satisfies readonly ImplementedChartSystem[];

export function getDashboardPickerSystems(currentValue: ImplementedChartSystem): ImplementedChartSystem[] {
  return implementedChartSystems.filter(
    (system) => !dashboardPickerHiddenSystems.includes(system as (typeof dashboardPickerHiddenSystems)[number]) || system === currentValue,
  );
}
