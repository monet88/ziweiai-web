export interface XuPackage {
  readonly xu: number;
  readonly price: number;
  readonly label: string;
  readonly badge: string | null;
  readonly desc: string;
  readonly valueEquivalence: string;
  readonly popular?: boolean;
  readonly bonusXu?: number;
  readonly unitPrice: string;
}

export interface FeatureCostItem {
  readonly id: string;
  readonly name: string;
  readonly cost: string;
  readonly xuCost: number;
  readonly tag: string;
  readonly desc: string;
}

export const XU_PACKAGES: readonly XuPackage[] = [
  {
    xu: 10,
    price: 10000,
    label: 'Gói Trải Nghiệm',
    badge: 'Khởi Đầu',
    desc: 'Dùng cho 1 lượt luận giải chi tiết hoặc 10 câu hỏi AI',
    valueEquivalence: '1 lần luận giải chuyên sâu hoặc 10 câu hỏi AI',
    unitPrice: '1.000đ / XU'
  },
  {
    xu: 20,
    price: 20000,
    label: 'Gói Cơ Bản',
    badge: null,
    desc: 'Dùng cho 2 lượt luận giải chi tiết hoặc 4 lượt gieo quẻ',
    valueEquivalence: '2 lần luận giải chuyên sâu + 4 lượt gieo quẻ',
    unitPrice: '1.000đ / XU'
  },
  {
    xu: 50,
    price: 50000,
    label: 'Gói Phổ Biến',
    badge: 'Bán Chạy',
    desc: '5 lần luận giải chuyên sâu + 10 câu hỏi AI hoặc 1 Hồ Sơ PDF',
    valueEquivalence: '5 lần luận giải chuyên sâu + 10 câu hỏi AI',
    popular: true,
    unitPrice: '1.000đ / XU'
  },
  {
    xu: 120,
    price: 100000,
    label: 'Gói Nâng Cao',
    badge: '+20% XU',
    desc: 'Tặng thêm 20 XU thưởng (tổng 120 XU)',
    valueEquivalence: '12 lần luận giải chuyên sâu + 20 câu hỏi AI',
    bonusXu: 20,
    unitPrice: '833đ / XU'
  },
  {
    xu: 600,
    price: 500000,
    label: 'Gói VIP Thưởng Lớn',
    badge: '+20% XU',
    desc: 'Tặng thêm 100 XU thưởng (tổng 600 XU)',
    valueEquivalence: '60 lần luận giải chuyên sâu + 12 Hồ Sơ Hoàng Gia PDF',
    bonusXu: 100,
    unitPrice: '833đ / XU'
  }
] as const;

import { FEATURE_PRICING_CATALOG } from '@ziweiai/contracts';

export const FEATURE_COSTS: readonly FeatureCostItem[] = FEATURE_PRICING_CATALOG.map((item) => ({
  id: item.id,
  name: item.name,
  cost: item.displayCost,
  xuCost: item.xuCost,
  tag: item.tag,
  desc: item.desc,
}));

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

export function findPackageByXu(xu: number | string | null | undefined): XuPackage | undefined {
  if (xu === null || xu === undefined) return undefined;
  const num = typeof xu === 'string' ? parseInt(xu, 10) : xu;
  if (Number.isNaN(num)) return undefined;
  return XU_PACKAGES.find((pkg) => pkg.xu === num);
}

export function getDefaultPackage(): XuPackage {
  return XU_PACKAGES.find((pkg) => pkg.popular) ?? XU_PACKAGES[1] ?? XU_PACKAGES[0];
}
