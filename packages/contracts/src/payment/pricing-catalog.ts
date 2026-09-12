import { z } from 'zod';

export const featurePricingSchema = z.object({
  id: z.string(),
  name: z.string(),
  xuCost: z.number().int().nonnegative(),
  displayCost: z.string(),
  tag: z.string(),
  desc: z.string(),
});

export type FeaturePricingItem = z.infer<typeof featurePricingSchema>;

export const FEATURE_PRICING = {
  CHART_CREATION: 0,
  DEEP_EXPLANATION: 10,
  FACE_PALM_VISION: 10,
  ICHING_DIVINATION: 5,
  TAROT_LENORMAND: 3,
  ANNUAL_REPORT: 15,
  SYNTHESIS_REPORT: 15,
  ROYAL_DOSSIER: 50,
  MBTI_QUIZ: 1,
  CONVERSATION_MESSAGE: 1,
} as const;

export const FEATURE_PRICING_CATALOG: readonly FeaturePricingItem[] = [
  {
    id: 'chart_creation',
    name: 'Lập lá số Tử Vi / Bát Tự',
    xuCost: FEATURE_PRICING.CHART_CREATION,
    displayCost: '0 XU',
    tag: 'Miễn phí 100%',
    desc: 'An sao, lập bàn 12 cung, tứ trụ và đại hạn trọn đời',
  },
  {
    id: 'deep_explanation',
    name: 'Luận giải AI Chuyên sâu',
    xuCost: FEATURE_PRICING.DEEP_EXPLANATION,
    displayCost: `${FEATURE_PRICING.DEEP_EXPLANATION} XU / lượt`,
    tag: 'Xem nhiều nhất',
    desc: 'Phân tích đa chiều mệnh cách, công danh, tài bạch, tình duyên',
  },
  {
    id: 'face_palm_vision',
    name: 'Xem Tướng Mặt / Bàn Tay AI',
    xuCost: FEATURE_PRICING.FACE_PALM_VISION,
    displayCost: `${FEATURE_PRICING.FACE_PALM_VISION} XU / lượt`,
    tag: 'Phân tích ảnh',
    desc: 'AI thị giác phân tích ngũ quan diện tướng và chỉ tay chỉ bản',
  },
  {
    id: 'iching_divination',
    name: 'Gieo Quẻ Kinh Dịch / Lục Hào',
    xuCost: FEATURE_PRICING.ICHING_DIVINATION,
    displayCost: `${FEATURE_PRICING.ICHING_DIVINATION} XU / lượt`,
    tag: 'Dự đoán vận hạn',
    desc: 'Gieo tiền xu, lập quẻ biến giải mã cát hung từng sự vụ',
  },
  {
    id: 'tarot_lenormand',
    name: 'Rút Bài Tarot / Lenormand',
    xuCost: FEATURE_PRICING.TAROT_LENORMAND,
    displayCost: `${FEATURE_PRICING.TAROT_LENORMAND} XU / lượt`,
    tag: 'Lời khuyên ngày',
    desc: 'Trải bài trực giác đón nhận thông điệp chỉ dẫn và hành động',
  },
  {
    id: 'annual_report',
    name: 'Báo Cáo Vận Hạn Năm',
    xuCost: FEATURE_PRICING.ANNUAL_REPORT,
    displayCost: `${FEATURE_PRICING.ANNUAL_REPORT} XU / báo cáo`,
    tag: 'Toàn diện 12 tháng',
    desc: 'Dự báo chi tiết đại vận lưu niên và cơ hội sự nghiệp cả năm',
  },
  {
    id: 'astrological_synthesis',
    name: 'Luận Giải Tổng Hợp Đa Hệ',
    xuCost: FEATURE_PRICING.SYNTHESIS_REPORT,
    displayCost: `${FEATURE_PRICING.SYNTHESIS_REPORT} XU / lượt`,
    tag: 'Đại Viên Mãn',
    desc: 'Hội đồng chiêm tinh phân tích hợp nhất Tử Vi, Bát Tự, Quẻ Dịch',
  },
  {
    id: 'royal_dossier',
    name: 'Hồ Sơ Hoàng Gia 19 Trang PDF',
    xuCost: FEATURE_PRICING.ROYAL_DOSSIER,
    displayCost: `${FEATURE_PRICING.ROYAL_DOSSIER} XU / bản`,
    tag: 'Đẳng Cấp Hoàng Triều',
    desc: 'Bộ đại điển số mệnh trọn đời xuất bản PDF chất lượng in ấn',
  },
] as const;
