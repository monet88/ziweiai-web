import { z } from 'zod';

// US-040 (backlog #48): hệ Hoàng lịch (chọn ngày tốt) — endpoint riêng POST /almanac/select +
// schema riêng + cờ EXTENDED_SYSTEM_ALMANAC_ENABLED. KHÔNG nhồi vào chartSystems enum (giữ invariant
// nhãn 12 hệ + no-han test + render registry). Khác "rút bài": input là chủ đề + khoảng ngày; service
// dùng tyme4ts tính lịch (nghi/kỵ/thần sát/trực/sao...) rồi map qua bảng tra Hán→Việt (overlay đã dịch
// sẵn qua pipeline B6-0), chấm điểm theo chủ đề, LLM luận giải. v1 KHÔNG phân tích xung khắc bát tự của
// người tham gia (để v2) — chỉ chọn ngày theo chủ đề + nghi/kỵ.

export const almanacTopicSchema = z.enum([
  'marriage',
  'move',
  'opening',
  'contract',
  'travel',
  'medical',
  'study',
  'custom',
]);

// Nhãn chủ đề tiếng Việt (0 chữ Hán) — dùng cho client + prompt. Giữ trong contract để api/web đồng bộ.
export const ALMANAC_TOPIC_LABELS: Record<AlmanacTopic, string> = {
  marriage: 'Cưới hỏi',
  move: 'Chuyển nhà / nhập trạch',
  opening: 'Khai trương',
  contract: 'Ký kết hợp tác',
  travel: 'Xuất hành',
  medical: 'Khám chữa bệnh',
  study: 'Học hành / thi cử',
  custom: 'Việc tùy chọn',
};

export const almanacDayCandidateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // ngày dương YYYY-MM-DD
  weekday: z.string().min(1), // thứ trong tuần (Việt)
  lunarDate: z.string().min(1), // ngày âm (Việt)
  ganzhi: z.object({
    year: z.string().min(1),
    month: z.string().min(1),
    day: z.string().min(1),
  }),
  zodiac: z.string().min(1), // con giáp của ngày (Việt)
  dayOfficer: z.string().min(1), // 12 trực (Việt)
  twelveStar: z.string().min(1), // 12 sao kiến trừ (Việt)
  twentyEightStar: z.string().min(1), // 28 sao (Việt)
  nineStar: z.string().min(1), // cửu tinh (Việt)
  gods: z.array(z.string().min(1)), // cát/hung thần (Việt)
  recommends: z.array(z.string().min(1)), // việc nên (Việt)
  avoids: z.array(z.string().min(1)), // việc kỵ (Việt)
  pengZu: z.string().min(1), // Bành Tổ bách kỵ (Việt)
  clash: z.string().min(1), // xung/sát hướng (Việt)
  score: z.number().int().min(0).max(100), // điểm phù hợp chủ đề
  highlights: z.array(z.string().min(1)), // điểm cộng (Việt)
  cautions: z.array(z.string().min(1)), // điểm cần lưu ý (Việt)
});

export const almanacSelectionSchema = z.object({
  topic: almanacTopicSchema,
  topicLabel: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.array(almanacDayCandidateSchema).min(1), // đã sort theo điểm giảm dần
  narrative: z.string().min(1), // luận giải (Việt) do LLM sinh, dẫn dắt chọn ngày
});

export type AlmanacTopic = z.infer<typeof almanacTopicSchema>;
export type AlmanacDayCandidate = z.infer<typeof almanacDayCandidateSchema>;
export type AlmanacSelection = z.infer<typeof almanacSelectionSchema>;
