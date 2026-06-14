import { Injectable } from '@nestjs/common';
import { historyListResponseSchema } from '@ziweiai/contracts';
import { SupabasePersistenceGateway } from '../../../database/supabase-persistence.gateway';

@Injectable()
export class HistoryService {
  constructor(private readonly persistenceGateway: SupabasePersistenceGateway) {}

  async listHistory(userId: string, limit: number) {
    const views = await this.persistenceGateway.listHistoryViews(userId, limit);
    const chartSnapshotIds = views.flatMap((view) => (view.chartSnapshotId ? [view.chartSnapshotId] : []));
    const directExplanationResultIds = views.flatMap((view) => (view.explanationResultId ? [view.explanationResultId] : []));

    const [chartRecordsById, directExplanationResultsById, latestExplanationResultsByChartId] = await Promise.all([
      this.persistenceGateway.findChartSnapshotsByIds(userId, chartSnapshotIds),
      this.persistenceGateway.findExplanationResultsByIds(userId, directExplanationResultIds),
      this.persistenceGateway.findLatestExplanationResultsForCharts(userId, chartSnapshotIds),
    ]);

    const items = views.map((view) => {
      const directExplanationResult = view.explanationResultId ? directExplanationResultsById[view.explanationResultId] ?? null : null;
      const latestExplanationResult = view.chartSnapshotId ? latestExplanationResultsByChartId[view.chartSnapshotId] ?? null : null;

      return {
        view,
        chartRecord: view.chartSnapshotId ? chartRecordsById[view.chartSnapshotId] ?? null : null,
        explanationResult: directExplanationResult ?? latestExplanationResult,
      };
    });

    return historyListResponseSchema.parse({ items });
  }
}
