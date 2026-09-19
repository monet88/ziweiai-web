import { describe, it, expect } from 'vitest';
import { destinyTimelineResponseSchema } from '@ziweiai/contracts';

describe('DestinyTimeline Contract & Logic Validation', () => {
  const samplePayload = {
    chartId: '123e4567-e89b-12d3-a456-426614174000',
    year: 2026,
    yearGanZhi: 'Bính Ngọ 2026',
    annualOverview: 'Năm Bính Ngọ 2026: Khí vận tổng thể đạt mức 72/100 điểm.',
    averageScore: 72,
    luckiestMonth: 5,
    cautiousMonth: 9,
    months: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      solarMonth: `${String(i + 1).padStart(2, '0')}/2026`,
      lunarMonthName: `Tháng ${i + 1}`,
      ganZhi: 'Giáp Dần',
      palaceName: 'Mệnh',
      auspiciousScore: 70 + (i % 5) * 5,
      level: 'cat' as const,
      mutagens: ['Hóa Lộc'],
      highlights: ['Tử Vi tọa thủ'],
      advice: 'Thuận lợi khởi sự kinh doanh.',
    })),
  };

  it('parse thành công payload DestinyTimelineResponse hợp lệ', () => {
    const parsed = destinyTimelineResponseSchema.parse(samplePayload);
    expect(parsed.year).toBe(2026);
    expect(parsed.months).toHaveLength(12);
    expect(parsed.luckiestMonth).toBe(5);
    expect(parsed.cautiousMonth).toBe(9);
  });

  it('ném lỗi nếu mảng months không đủ đúng 12 tháng', () => {
    const invalidPayload = {
      ...samplePayload,
      months: samplePayload.months.slice(0, 10),
    };
    expect(() => destinyTimelineResponseSchema.parse(invalidPayload)).toThrow();
  });
});
