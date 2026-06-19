import { describe, expect, it } from 'vitest';
import { horoscopeFrameSchema } from './horoscope-frame';
import {
  annualReportRequestSchema,
  dailyFortuneRequestSchema,
  horoscopeRequestSchema,
  monthlyFortuneRequestSchema,
} from './horoscope-request';
import {
  annualReportResponseSchema,
  dailyFortuneResponseSchema,
  horoscopeResponseSchema,
  monthlyFortuneResponseSchema,
} from './horoscope-response';

const item = (index: number) => ({
  index,
  heavenlyStemKey: 'giap',
  earthlyBranchKey: 'ty',
  palaceNameKeys: ['menh', 'huynhDe', 'phuThe'],
  mutagenStarKeys: ['tuVi_lu', 'thienCo_quyen'],
});

const age = { index: 3, nominalAge: 37 };

describe('horoscopeFrameSchema', () => {
  it('parse khung legacy chỉ có decadal/age/yearly (tương thích ngược)', () => {
    const parsed = horoscopeFrameSchema.parse({
      decadal: item(2),
      age,
      yearly: item(5),
    });
    expect(parsed.monthly).toBeUndefined();
    expect(parsed.daily).toBeUndefined();
  });

  it('parse khung đầy đủ 4 tầng có monthly + daily', () => {
    const parsed = horoscopeFrameSchema.parse({
      decadal: item(2),
      age,
      yearly: item(5),
      monthly: item(7),
      daily: item(9),
    });
    expect(parsed.monthly?.index).toBe(7);
    expect(parsed.daily?.index).toBe(9);
  });

  it('fail khi thiếu decadal (bắt buộc)', () => {
    expect(() =>
      horoscopeFrameSchema.parse({ age, yearly: item(5) }),
    ).toThrow();
  });
});

describe('horoscopeRequestSchema', () => {
  it('chấp nhận subset scope đơn lẻ', () => {
    const parsed = horoscopeRequestSchema.parse({ asOf: '2026-06-17', scopes: ['yearly'] });
    expect(parsed.scopes).toEqual(['yearly']);
  });

  it('fail khi scopes rỗng', () => {
    expect(() => horoscopeRequestSchema.parse({ asOf: '2026-06-17', scopes: [] })).toThrow();
  });

  it('fail khi asOf sai định dạng', () => {
    expect(() => horoscopeRequestSchema.parse({ asOf: '17/06/2026', scopes: ['daily'] })).toThrow();
  });
});

describe('horoscopeResponseSchema', () => {
  it('parse envelope hợp lệ', () => {
    const parsed = horoscopeResponseSchema.parse({
      chartId: '11111111-1111-4111-8111-111111111111',
      asOf: '2026-06-17',
      frame: { decadal: item(2), age, yearly: item(5) },
    });
    expect(parsed.chartId).toMatch(/^[0-9a-f-]+$/);
  });

  it('fail khi chartId không phải uuid', () => {
    expect(() =>
      horoscopeResponseSchema.parse({
        chartId: 'not-a-uuid',
        asOf: '2026-06-17',
        frame: { decadal: item(2), age, yearly: item(5) },
      }),
    ).toThrow();
  });
});

describe('dailyFortuneRequestSchema (US-016)', () => {
  it('chấp nhận asOf YYYY-MM-DD', () => {
    expect(dailyFortuneRequestSchema.parse({ asOf: '2026-06-17' }).asOf).toBe('2026-06-17');
  });

  it('fail khi asOf dạng YYYY-MM (thiếu ngày)', () => {
    expect(() => dailyFortuneRequestSchema.parse({ asOf: '2026-06' })).toThrow();
  });
});

describe('monthlyFortuneRequestSchema (US-016)', () => {
  it('chấp nhận asOf YYYY-MM', () => {
    expect(monthlyFortuneRequestSchema.parse({ asOf: '2026-06' }).asOf).toBe('2026-06');
  });

  it('fail khi asOf dạng YYYY-MM-DD (thừa ngày)', () => {
    expect(() => monthlyFortuneRequestSchema.parse({ asOf: '2026-06-17' })).toThrow();
  });
});

