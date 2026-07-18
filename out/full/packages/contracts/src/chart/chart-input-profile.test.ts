import { describe, expect, it } from 'vitest';
import { chartSystems } from './chart-system';
import {
  chartInputProfiles,
  chartSystemRequiresGender,
  getChartInputKind,
  getChartInputProfile,
} from './chart-input-profile';

describe('chartInputProfiles', () => {
  it('khai báo profile cho mọi hệ trong chartSystems', () => {
    for (const system of chartSystems) {
      expect(chartInputProfiles[system]).toBeDefined();
    }
  });

  it('chỉ Tử Vi cần giới tính để tính đúng', () => {
    expect(chartSystemRequiresGender('zi-wei-dou-shu')).toBe(true);
    expect(chartSystemRequiresGender('ba-zi')).toBe(false);
    expect(chartSystemRequiresGender('mei-hua-yi-shu')).toBe(false);
    expect(chartSystemRequiresGender('liu-yao')).toBe(false);
    expect(chartSystemRequiresGender('da-liu-ren')).toBe(false);
    expect(chartSystemRequiresGender('qi-men-dun-jia')).toBe(false);
  });

  it('phân loại đúng hệ lập theo thời điểm sinh và hệ bói theo thời khắc', () => {
    expect(getChartInputKind('zi-wei-dou-shu')).toBe('natal');
    expect(getChartInputKind('ba-zi')).toBe('natal');
    expect(getChartInputKind('mei-hua-yi-shu')).toBe('divination');
    expect(getChartInputKind('liu-yao')).toBe('divination');
    expect(getChartInputKind('da-liu-ren')).toBe('divination');
    expect(getChartInputKind('qi-men-dun-jia')).toBe('divination');
  });

  it('getChartInputProfile trả đúng cặp inputKind + requiresGender', () => {
    expect(getChartInputProfile('zi-wei-dou-shu')).toEqual({ inputKind: 'natal', requiresGender: true });
    expect(getChartInputProfile('qi-men-dun-jia')).toEqual({ inputKind: 'divination', requiresGender: false });
  });
});
