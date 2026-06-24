import { describe, expect, it, vi } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import type { AuthenticatedUser } from '@ziweiai/contracts';
import { FortuneService } from './fortune.service';

/* eslint-disable @typescript-eslint/no-explicit-any */

const user: AuthenticatedUser = { userId: 'user-1', email: 'a@b.com' } as any;

const frame = {
  decadal: { index: 1, heavenlyStemKey: 'jiaHeavenly', earthlyBranchKey: 'ziEarthly', palaceNameKeys: ['soulPalace'], mutagenStarKeys: [] },
  age: { index: 1, nominalAge: 30 },
  yearly: { index: 2, heavenlyStemKey: 'jiaHeavenly', earthlyBranchKey: 'ziEarthly', palaceNameKeys: ['careerPalace'], mutagenStarKeys: [] },
  daily: { index: 3, heavenlyStemKey: 'jiaHeavenly', earthlyBranchKey: 'ziEarthly', palaceNameKeys: ['wealthPalace'], mutagenStarKeys: [] },
  monthly: { index: 4, heavenlyStemKey: 'jiaHeavenly', earthlyBranchKey: 'ziEarthly', palaceNameKeys: ['spousePalace'], mutagenStarKeys: [] },
};

function makeService(snapshot: any) {
  const persistence = {
    findChartSnapshotById: vi.fn().mockResolvedValue(snapshot ? { snapshot } : null),
  };
  const quotas = { assertCanCreateChart: vi.fn().mockResolvedValue(undefined) };
  const engine = { computeFrame: vi.fn().mockReturnValue(frame) };
  const service = new FortuneService(persistence as any, quotas as any, engine as any);
  return { service, persistence, quotas, engine };
}

const ziweiSnapshot = {
  chartSystem: 'zi-wei-dou-shu',
  calculationConfidence: { level: 'medium', reasons: [], visibleMessageKey: 'k', blocksExactReading: false },
  ruleSource: { canonicalLibrary: { name: 'iztro', version: '2.5.8' } },
};

describe('FortuneService.getDailyFortune', () => {
  it('trả frame + summary tiếng Việt cho lá số Tử Vi', async () => {
    const { service, engine } = makeService(ziweiSnapshot);
    const res = await service.getDailyFortune(user, '1.2.3.4', '11111111-1111-4111-8111-111111111111', '2026-06-17');
    expect(res.asOf).toBe('2026-06-17');
    expect(res.summary.length).toBeGreaterThan(0);
    expect(engine.computeFrame).toHaveBeenCalledWith(ziweiSnapshot, '2026-06-17', ['daily']);
  });

  it('404 khi không tìm thấy lá số', async () => {
    const { service } = makeService(null);
    await expect(
      service.getDailyFortune(user, '1.2.3.4', '11111111-1111-4111-8111-111111111111', '2026-06-17'),
    ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
  });

  it('400 khi lá số không phải Tử Vi', async () => {
    const { service } = makeService({ ...ziweiSnapshot, chartSystem: 'ba-zi' });
    await expect(
      service.getDailyFortune(user, '1.2.3.4', '11111111-1111-4111-8111-111111111111', '2026-06-17'),
    ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
  });

  it('429 khi vượt quota (assertCanCreateChart ném)', async () => {
    const { service, quotas } = makeService(ziweiSnapshot);
    (quotas.assertCanCreateChart as any).mockRejectedValue(new Error('Daily chart quota exceeded.'));
    await expect(
      service.getDailyFortune(user, '1.2.3.4', '11111111-1111-4111-8111-111111111111', '2026-06-17'),
    ).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
  });
});

describe('FortuneService.getMonthlyFortune', () => {
  it('gọi engine với mốc YYYY-MM-15 (ngày giữa tháng) + scope monthly', async () => {
    const { service, engine } = makeService(ziweiSnapshot);
    const res = await service.getMonthlyFortune(user, '1.2.3.4', '11111111-1111-4111-8111-111111111111', '2026-06');
    expect(res.asOf).toBe('2026-06');
    expect(engine.computeFrame).toHaveBeenCalledWith(ziweiSnapshot, '2026-06-15', ['monthly']);
  });
});