describe('annualReportRequestSchema (US-016)', () => {
  it('chấp nhận year trong khoảng 1900..2100', () => {
    expect(annualReportRequestSchema.parse({ year: 2026 }).year).toBe(2026);
  });

  it('fail khi year ngoài khoảng', () => {
    expect(() => annualReportRequestSchema.parse({ year: 1800 })).toThrow();
    expect(() => annualReportRequestSchema.parse({ year: 2200 })).toThrow();
  });
});

describe('dailyFortuneResponseSchema (US-016)', () => {
  it('parse OK với frame + summary tiếng Việt', () => {
    const parsed = dailyFortuneResponseSchema.parse({
      chartId: '11111111-1111-4111-8111-111111111111',
      asOf: '2026-06-17',
      frame: { decadal: item(2), age, yearly: item(5), daily: item(9) },
      summary: 'Hôm nay cung lưu nhật rơi vào cung Mệnh, vận khí ổn định.',
    });
    expect(parsed.summary.length).toBeGreaterThan(0);
    expect(parsed.frame.daily?.index).toBe(9);
  });

  it('fail khi thiếu summary', () => {
    expect(() =>
      dailyFortuneResponseSchema.parse({
        chartId: '11111111-1111-4111-8111-111111111111',
        asOf: '2026-06-17',
        frame: { decadal: item(2), age, yearly: item(5) },
      }),
    ).toThrow();
  });

  it('fail khi summary rỗng (min 1)', () => {
    expect(() =>
      dailyFortuneResponseSchema.parse({
        chartId: '11111111-1111-4111-8111-111111111111',
        asOf: '2026-06-17',
        frame: { decadal: item(2), age, yearly: item(5) },
        summary: '',
      }),
    ).toThrow();
  });
});

describe('monthlyFortuneResponseSchema (US-016)', () => {
  it('parse OK với asOf YYYY-MM + summary', () => {
    const parsed = monthlyFortuneResponseSchema.parse({
      chartId: '11111111-1111-4111-8111-111111111111',
      asOf: '2026-06',
      frame: { decadal: item(2), age, yearly: item(5), monthly: item(7) },
      summary: 'Tháng này lưu nguyệt nhấn mạnh cung Tài Bạch.',
    });
    expect(parsed.asOf).toBe('2026-06');
    expect(parsed.frame.monthly?.index).toBe(7);
  });
});

describe('annualReportResponseSchema (US-016)', () => {
  const monthly12 = Array.from({ length: 12 }, (_, i) => item(i % 12));

  it('parse OK với frame yearly + đúng 12 lưu nguyệt + markdown', () => {
    const parsed = annualReportResponseSchema.parse({
      chartId: '11111111-1111-4111-8111-111111111111',
      year: 2026,
      frame: { yearly: item(5), monthly: monthly12 },
      markdown: '# Báo cáo năm 2026\n\nNăm này...',
    });
    expect(parsed.frame.monthly).toHaveLength(12);
    expect(parsed.markdown.length).toBeGreaterThan(0);
  });

  it('fail khi monthly không đủ 12 phần tử', () => {
    expect(() =>
      annualReportResponseSchema.parse({
        chartId: '11111111-1111-4111-8111-111111111111',
        year: 2026,
        frame: { yearly: item(5), monthly: monthly12.slice(0, 11) },
        markdown: '# Báo cáo năm',
      }),
    ).toThrow();
  });

  it('fail khi thiếu markdown', () => {
    expect(() =>
      annualReportResponseSchema.parse({
        chartId: '11111111-1111-4111-8111-111111111111',
        year: 2026,
        frame: { yearly: item(5), monthly: monthly12 },
      }),
    ).toThrow();
  });
});
