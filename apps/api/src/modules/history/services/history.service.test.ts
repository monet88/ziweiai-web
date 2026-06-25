import { describe, expect, it, vi } from 'vitest';
import type { ChartSnapshotRecord, ExplanationResultRecord, HistoryViewRecord } from '@ziweiai/contracts';
import { SupabasePersistenceGateway } from '../../../database/supabase-persistence.gateway';
import { HistoryService } from './history.service';

const USER_ID = '22222222-2222-4222-8222-222222222222';
const CHART_ID = '33333333-3333-4333-8333-333333333333';

function createHistoryView(overrides: Partial<HistoryViewRecord> = {}): HistoryViewRecord {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    ownerUserId: USER_ID,
    chartSnapshotId: CHART_ID,
    explanationResultId: null,
    viewedAt: '2026-06-10T12:00:00.000Z',
    ...overrides,
  };
}

function createExplanationResult(overrides: Partial<ExplanationResultRecord> = {}): ExplanationResultRecord {
  return {
    id: '55555555-5555-4555-8555-555555555555',
    ownerUserId: USER_ID,
    explanationRequestId: '66666666-6666-4666-8666-666666666666',
    chartSnapshotId: CHART_ID,
    cacheScope: 'user_snapshot',
    renderedMarkdown: 'Luận giải đã lưu.',
    providerMetadata: { provider: 'deepseek', explanationKind: 'overview' },
    createdAt: '2026-06-10T12:05:00.000Z',
    ...overrides,
  };
}

function createGateway(overrides: Partial<Record<keyof SupabasePersistenceGateway, unknown>> = {}) {
  const gateway = {
    listHistoryViews: vi.fn(async () => []),
    findChartSnapshotsByIds: vi.fn(async () => ({} as Record<string, ChartSnapshotRecord>)),
    findExplanationResultsByIds: vi.fn(async () => ({} as Record<string, ExplanationResultRecord>)),
    findLatestExplanationResultsForCharts: vi.fn(async () => ({} as Record<string, ExplanationResultRecord>)),
    findDivinationContextsByChartIds: vi.fn(async () => ({} as Record<string, unknown>)),
    findChartSnapshotById: vi.fn(async () => null as ChartSnapshotRecord | null),
    findExplanationResultById: vi.fn(async () => null as ExplanationResultRecord | null),
    listExplanationResultsForChart: vi.fn(async () => [] as ExplanationResultRecord[]),
    findLatestExplanationResultForChart: vi.fn(async () => null as ExplanationResultRecord | null),
    ...overrides,
  };

  return gateway as unknown as SupabasePersistenceGateway;
}

describe('HistoryService', () => {
  it('gắn luận giải mới nhất của chart cho history view không trỏ trực tiếp tới result', async () => {
    const view = createHistoryView();
    const latestResult = createExplanationResult();
    const gateway = createGateway({
      listHistoryViews: vi.fn(async () => [view]),
      findLatestExplanationResultsForCharts: vi.fn(async () => ({ [CHART_ID]: latestResult })),
    });
    const service = new HistoryService(gateway);

    const response = await service.listHistory(USER_ID, 20);

    expect(response.items[0]?.explanationResult?.id).toBe(latestResult.id);
    expect(gateway.findLatestExplanationResultsForCharts).toHaveBeenCalledWith(USER_ID, [CHART_ID]);
    expect(gateway.listExplanationResultsForChart).not.toHaveBeenCalled();
  });

  it('ưu tiên result được history view trỏ trực tiếp để giữ đúng sự kiện tạo luận giải', async () => {
    const directResult = createExplanationResult({ id: '77777777-7777-4777-8777-777777777777' });
    const view = createHistoryView({ explanationResultId: directResult.id });
    const gateway = createGateway({
      listHistoryViews: vi.fn(async () => [view]),
      findExplanationResultsByIds: vi.fn(async () => ({ [directResult.id]: directResult })),
    });
    const service = new HistoryService(gateway);

    const response = await service.listHistory(USER_ID, 20);

    expect(response.items[0]?.explanationResult?.id).toBe(directResult.id);
    expect(gateway.findLatestExplanationResultsForCharts).toHaveBeenCalledWith(USER_ID, [CHART_ID]);
    expect(gateway.listExplanationResultsForChart).not.toHaveBeenCalled();
  });

  it('fallback sang result mới nhất của chart khi result trực tiếp đã không còn tồn tại', async () => {
    const latestResult = createExplanationResult({ id: '88888888-8888-4888-8888-888888888888' });
    const view = createHistoryView({ explanationResultId: '77777777-7777-4777-8777-777777777777' });
    const gateway = createGateway({
      listHistoryViews: vi.fn(async () => [view]),
      findExplanationResultsByIds: vi.fn(async () => ({})),
      findLatestExplanationResultsForCharts: vi.fn(async () => ({ [CHART_ID]: latestResult })),
    });
    const service = new HistoryService(gateway);

    const response = await service.listHistory(USER_ID, 20);

    expect(response.items[0]?.explanationResult?.id).toBe(latestResult.id);
    expect(gateway.findLatestExplanationResultsForCharts).toHaveBeenCalledWith(USER_ID, [CHART_ID]);
    expect(gateway.listExplanationResultsForChart).not.toHaveBeenCalled();
  });

  it('batch loads charts and explanation results instead of issuing per-item lookups', async () => {
    const chartTwoId = '99999999-9999-4999-8999-999999999999';
    const explanationTwoId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const directExplanationId = '11111111-1111-4111-8111-111111111111';
    const views = [
      createHistoryView({ id: '77777777-7777-4777-8777-777777777777', explanationResultId: directExplanationId }),
      createHistoryView({ id: '88888888-8888-4888-8888-888888888888', chartSnapshotId: chartTwoId, explanationResultId: explanationTwoId }),
    ];
    const directResult = createExplanationResult({ id: directExplanationId });
    const latestResult = createExplanationResult({ id: explanationTwoId, chartSnapshotId: chartTwoId });
    const gateway = createGateway({
      listHistoryViews: vi.fn(async () => views),
      findChartSnapshotsByIds: vi.fn(async () => ({})),
      findExplanationResultsByIds: vi.fn(async () => ({ [directResult.id]: directResult })),
      findLatestExplanationResultsForCharts: vi.fn(async () => ({ [CHART_ID]: directResult, [chartTwoId]: latestResult })),
    });
    const service = new HistoryService(gateway);

    const response = await service.listHistory(USER_ID, 20);

    expect(response.items).toHaveLength(2);
    expect(response.items[0]?.chartRecord).toBeNull();
    expect(response.items[0]?.explanationResult?.id).toBe(directResult.id);
    expect(response.items[1]?.explanationResult?.id).toBe(latestResult.id);
    expect(gateway.findChartSnapshotsByIds).toHaveBeenCalledTimes(1);
    expect(gateway.findExplanationResultsByIds).toHaveBeenCalledTimes(1);
    expect(gateway.findLatestExplanationResultsForCharts).toHaveBeenCalledTimes(1);
    expect(gateway.findChartSnapshotById).not.toHaveBeenCalled();
    expect(gateway.findExplanationResultById).not.toHaveBeenCalled();
    expect(gateway.findLatestExplanationResultForChart).not.toHaveBeenCalled();
  });
});
