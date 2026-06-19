import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  annualReportResponseSchema,
  explanationContextSchema,
  type AnnualReportResponse,
  type AuthenticatedUser,
  type ChartSnapshot,
} from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../../common/http/api-error';
import { assertAnnualReportEnabled, assertCanUseAiExplanation } from '../../../common/entitlement/ai-entitlement.guard';
import { SupabasePersistenceGateway } from '../../../database/supabase-persistence.gateway';
import { buildAnnualReportPrompt } from '../../../providers/ai/build-annual-report-prompt';
import { ExplanationProviderRouter } from '../../../providers/ai/explanation-provider-router';
import { ProviderTimeoutError, ProviderUnavailableError } from '../../../providers/ai/provider-errors';
import { QuotasService } from '../../quotas/quotas.service';
import { HoroscopeEngineAdapter } from './horoscope-engine.adapter';

/**
 * Báo cáo năm (US-016) — đường tốn token cao: ghép lưu niên + 12 lưu nguyệt rồi gọi LLM.
 *
 * Tách riêng khỏi `FortuneService` (daily/monthly thuần đọc) vì khác bản chất: cache DB + gate
 * kép (decision 0010 + cờ riêng `AI_ANNUAL_REPORT_ENABLED`) + quota riêng + nhánh provider.
 * Cache-hit đi TRƯỚC mọi gate (kết quả đã sinh thì cho xem, theo 0010).
 */
@Injectable()
export class AnnualReportService {
  private readonly logger = new Logger(AnnualReportService.name);

  constructor(
    private readonly persistenceGateway: SupabasePersistenceGateway,
    private readonly quotasService: QuotasService,
    private readonly providerRouter: ExplanationProviderRouter,
    private readonly engine: HoroscopeEngineAdapter,
  ) {}

  async createAnnualReport(user: AuthenticatedUser, ipAddress: string, chartId: string, year: number): Promise<AnnualReportResponse> {
    const snapshot = await this.loadZiweiSnapshot(user, chartId);

    // CACHE-HIT BYPASS GATE (decision 0010): có row rồi thì trả lại, không re-gate, không gọi LLM.
    const cached = await this.persistenceGateway.findAnnualReportByChartAndYear(user.userId, chartId, year);
    if (cached) {
      this.logger.log(`[fortune.annual] outcome=cache-hit chartId=${chartId} year=${year} userId=${user.userId}`);
      const frame = this.engine.computeAnnualFrame(snapshot, year);
      return annualReportResponseSchema.parse({ chartId, year, frame, markdown: cached.markdown });
    }

    // ===== GATES (chỉ áp khi sinh mới) — fail-closed cả hai cờ =====
    assertCanUseAiExplanation(this.logger);
    assertAnnualReportEnabled(this.logger);
    try {
      await this.quotasService.assertCanCreateAnnualReport(user.userId, ipAddress, user.email === null);
    } catch (error) {
      this.logger.warn(`[annual] quota exceeded userId=${user.userId}`);
      throw new ApiErrorHttpException(HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMITED', error instanceof Error ? error.message : 'Đã vượt hạn mức báo cáo năm.');
    }

    const frame = this.engine.computeAnnualFrame(snapshot, year);
    const prompt = buildAnnualReportPrompt(snapshot, frame, year);

    let providerResult;
    try {
      providerResult = await this.providerRouter.generate('auto', {
        chartSnapshot: snapshot,
        explanationKind: 'annual-report',
        explanationContext: this.buildExplanationContext(snapshot),
        promptOverride: prompt,
      });
    } catch (error) {
      if (error instanceof ProviderTimeoutError) {
        throw new ApiErrorHttpException(HttpStatus.GATEWAY_TIMEOUT, 'PROVIDER_TIMEOUT', error.message);
      }
      if (error instanceof ProviderUnavailableError) {
        throw new ApiErrorHttpException(HttpStatus.BAD_GATEWAY, 'PROVIDER_UNAVAILABLE', error.message);
      }
      throw error;
    }

    // Race hai caller cùng (chart, year): createAnnualReport bắt unique-violation rồi đọc lại row
    // của caller thắng → trả Markdown đó (idempotent). Caller thua "phí" một lần gọi LLM nhưng không
    // ghi đè cache — chấp nhận được vì annual chỉ sinh 1 lần/lifetime mỗi (chart, year).
    const row = await this.persistenceGateway.createAnnualReport({
      ownerUserId: user.userId,
      chartSnapshotId: chartId,
      year,
      markdown: providerResult.renderedMarkdown,
      providerMetadata: providerResult.providerMetadata,
    });

    this.logger.log(
      `[fortune.annual] outcome=generated chartId=${chartId} year=${year} userId=${user.userId} providerName=${providerResult.providerMetadata.provider} tokensIn=${providerResult.providerMetadata.promptTokens} tokensOut=${providerResult.providerMetadata.completionTokens}`,
    );
    return annualReportResponseSchema.parse({ chartId, year, frame, markdown: row.markdown });
  }

  private async loadZiweiSnapshot(user: AuthenticatedUser, chartId: string): Promise<ChartSnapshot> {
    const chartRecord = await this.persistenceGateway.findChartSnapshotById(user.userId, chartId);
    if (!chartRecord) {
      throw new ApiErrorHttpException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Không tìm thấy lá số đã lưu.');
    }
    if (chartRecord.snapshot.chartSystem !== 'zi-wei-dou-shu') {
      throw new ApiErrorHttpException(HttpStatus.BAD_REQUEST, 'INVALID_INPUT', 'Báo cáo năm chỉ áp dụng cho lá số Tử Vi.');
    }
    return chartRecord.snapshot;
  }

  private buildExplanationContext(snapshot: ChartSnapshot) {
    return explanationContextSchema.parse({
      chartSystem: snapshot.chartSystem,
      visibleMessageKeys: [snapshot.calculationConfidence.visibleMessageKey],
      confidence: snapshot.calculationConfidence,
      sourceLabel: `${snapshot.ruleSource.canonicalLibrary.name}@${snapshot.ruleSource.canonicalLibrary.version}`,
    });
  }
}
