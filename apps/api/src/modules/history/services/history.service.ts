import { Injectable, Logger } from '@nestjs/common';
import { historyListResponseSchema } from '@ziweiai/contracts';
import { SupabasePersistenceGateway } from '../../../database/supabase-persistence.gateway';
import { VisionStorageGateway } from '../../vision-shared/vision-storage.gateway';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    private readonly persistenceGateway: SupabasePersistenceGateway,
    private readonly visionStorageGateway: VisionStorageGateway,
  ) {}

  async listHistory(userId: string, limit: number) {
    const views = await this.persistenceGateway.listHistoryViews(userId, limit);
    const chartSnapshotIds = views.flatMap((view) => (view.chartSnapshotId ? [view.chartSnapshotId] : []));
    const directExplanationResultIds = views.flatMap((view) => (view.explanationResultId ? [view.explanationResultId] : []));
    // US-017 follow-up (decision 0023): Xem Tướng/Xem Tay views point at vision_result_id
    // (no chart snapshot). Collect them so a vision history card shows image + narrative + question.
    const visionResultIds = views.flatMap((view) => (view.visionResultId ? [view.visionResultId] : []));

    const [
      chartRecordsById,
      directExplanationResultsById,
      latestExplanationResultsByChartId,
      divinationContextsByChartId,
      visionResultsById,
    ] = await Promise.all([
      this.persistenceGateway.findChartSnapshotsByIds(userId, chartSnapshotIds),
      this.persistenceGateway.findExplanationResultsByIds(userId, directExplanationResultIds),
      this.persistenceGateway.findLatestExplanationResultsForCharts(userId, chartSnapshotIds),
      this.persistenceGateway.findDivinationContextsByChartIds(userId, chartSnapshotIds),
      this.persistenceGateway.findVisionResultsByIds(userId, visionResultIds),
    ]);

    // Sign image URLs once per distinct vision image path (a private bucket is not readable by
    // path on the client). Dedupe so repeated views of the same image only cost one sign call.
    const distinctImagePaths = [
      ...new Set(
        Object.values(visionResultsById).map((record) => record.imagePath),
      ),
    ];
    const signedUrlEntries = await Promise.all(
      distinctImagePaths.map(async (imagePath) => {
        const signedUrl = await this.visionStorageGateway.createSignedImageUrl(imagePath);
        return [imagePath, signedUrl] as const;
      }),
    );
    const signedUrlByImagePath = new Map(signedUrlEntries);

    // Observability: từng lỗi ký đã log per-item ở gateway (warn cho path-lạ, error cho ngoại lệ),
    // nhưng một sự cố storage DIỆN RỘNG chỉ hiện ra dưới dạng nhiều dòng rời rạc, không có tín hiệu
    // tổng. Đếm số path ký hỏng trên cả batch và log một dòng error khi CÓ lỗi — "ký hỏng N/M ảnh"
    // biến outage hệ thống thành một sự kiện quan sát được (alert theo tỉ lệ), không chìm trong warn.
    const failedSignCount = signedUrlEntries.filter(([, signedUrl]) => signedUrl === null).length;
    if (failedSignCount > 0) {
      this.logger.error(
        `[history] ký signed URL ảnh vision thất bại ${failedSignCount}/${distinctImagePaths.length} (userId=${userId})`,
      );
    }

    const items = views.map((view) => {
      const directExplanationResult = view.explanationResultId ? directExplanationResultsById[view.explanationResultId] ?? null : null;
      const latestExplanationResult = view.chartSnapshotId ? latestExplanationResultsByChartId[view.chartSnapshotId] ?? null : null;
      const visionResult = view.visionResultId ? visionResultsById[view.visionResultId] ?? null : null;

      return {
        view,
        chartRecord: view.chartSnapshotId ? chartRecordsById[view.chartSnapshotId] ?? null : null,
        explanationResult: directExplanationResult ?? latestExplanationResult,
        divinationContext: view.chartSnapshotId ? divinationContextsByChartId[view.chartSnapshotId] ?? null : null,
        visionResult,
        visionImageUrl: visionResult ? signedUrlByImagePath.get(visionResult.imagePath) ?? null : null,
      };
    });

    return historyListResponseSchema.parse({ items });
  }
}
