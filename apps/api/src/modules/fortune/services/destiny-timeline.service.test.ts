import { describe, expect, it, vi } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import type { AuthenticatedUser } from '@ziweiai/contracts';
import { DestinyTimelineService } from './destiny-timeline.service';

const user: AuthenticatedUser = { userId: 'user-1', email: 'a@b.com' } as any;

const sampleMonthlyItem = (index: number) => ({
  index: index % 12,
  heavenlyStemKey: 'jiaHeavenly',
  earthlyBranchKey: 'ziEarthly',
  palaceNameKeys: ['soulPalace'],
  mutagenStarKeys: index === 3 ? ['hoaLocStar'] : index === 8 ? ['hoaKyStar'] : [],
});

const mockAnnualFrame = {
  yearly: {
    index: 2,
    heavenlyStemKey: 'bingHeavenly',
    earthlyBranchKey: 'wuEarthly',
    palaceNameKeys: ['careerPalace'],
    mutagenStarKeys: ['hoaLocStar'],
  },
  monthly: Array.from({ length: 12 }, (_, i) => sampleMonthlyItem(i)),
};

const ziweiSnapshot = {
  chartSystem: 'zi-wei-dou-shu',
  palaces: [
    {
      index: 0,
      name: 'Mệnh',
      majorStars: [{ displayName: 'Tử Vi' }, { displayName: 'Thiên Phủ' }],
      minorStars: [{ displayName: 'Tả Phụ' }],
    },
    {
      index: 1,
      name: 'Phụ Mẫu',
      majorStars: [],
      minorStars: [],
    },
  ],
  calculationConfidence: { level: 'medium', reasons: [], visibleMessageKey: 'k', blocksExactReading: false },
  ruleSource: { canonicalLibrary: { name: 'iztro', version: '2.5.8' } },
};

function makeService(snapshot: any) {
  const persistence = {
    findChartSnapshotById: vi.fn().mockResolvedValue(snapshot ? { snapshot } : null),
  };
  const quotas = { assertCanExecute: vi.fn().mockResolvedValue(undefined) };
  const engine = { computeAnnualFrame: vi.fn().mockReturnValue(mockAnnualFrame) };
  const service = new DestinyTimelineService(persistence as any, quotas as any, engine as any);
  return { service, persistence, quotas, engine };
}

describe('DestinyTimelineService', () => {
  it('tính toán dòng thời gian 12 tháng năm 2026 thành công', async () => {
    const { service, engine } = makeService(ziweiSnapshot);
    const chartId = '11111111-1111-4111-8111-111111111111';
    const result = await service.getDestinyTimeline(user, '127.0.0.1', chartId, 2026);

    expect(result.chartId).toBe(chartId);
    expect(result.year).toBe(2026);
    expect(result.months).toHaveLength(12);
    expect(result.averageScore).toBeGreaterThanOrEqual(0);
    expect(result.averageScore).toBeLessThanOrEqual(100);
    expect(result.luckiestMonth).toBeGreaterThanOrEqual(1);
    expect(result.luckiestMonth).toBeLessThanOrEqual(12);
    expect(result.cautiousMonth).toBeGreaterThanOrEqual(1);
    expect(result.cautiousMonth).toBeLessThanOrEqual(12);
    expect(result.annualOverview).toContain('Năm');
    expect(engine.computeAnnualFrame).toHaveBeenCalledWith(ziweiSnapshot, 2026);
  });

  it('404 khi không tìm thấy lá số', async () => {
    const { service } = makeService(null);
    await expect(
      service.getDestinyTimeline(user, '127.0.0.1', '11111111-1111-4111-8111-111111111111', 2026),
    ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
  });

  it('400 khi lá số không phải Tử Vi', async () => {
    const { service } = makeService({ ...ziweiSnapshot, chartSystem: 'ba-zi' });
    await expect(
      service.getDestinyTimeline(user, '127.0.0.1', '11111111-1111-4111-8111-111111111111', 2026),
    ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
  });
});
