export interface XuPackage {
  readonly xu: number;
  readonly price: number;
  readonly label: string;
  readonly badge: string | null;
  readonly desc: string;
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
    desc: 'Dùng cho 2 lượt luận giải AI hoặc 3 lượt gieo quẻ',
    unitPrice: '1.000đ / XU'
  },
  {
    xu: 20,
    price: 20000,
    label: 'Gói Cơ Bản',
    badge: null,
    desc: 'Dùng cho 4 lượt luận giải AI hoặc gieo quẻ',
    unitPrice: '1.000đ / XU'
  },
  {
    xu: 50,
    price: 50000,
    label: 'Gói Phổ Biến',
    badge: 'Bán Chạy',
    desc: 'Dùng cho 10 lượt luận giải AI chuyên sâu',
    popular: true,
    unitPrice: '1.000đ / XU'
  },
  {
    xu: 120,
    price: 100000,
    label: 'Gói Nâng Cao',
    badge: '+20% XU',
    desc: 'Tặng thêm 20 XU thưởng',
    bonusXu: 20,
    unitPrice: '833đ / XU'
  },
  {
    xu: 600,
    price: 500000,
    label: 'Gói VIP Thưởng Lớn',
    badge: '+20% XU',
    desc: 'Tặng thêm 100 XU thưởng',
    bonusXu: 100,
    unitPrice: '833đ / XU'
  }
] as const;

export const FEATURE_COSTS: readonly FeatureCostItem[] = [
  {
    id: 'chart_creation',
    name: 'Lập lá số Tử Vi / Bát Tự',
    cost: '0 XU',
    xuCost: 0,
    tag: 'Miễn phí 100%',
    desc: 'An sao, lập bàn 12 cung, tứ trụ và đại hạn trọn đời'
  },
  {
    id: 'deep_explanation',
    name: 'Luận giải AI Chuyên sâu',
    cost: '5 XU / lượt',
    xuCost: 5,
    tag: 'Xem nhiều nhất',
    desc: 'Phân tích đa chiều mệnh cách, công danh, tài bạch, tình duyên'
  },
  {
    id: 'face_palm_vision',
    name: 'Xem Tướng Mặt / Bàn Tay AI',
    cost: '10 XU / lượt',
    xuCost: 10,
    tag: 'Phân tích ảnh',
    desc: 'AI thị giác phân tích ngũ quan diện tướng và chỉ tay chỉ bản'
  },
  {
    id: 'iching_divination',
    name: 'Gieo Quẻ Kinh Dịch / Lục Hào',
    cost: '3 XU / lượt',
    xuCost: 3,
    tag: 'Dự đoán vận hạn',
    desc: 'Gieo tiền xu, lập quẻ biến giải mã cát hung từng sự vụ'
  },
  {
    id: 'tarot_lenormand',
    name: 'Rút Bài Tarot / Lenormand',
    cost: '3 XU / lượt',
    xuCost: 3,
    tag: 'Lời khuyên ngày',
    desc: 'Trải bài trực giác đón nhận thông điệp chỉ dẫn và hành động'
  },
  {
    id: 'annual_report',
    name: 'Báo Cáo Vận Hạn Năm',
    cost: '15 XU / báo cáo',
    xuCost: 15,
    tag: 'Toàn diện 12 tháng',
    desc: 'Dự báo chi tiết đại vận lưu niên và cơ hội sự nghiệp cả năm'
  }
] as const;

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
