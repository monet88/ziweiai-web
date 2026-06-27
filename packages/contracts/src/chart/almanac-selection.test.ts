import { describe, expect, it } from 'vitest';
import {
  almanacDayCandidateSchema,
  almanacSelectionSchema,
  almanacTopicSchema,
  ALMANAC_TOPIC_LABELS,
} from './almanac-selection';

const validDay = {
  date: '2026-07-01',
  weekday: 'Thứ Tư',
  lunarDate: 'Mười sáu tháng Năm',
  ganzhi: { year: 'Bính Ngọ', month: 'Giáp Ngọ', day: 'Mậu Tý' },
  zodiac: 'Chuột',
  dayOfficer: 'Kiến',
  twelveStar: 'Thanh Long',
  twentyEightStar: 'Đê',
  nineStar: 'Nhất Bạch Thủy',
  gods: ['Thiên ân', 'Thiên đức'],
  recommends: ['Giá thú', 'Xuất hành'],
  avoids: ['Động thổ'],
  pengZu: 'Mậu không nhận ruộng, ruộng chủ không lành.',
  clash: 'Xung Ngọ, sát hướng Nam.',
  score: 78,
  highlights: ['Hợp chủ đề cưới hỏi.'],
  cautions: [],
};

describe('almanacSelectionSchema (US-040)', () => {
  it('parse tất cả 8 chủ đề', () => {
    for (const topic of ['marriage', 'move', 'opening', 'contract', 'travel', 'medical', 'study', 'custom']) {
      expect(almanacTopicSchema.safeParse(topic).success).toBe(true);
    }
  });

  it('từ chối chủ đề lạ', () => {
    expect(almanacTopicSchema.safeParse('birthday').success).toBe(false);
  });

  it('có nhãn tiếng Việt cho mọi chủ đề', () => {
    for (const topic of almanacTopicSchema.options) {
      expect(ALMANAC_TOPIC_LABELS[topic]?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('parse một ngày ứng viên hợp lệ', () => {
    expect(almanacDayCandidateSchema.safeParse(validDay).success).toBe(true);
  });

  it('từ chối điểm ngoài 0..100', () => {
    expect(almanacDayCandidateSchema.safeParse({ ...validDay, score: -1 }).success).toBe(false);
    expect(almanacDayCandidateSchema.safeParse({ ...validDay, score: 101 }).success).toBe(false);
  });

  it('từ chối ngày sai định dạng', () => {
    expect(almanacDayCandidateSchema.safeParse({ ...validDay, date: '01/07/2026' }).success).toBe(false);
  });

  it('parse payload chọn ngày đầy đủ', () => {
    const result = almanacSelectionSchema.safeParse({
      topic: 'marriage',
      topicLabel: ALMANAC_TOPIC_LABELS.marriage,
      startDate: '2026-07-01',
      endDate: '2026-07-07',
      days: [validDay],
      narrative: 'Luận giải dẫn dắt chọn ngày theo chủ đề cưới hỏi.',
    });
    expect(result.success).toBe(true);
  });

  it('từ chối khi danh sách ngày rỗng', () => {
    expect(
      almanacSelectionSchema.safeParse({
        topic: 'marriage',
        topicLabel: ALMANAC_TOPIC_LABELS.marriage,
        startDate: '2026-07-01',
        endDate: '2026-07-07',
        days: [],
        narrative: 'x',
      }).success,
    ).toBe(false);
  });

  it('từ chối khi thiếu narrative', () => {
    expect(
      almanacSelectionSchema.safeParse({
        topic: 'marriage',
        topicLabel: ALMANAC_TOPIC_LABELS.marriage,
        startDate: '2026-07-01',
        endDate: '2026-07-07',
        days: [validDay],
      }).success,
    ).toBe(false);
  });
});
