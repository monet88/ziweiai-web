/**
 * Bộ xác định danh hiệu VIP Hội Viên Hoàng Thân (ADR-0010 & Sprint 96/97).
 *
 * Điều kiện kích hoạt danh hiệu VIP:
 * 1. Gói Doanh Nghiệp B2B: 790.000đ -> cộng 1.000 XU
 * 2. Gói Combo Mùa Vận Hạn "Bính Ngọ 2026": 79.000đ -> cộng 100 XU
 * 3. Gói VIP Thưởng Lớn: 500.000đ -> cộng 600 XU
 */

export interface TopupVipEvaluation {
  isVip: boolean;
  vipTitle?: string;
  vipBadge?: string;
  vipDescription?: string;
}

export function resolveVipPromotion(addedXu: number): TopupVipEvaluation {
  if (addedXu >= 1000) {
    return {
      isVip: true,
      vipTitle: 'Hội Viên Hoàng Thân B2B • Thượng Khách VIP',
      vipBadge: 'ĐẶC QUYỀN B2B & DOANH NGHIỆP',
      vipDescription: 'Kích hoạt trọn đời đặc quyền Doanh Nghiệp: Tự do xuất 20 cuốn Hồ Sơ Hoàng Gia PDF 19 Trang và ưu tiên kết nối cùng chuyên gia thuật số.',
    };
  }

  if (addedXu >= 600) {
    return {
      isVip: true,
      vipTitle: 'Hội Viên Hoàng Thân • Đại Thần VIP',
      vipBadge: 'HỘI VIÊN HOÀNG THÂN VIP',
      vipDescription: 'Kích hoạt trọn đời danh hiệu Hội Viên Hoàng Thân: Tận hưởng đặc quyền Tam Hợp Luận Giải VIP và bảo lưu số dư vĩnh viễn.',
    };
  }

  if (addedXu === 100) {
    return {
      isVip: true,
      vipTitle: 'Hội Viên Hoàng Thân • Combo Bính Ngọ 2026',
      vipBadge: 'HỘI VIÊN HOÀNG THÂN VIP',
      vipDescription: 'Kích hoạt danh hiệu Hội Viên Hoàng Thân mùa lễ hội: Mở khóa luận giải chuyên sâu và bảo lưu XU trọn vẹn.',
    };
  }

  return {
    isVip: false,
  };
}
