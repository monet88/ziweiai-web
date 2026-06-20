import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  dailyFortuneResponseSchema,
  monthlyFortuneResponseSchema,
  type AuthenticatedUser,
  type DailyFortuneResponse,
  type MonthlyFortuneResponse,
} from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../../common/http/api-error';
import { SupabasePersistenceGateway } from '../../../database/supabase-persistence.gateway';
import { QuotasService } from '../../quotas/quotas.service';
import { HoroscopeEngineAdapter } from './horoscope-engine.adapter';
import { renderDailyCanonicalText, renderMonthlyCanonicalText } from './fortune-summary';

/**
 * Vận ngày + vận tháng (US-016) — thuần đọc, KHÔNG gọi LLM, KHÔNG tốn quota AI.
 *
 * Hai đường gần như giống hệt nhau (load chart → assert Tử Vi → compute frame → render summary
 * tiếng Việt), chỉ khác scope + template, nên gom chung service thay vì hai file song sinh.
 * Đường tốn token (báo cáo năm) tách riêng `AnnualReportService` vì khác bản chất (gate + LLM + cache).
 */
@Injectable()
export class FortuneService {
  private readonly logger = new Logger(FortuneService.name);

  constructor(
    private readonly persistenceGateway: SupabasePersistenceGateway,
    private readonly quotasService: QuotasService,
    private readonly engine: HoroscopeEngineAdapter,
  ) {}

  async getDailyFortune(user: AuthenticatedUser, ipAddress: string, chartId: string, asOf: string): Promise<DailyFortuneResponse> {
    const snapshot = await this.loadZiweiSnapshot(user, ipAddress, chartId);
    const frame = this.engine.computeFrame(snapshot, asOf, ['daily']);
    const summary = renderDailyCanonicalText(frame);
    this.logger.log(`[fortune.daily] chartId=${chartId} asOf=${asOf} userId=${user.userId}`);
    return dailyFortuneResponseSchema.parse({ chartId, asOf, frame, summary });
  }

  async getMonthlyFortune(user: AuthenticatedUser, ipAddress: string, chartId: string, asOf: string): Promise<MonthlyFortuneResponse> {
    // Engine cần ISO `YYYY-MM-DD`; vận tháng nhận `YYYY-MM` nên chốt ngày 15 (giữa tháng) cho ổn định.
    const snapshot = await this.loadZiweiSnapshot(user, ipAddress, chartId);
    const frame = this.engine.computeFrame(snapshot, `${asOf}-15`, ['monthly']);
    const summary = renderMonthlyCanonicalText(frame);
    this.logger.log(`[fortune.monthly] chartId=${chartId} asOf=${asOf} userId=${user.userId}`);
    return monthlyFortuneResponseSchema.parse({ chartId, asOf, frame, summary });
  }

  /**
   * Load + xác thực lá số Tử Vi đã lưu của user. Quota check ĐẦU TIÊN (khớp `computeHoroscope`):
   * phản hồi đồng nhất bất kể lá số tồn tại hay không, tránh side-channel dò tồn tại qua 404 vs 429.
   * Dùng chung quota `assertCanCreateChart` (rẻ, không LLM). Không sở hữu / không tồn tại → 404;
   * hệ khác Tử Vi → 400.
   */
  private async loadZiweiSnapshot(user: AuthenticatedUser, ipAddress: string, chartId: string) {
    try {
      await this.quotasService.assertCanCreateChart(user.userId, ipAddress, user.email === null);
    } catch (error) {
      throw new ApiErrorHttpException(HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMITED', error instanceof Error ? error.message : 'Đã vượt hạn mức.');
    }

    const chartRecord = await this.persistenceGateway.findChartSnapshotById(user.userId, chartId);
    if (!chartRecord) {
      throw new ApiErrorHttpException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Không tìm thấy lá số đã lưu.');
    }
    if (chartRecord.snapshot.chartSystem !== 'zi-wei-dou-shu') {
      throw new ApiErrorHttpException(HttpStatus.BAD_REQUEST, 'INVALID_INPUT', 'Vận hạn chỉ áp dụng cho lá số Tử Vi.');
    }
    return chartRecord.snapshot;
  }
}
