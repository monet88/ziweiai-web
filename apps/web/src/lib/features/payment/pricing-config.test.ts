import { describe, it, expect } from 'vitest';
import {
  XU_PACKAGES,
  FEATURE_COSTS,
  formatVnd,
  findPackageByXu,
  getDefaultPackage
} from './pricing-config';

describe('pricing-config', () => {
  it('defines 7 canonical royal XU packages in ascending order of price', () => {
    expect(XU_PACKAGES).toHaveLength(7);
    expect(XU_PACKAGES.map((p) => p.xu)).toEqual([10, 20, 50, 100, 120, 600, 1000]);
    expect(XU_PACKAGES.map((p) => p.price)).toEqual([10000, 20000, 50000, 79000, 100000, 500000, 790000]);
  });

  it('marks 50 XU package as popular / Bán Chạy and specifies practical value', () => {
    const popularPkg = XU_PACKAGES.find((p) => p.popular);
    expect(popularPkg).toBeDefined();
    expect(popularPkg?.xu).toBe(50);
    expect(popularPkg?.badge).toBe('Bán Chạy');
    expect(popularPkg?.valueEquivalence).toContain('5 lần luận giải chuyên sâu');
  });

  it('includes Seasonal Bính Ngọ 2026 combo package', () => {
    const seasonalPkg = XU_PACKAGES.find((p) => p.seasonal);
    expect(seasonalPkg).toBeDefined();
    expect(seasonalPkg?.xu).toBe(100);
    expect(seasonalPkg?.price).toBe(79000);
    expect(seasonalPkg?.badge).toBe('Khai Vận 2026');
    expect(seasonalPkg?.bonusXu).toBe(21);
    expect(seasonalPkg?.valueEquivalence).toContain('Báo Cáo Năm 2026');
  });

  it('includes B2B Real Estate & Enterprise package', () => {
    const b2bPkg = XU_PACKAGES.find((p) => p.b2b);
    expect(b2bPkg).toBeDefined();
    expect(b2bPkg?.xu).toBe(1000);
    expect(b2bPkg?.price).toBe(790000);
    expect(b2bPkg?.badge).toBe('B2B Siêu Ưu Đãi');
    expect(b2bPkg?.bonusXu).toBe(210);
    expect(b2bPkg?.valueEquivalence).toContain('20 Hồ Sơ Hoàng Gia PDF 19 Trang');
  });

  it('provides practical value equivalence for all packages', () => {
    for (const pkg of XU_PACKAGES) {
      expect(pkg.valueEquivalence).toBeDefined();
      expect(pkg.valueEquivalence.length).toBeGreaterThan(5);
    }
  });

  it('provides bonus XU on promotional packages', () => {
    const pkg100 = findPackageByXu(100);
    expect(pkg100?.bonusXu).toBe(21);

    const pkg120 = findPackageByXu(120);
    expect(pkg120?.bonusXu).toBe(20);
    expect(pkg120?.badge).toBe('+20% XU');

    const pkg600 = findPackageByXu(600);
    expect(pkg600?.bonusXu).toBe(100);
    expect(pkg600?.badge).toBe('+20% XU');

    const pkg1000 = findPackageByXu(1000);
    expect(pkg1000?.bonusXu).toBe(210);
  });

  it('formats VND currency string correctly', () => {
    expect(formatVnd(20000)).toBe('20.000');
    expect(formatVnd(79000)).toBe('79.000');
    expect(formatVnd(100000)).toBe('100.000');
    expect(formatVnd(500000)).toBe('500.000');
    expect(formatVnd(790000)).toBe('790.000');
  });

  it('findPackageByXu handles number, string and invalid inputs safely', () => {
    expect(findPackageByXu(20)?.label).toBe('Gói Cơ Bản');
    expect(findPackageByXu('50')?.label).toBe('Gói Phổ Biến');
    expect(findPackageByXu(999)).toBeUndefined();
    expect(findPackageByXu('invalid')).toBeUndefined();
    expect(findPackageByXu(null)).toBeUndefined();
    expect(findPackageByXu(undefined)).toBeUndefined();
  });

  it('getDefaultPackage returns the popular package', () => {
    const def = getDefaultPackage();
    expect(def.xu).toBe(50);
  });

  it('includes zero-cost entry for chart creation in FEATURE_COSTS', () => {
    const chart = FEATURE_COSTS.find((f) => f.id === 'chart_creation');
    expect(chart).toBeDefined();
    expect(chart?.xuCost).toBe(0);
    expect(chart?.cost).toBe('0 XU');
  });

  it('includes deep explanation and vision analysis costs', () => {
    const explanation = FEATURE_COSTS.find((f) => f.id === 'deep_explanation');
    expect(explanation?.xuCost).toBe(10);

    const vision = FEATURE_COSTS.find((f) => f.id === 'face_palm_vision');
    expect(vision?.xuCost).toBe(10);
  });
});
