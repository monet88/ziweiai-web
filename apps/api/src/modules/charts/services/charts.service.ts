import { HttpStatus, Injectable } from '@nestjs/common';
import {
  DaliurenAdapter,
  IztroChartAdapter,
  LiuyaoAdapter,
  LunarJavascriptBaziAdapter,
  MeiHuaAdapter,
  QimenAdapter,
  computeZiweiHoroscope,
  type AstrologyChartAdapter,
} from '@ziweiai/astro-engine';
import { buildChartSnapshotDedupeKey } from '../../../database/idempotency';
import { SupabasePersistenceGateway } from '../../../database/supabase-persistence.gateway';
import { ApiErrorHttpException } from '../../../common/http/api-error';
import { QuotasService } from '../../quotas/quotas.service';
import {
  createChartResponseSchema,
  horoscopeResponseSchema,
  type ChartSystem,
  type CreateChartRequest,
  type CreateChartResponse,
  type HoroscopeResponse,
  type HoroscopeScope,
} from '@ziweiai/contracts';

@Injectable()
export class ChartsService {
  private readonly adapters: Record<string, AstrologyChartAdapter> = {
    'zi-wei-dou-shu': new IztroChartAdapter(),
    'ba-zi': new LunarJavascriptBaziAdapter(),
    'mei-hua-yi-shu': new MeiHuaAdapter(),
    'liu-yao': new LiuyaoAdapter(),
    'da-liu-ren': new DaliurenAdapter(),
    'qi-men-dun-jia': new QimenAdapter(),
  };

  constructor(
    private readonly persistenceGateway: SupabasePersistenceGateway,
    private readonly quotasService: QuotasService,
  ) {}

  async createChart(userId: string, ipAddress: string, input: CreateChartRequest, isAnonymous = false): Promise<CreateChartResponse> {
    await this.assertCanCreateChart(userId, ipAddress, isAnonymous);

    const adapter = this.getAdapter(input.chartSystem);
    const viewYear = adapter.usesViewYear ? (input.viewYear ?? new Date().getUTCFullYear()) : undefined;
    const snapshot = await adapter.calculateChart(input.birthInput, { viewYear });
    const birthProfile = await this.ensureBirthProfile(userId, input, snapshot);
    const dedupeKey = buildChartSnapshotDedupeKey({
      ownerUserId: userId,
      chartSystem: snapshot.chartSystem,
      inputHashDigest: snapshot.inputHash.digest,
      engineSemver: snapshot.engineVersion.engineSemver,
      ruleSourceVersion: snapshot.ruleSource.canonicalLibrary.version,
      schemaVersion: snapshot.engineVersion.schemaVersion,
      viewYear,
    });

    const existingChartRecord = await this.persistenceGateway.findChartSnapshotByDedupeKey(userId, dedupeKey);
    if (existingChartRecord) {
      return createChartResponseSchema.parse({
        snapshot: existingChartRecord.snapshot,
        chartRecord: existingChartRecord,
        birthProfile,
        reusedExistingSnapshot: true,
      });
    }

    const chartRecord = await this.persistenceGateway.createChartSnapshot({
      ownerUserId: userId,
      birthProfileId: birthProfile.id,
      snapshotDedupeKey: dedupeKey,
      snapshot,
    });

    return createChartResponseSchema.parse({
      snapshot,
      chartRecord,
      birthProfile,
      reusedExistingSnapshot: false,
    });
  }

  async getChartDetail(userId: string, chartSnapshotId: string) {
    const chartRecord = await this.persistenceGateway.findChartSnapshotById(userId, chartSnapshotId);
    if (!chartRecord) {
      throw new ApiErrorHttpException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Không tìm thấy lá số đã lưu.');
    }

    await this.persistenceGateway.createHistoryView({
      ownerUserId: userId,
      chartSnapshotId,
      explanationResultId: null,
    });

    const explanationResults = await this.persistenceGateway.listExplanationResultsForChart(userId, chartSnapshotId);
    return {
      chartRecord,
      snapshot: chartRecord.snapshot,
      explanationResults,
    };
  }

  /**
   * Tính vận hạn Tử Vi theo `asOf` cho một lá số đã lưu (US-014, decision 0011).
   *
   * Engine chạy server-side, web KHÔNG tự tính (boundary 0007). Dùng chung quota
   * `assertCanCreateChart` (rẻ, không gọi LLM). Không sở hữu / không tồn tại → 404
   * (không lộ tồn tại); chart system khác → 400.
   */
  async computeHoroscope(
    userId: string,
    ipAddress: string,
    chartId: string,
    asOf: string,
    scopes: HoroscopeScope[],
    isAnonymous = false,
  ): Promise<HoroscopeResponse> {
    const chartRecord = await this.persistenceGateway.findChartSnapshotById(userId, chartId);
    if (!chartRecord) {
      throw new ApiErrorHttpException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Không tìm thấy lá số đã lưu.');
    }

    if (chartRecord.snapshot.chartSystem !== 'zi-wei-dou-shu') {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        'Vận hạn chỉ áp dụng cho lá số Tử Vi.',
      );
    }

    await this.assertCanCreateChart(userId, ipAddress, isAnonymous);

    const frame = computeZiweiHoroscope({ snapshot: chartRecord.snapshot, asOf, scopes });

    return horoscopeResponseSchema.parse({ chartId, asOf, frame });
  }

  private async ensureBirthProfile(userId: string, input: CreateChartRequest, snapshot: CreateChartResponse['snapshot']) {
    const existing = await this.persistenceGateway.findLatestBirthProfileByInputHash(userId, snapshot.inputHash.digest);
    if (existing && (!input.makeActiveBirthProfile || existing.isActive)) {
      return existing;
    }

    return this.persistenceGateway.createBirthProfile({
      ownerUserId: userId,
      rawBirthInput: input.birthInput,
      normalizedBirth: snapshot.birth,
      inputHashDigest: snapshot.inputHash.digest,
      isActive: input.makeActiveBirthProfile,
    });
  }

  private getAdapter(chartSystem: ChartSystem): AstrologyChartAdapter {
    const adapter = this.adapters[chartSystem];
    if (!adapter) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        `Hệ lá số "${chartSystem}" chưa được bật ở backend trong phase hiện tại.`,
      );
    }

    return adapter;
  }

  private async assertCanCreateChart(userId: string, ipAddress: string, isAnonymous = false): Promise<void> {
    try {
      await this.quotasService.assertCanCreateChart(userId, ipAddress, isAnonymous);
    } catch (error) {
      throw new ApiErrorHttpException(HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMITED', error instanceof Error ? error.message : 'Đã vượt hạn mức lập lá số.');
    }
  }
}
