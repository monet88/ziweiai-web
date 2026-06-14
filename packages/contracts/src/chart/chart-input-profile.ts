import type { ChartSystem } from './chart-system';

// Phân loại ngữ nghĩa đầu vào theo hệ thuật số:
// - 'natal': lá số lập theo thời điểm SINH của một người (Tử Vi, Bát Tự).
// - 'divination': quẻ/cục lập theo thời KHẮC gieo quẻ, không gắn với người sinh
//   (Mai Hoa, Lục Hào, Đại Lục Nhâm, Kỳ Môn).
export type ChartInputKind = 'natal' | 'divination';

export interface ChartInputProfile {
  // Ngữ nghĩa đầu vào dùng để chọn nhãn form và quyết định có hỏi giới tính không.
  inputKind: ChartInputKind;
  // Giới tính có ảnh hưởng tới phép tính của engine không. Chỉ Tử Vi dùng giới
  // tính (định chiều thuận/nghịch của đại vận); các hệ còn lại bỏ qua. Cờ này
  // điều khiển việc normalize có coi "giới tính chưa rõ" là lỗi chặn hay không.
  requiresGender: boolean;
}

export const chartInputProfiles: Record<ChartSystem, ChartInputProfile> = {
  'zi-wei-dou-shu': { inputKind: 'natal', requiresGender: true },
  'ba-zi': { inputKind: 'natal', requiresGender: false },
  'mei-hua-yi-shu': { inputKind: 'divination', requiresGender: false },
  'liu-yao': { inputKind: 'divination', requiresGender: false },
  'da-liu-ren': { inputKind: 'divination', requiresGender: false },
  'qi-men-dun-jia': { inputKind: 'divination', requiresGender: false },
};

export function getChartInputProfile(system: ChartSystem): ChartInputProfile {
  return chartInputProfiles[system];
}

// Tiện ích cho engine: hệ này có cần giới tính để tính đúng không.
export function chartSystemRequiresGender(system: ChartSystem): boolean {
  return chartInputProfiles[system].requiresGender;
}

// Tiện ích cho app form: hệ này lập theo thời điểm sinh hay theo thời khắc gieo quẻ.
export function getChartInputKind(system: ChartSystem): ChartInputKind {
  return chartInputProfiles[system].inputKind;
}
