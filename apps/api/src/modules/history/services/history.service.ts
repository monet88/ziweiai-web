import { Injectable, Logger } from '@nestjs/common';
import { historyListResponseSchema } from '@ziweiai/contracts';
import { HistoryRepository } from '../../../database/repositories/history.repository';
import { ChartsRepository } from '../../../database/repositories/charts.repository';
import { ExplanationsRepository } from '../../../database/repositories/explanations.repository';
import { DivinationsRepository } from '../../../database/repositories/divinations.repository';
import { VisionRepository } from '../../../database/repositories/vision.repository';
import { VisionStorageGateway } from '../../vision-shared/vision-storage.gateway';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    private readonly historyRepository: HistoryRepository,
    private readonly chartsRepository: ChartsRepository,
    private readonly explanationsRepository: ExplanationsRepository,
    private readonly divinationsRepository: DivinationsRepository,
    private readonly visionRepository: VisionRepository,
    private readonly visionStorageGateway: VisionStorageGateway,
  ) {}

  async listHistory(userId: string, limit: number) {
    const views = await this.historyRepository.listHistoryViews(userId, limit);
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
      this.chartsRepository.findChartSnapshotsByIds(userId, chartSnapshotIds),
      this.explanationsRepository.findExplanationResultsByIds(userId, directExplanationResultIds),
      this.explanationsRepository.findLatestExplanationResultsForCharts(userId, chartSnapshotIds),
      this.divinationsRepository.findDivinationContextsByChartIds(userId, chartSnapshotIds),
      this.visionRepository.findVisionResultsByIds(userId, visionResultIds),
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

    // Observability: từng lỗi ký đã log per-item ở gateway (warn cho path-lạ/ảnh đã xoá, error cho
    // ngoại lệ). Tầng tổng này chỉ biết SỐ ĐẾM null, không biết từng null thuộc loại nào — nên mức log
    // phải suy từ TỈ LỆ. Vài ảnh null giữa một batch nhiều ảnh là điều kiện dữ liệu BÌNH THƯỜNG (ảnh
    // xoá thủ công, path cũ) → warn; chỉ khi CẢ batch (>1 ảnh) đều ký hỏng mới là tín hiệu sự cố
    // storage diện rộng đáng báo động → error. Tránh việc một ảnh thiếu kích hoạt error ở mọi lần
    // GET /history (nhiễu alert, không phân biệt được data bình thường với outage thật).
    const failedSignCount = signedUrlEntries.filter(([, signedUrl]) => signedUrl === null).length;
    if (failedSignCount > 0) {
      const message = `[history] ký signed URL ảnh vision thất bại ${failedSignCount}/${distinctImagePaths.length} (userId=${userId})`;
      const isSystemicOutage = failedSignCount === distinctImagePaths.length && distinctImagePaths.length > 1;
      if (isSystemicOutage) {
        this.logger.error(message);
      } else {
        this.logger.warn(message);
      }
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
