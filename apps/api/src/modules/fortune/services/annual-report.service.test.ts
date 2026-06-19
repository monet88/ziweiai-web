import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import type { AuthenticatedUser } from '@ziweiai/contracts';
import { AnnualReportService } from './annual-report.service';
import { apiEnv } from '../../../config/env';
import { ProviderTimeoutError } from '../../../providers/ai/provider-errors';

/* eslint-disable @typescript-eslint/no-explicit-any */

const user: AuthenticatedUser = { userId: 'user-1', email: 'a@b.com' } as any;
const CHART_ID = '11111111-1111-4111-8111-111111111111';

const ziweiSnapshot = {
  chartSystem: 'zi-wei-dou-shu',
  calculationConfidence: { level: 'medium', reasons: [], visibleMessageKey: 'k', blocksExactReading: false },
  ruleSource: { canonicalLibrary: { name: 'iztro', version: '2.5.8' } },
};

const item = (index: number) => ({
  index,
  heavenlyStemKey: 'jiaHeavenly',
  earthlyBranchKey: 'ziEarthly',
  palaceNameKeys: ['soulPalace'],
  mutagenStarKeys: [],
});
const annualFrame = { yearly: item(0), monthly: Array.from({ length: 12 }, (_, i) => item(i)) };

function makeService(snapshot: any = ziweiSnapshot) {
  const persistence = {
    findChartSnapshotById: vi.fn().mockResolvedValue(snapshot ? { snapshot } : null),
    findAnnualReportByChartAndYear: vi.fn().mockResolvedValue(null),
    createAnnualReport: vi.fn().mockResolvedValue({ markdown: '# Báo cáo năm 2026\n\nNăm này...' }),
  };
  const quotas = { assertCanCreateAnnualReport: vi.fn().mockResolvedValue(undefined) };
  const providerRouter = {
    generate: vi.fn().mockResolvedValue({
      renderedMarkdown: '# Báo cáo năm 2026\n\nNăm này...',
      providerMetadata: { provider: 'deepseek', promptTokens: '100', completionTokens: '800' },
    }),
  };
  const engine = { computeAnnualFrame: vi.fn().mockReturnValue(annualFrame) };
  const service = new AnnualReportService(persistence as any, quotas as any, providerRouter as any, engine as any);
  return { service, persistence, quotas, providerRouter, engine };
}

describe('AnnualReportService', () => {
  let prevFree: boolean;
  let prevEnabled: boolean;

  beforeEach(() => {
    prevFree = apiEnv.AI_EXPLANATION_FREE_FOR_ALL;
    prevEnabled = apiEnv.AI_ANNUAL_REPORT_ENABLED;
  });
  afterEach(() => {
    (apiEnv as any).AI_EXPLANATION_FREE_FOR_ALL = prevFree;
    (apiEnv as any).AI_ANNUAL_REPORT_ENABLED = prevEnabled;
  });

  it('cache-hit: trả markdown cũ, KHÔNG gọi provider (kể cả khi cờ off)', async () => {
    (apiEnv as any).AI_EXPLANATION_FREE_FOR_ALL = false;
    (apiEnv as any).AI_ANNUAL_REPORT_ENABLED = false;
    const { service, persistence, providerRouter } = makeService();
    (persistence.findAnnualReportByChartAndYear as any).mockResolvedValue({ markdown: '# Cũ' });

    const res = await service.createAnnualReport(user, '1.2.3.4', CHART_ID, 2026);
    expect(res.markdown).toBe('# Cũ');
    expect(providerRouter.generate).not.toHaveBeenCalled();
  });

  it('cache-miss + AI_ANNUAL_REPORT_ENABLED=false → 402 PAYMENT_REQUIRED', async () => {
    (apiEnv as any).AI_EXPLANATION_FREE_FOR_ALL = true;
    (apiEnv as any).AI_ANNUAL_REPORT_ENABLED = false;
    const { service, providerRouter } = makeService();
    await expect(service.createAnnualReport(user, '1.2.3.4', CHART_ID, 2026)).rejects.toMatchObject({
      status: HttpStatus.PAYMENT_REQUIRED,
    });
    expect(providerRouter.generate).not.toHaveBeenCalled();
  });

  it('cache-miss + AI_EXPLANATION_FREE_FOR_ALL=false → 402 (gate kép)', async () => {
    (apiEnv as any).AI_EXPLANATION_FREE_FOR_ALL = false;
    (apiEnv as any).AI_ANNUAL_REPORT_ENABLED = true;
    const { service } = makeService();
    await expect(service.createAnnualReport(user, '1.2.3.4', CHART_ID, 2026)).rejects.toMatchObject({
      status: HttpStatus.PAYMENT_REQUIRED,
    });
  });

  it('cache-miss + cả hai cờ on + quota OK → gọi provider + lưu + trả markdown', async () => {
    (apiEnv as any).AI_EXPLANATION_FREE_FOR_ALL = true;
    (apiEnv as any).AI_ANNUAL_REPORT_ENABLED = true;
    const { service, persistence, providerRouter } = makeService();

    const res = await service.createAnnualReport(user, '1.2.3.4', CHART_ID, 2026);
    expect(providerRouter.generate).toHaveBeenCalledOnce();
    expect(persistence.createAnnualReport).toHaveBeenCalledOnce();
    expect(res.frame.monthly).toHaveLength(12);
    expect(res.markdown.length).toBeGreaterThan(0);
  });

  it('quota annual vượt hạn → 429 RATE_LIMITED', async () => {
    (apiEnv as any).AI_EXPLANATION_FREE_FOR_ALL = true;
    (apiEnv as any).AI_ANNUAL_REPORT_ENABLED = true;
    const { service, quotas } = makeService();
    (quotas.assertCanCreateAnnualReport as any).mockRejectedValue(new Error('Daily annual report quota exceeded.'));
    await expect(service.createAnnualReport(user, '1.2.3.4', CHART_ID, 2026)).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
  });

  it('provider timeout → 504 PROVIDER_TIMEOUT', async () => {
    (apiEnv as any).AI_EXPLANATION_FREE_FOR_ALL = true;
    (apiEnv as any).AI_ANNUAL_REPORT_ENABLED = true;
    const { service, providerRouter } = makeService();
    (providerRouter.generate as any).mockRejectedValue(new ProviderTimeoutError('timeout'));
    await expect(service.createAnnualReport(user, '1.2.3.4', CHART_ID, 2026)).rejects.toMatchObject({
      status: HttpStatus.GATEWAY_TIMEOUT,
    });
  });

  it('không phải owner / không tồn tại → 404', async () => {
    const { service } = makeService(null);
    await expect(service.createAnnualReport(user, '1.2.3.4', CHART_ID, 2026)).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
    });
  });

  it('lá số không phải Tử Vi → 400', async () => {
    const { service } = makeService({ ...ziweiSnapshot, chartSystem: 'ba-zi' });
    await expect(service.createAnnualReport(user, '1.2.3.4', CHART_ID, 2026)).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
    });
  });
});
