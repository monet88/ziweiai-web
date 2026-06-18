import { describe, expect, it } from 'vitest';
import { horoscopeFrameSchema } from './horoscope-frame';
import { horoscopeRequestSchema } from './horoscope-request';
import { horoscopeResponseSchema } from './horoscope-response';

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
