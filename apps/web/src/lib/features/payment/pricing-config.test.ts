import { describe, it, expect } from 'vitest';
import {
  XU_PACKAGES,
  FEATURE_COSTS,
  formatVnd,
  findPackageByXu,
  getDefaultPackage
} from './pricing-config';

describe('pricing-config', () => {
  it('defines 5 canonical royal XU packages in ascending order', () => {
    expect(XU_PACKAGES).toHaveLength(5);
    expect(XU_PACKAGES.map((p) => p.xu)).toEqual([10, 20, 50, 120, 600]);
    expect(XU_PACKAGES.map((p) => p.price)).toEqual([10000, 20000, 50000, 100000, 500000]);
  });

  it('marks 50 XU package as popular / Bán Chạy', () => {
    const popularPkg = XU_PACKAGES.find((p) => p.popular);
    expect(popularPkg).toBeDefined();
    expect(popularPkg?.xu).toBe(50);
    expect(popularPkg?.badge).toBe('Bán Chạy');
  });

  it('provides +20% bonus XU on higher packages', () => {
    const pkg120 = findPackageByXu(120);
    expect(pkg120?.bonusXu).toBe(20);
    expect(pkg120?.badge).toBe('+20% XU');

    const pkg600 = findPackageByXu(600);
    expect(pkg600?.bonusXu).toBe(100);
    expect(pkg600?.badge).toBe('+20% XU');
  });

  it('formats VND currency string correctly', () => {
    expect(formatVnd(20000)).toBe('20.000');
    expect(formatVnd(100000)).toBe('100.000');
    expect(formatVnd(500000)).toBe('500.000');
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
    expect(explanation?.xuCost).toBe(5);

    const vision = FEATURE_COSTS.find((f) => f.id === 'face_palm_vision');
    expect(vision?.xuCost).toBe(10);
  });
});
