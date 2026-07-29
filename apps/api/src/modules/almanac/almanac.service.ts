import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  ALMANAC_TOPIC_LABELS,
  almanacSelectionSchema,
  type AlmanacSelection,
  type AlmanacTopic,
  type AuthenticatedUser,
} from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { throwQuotaRateLimited } from '../quotas/quota-http';
import { apiEnv } from '../../config/env';
import { ExplanationProviderRouter } from '../../providers/ai/explanation-provider-router';
import { ProviderTimeoutError, ProviderUnavailableError } from '../../providers/ai/provider-errors';
import { QuotasService } from '../quotas/quotas.service';
import { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';
import { AlmanacEngineError, generateAlmanacSelection, type AlmanacSelectionResult } from './almanac-engine';
import { buildAlmanacSelectionPrompt } from './almanac-prompts';

@Injectable()
export class AlmanacService {
  private readonly logger = new Logger(AlmanacService.name);

  constructor(
    private readonly quotasService: QuotasService,
    private readonly providerRouter: ExplanationProviderRouter,
    private readonly persistenceGateway: SupabasePersistenceGateway,
  ) {}

  async select(
    user: AuthenticatedUser,
    ipAddress: string,
    topic: AlmanacTopic,
    startDate: string,
    endDate: string,
  ): Promise<AlmanacSelection> {
    if (!apiEnv.EXTENDED_SYSTEM_ALMANAC_ENABLED) {
      // Cờ tắt = từ chối có chủ đích (feature tồn tại nhưng chưa bật) → 403 FORBIDDEN, đồng bộ tarot.
      throw new ApiErrorHttpException(
        HttpStatus.FORBIDDEN,
        'FEATURE_DISABLED',
        'Tính năng Hoàng lịch hiện chưa được bật.',
      );
    }

    const topicLabel = ALMANAC_TOPIC_LABELS[topic];
    // Validate + chạy engine (tất định, rẻ, không tốn LLM) TRƯỚC quota: nếu ngày sai định dạng/đảo
    // ngược/vượt trần thì trả 400 ngay, KHÔNG tăng counter quota — tránh đốt hạn mức ngày của user
    // bằng một request lỗi input. Gate premium vẫn đứng trước cả hai (chặn 402 sớm nhất).
    await this.assertPremiumEntitlement(user.userId);
    const selection = this.runEngine({ topic, topicLabel, startDate, endDate });
    // email rỗng/null ⟺ phiên ẩn danh (decision 0009); !user.email bắt cả email="".
    await this.assertCanCreate(user.userId, ipAddress, !user.email);
    const narrative = await this.generateNarrative(topic, topicLabel, startDate, endDate, selection);

    return almanacSelectionSchema.parse({
      topic,
      topicLabel,
      startDate,
      endDate,
      days: selection.days,
      narrative,
    });
  }

  // Chỉ lỗi đầu vào của engine (khoảng ngày sai/đảo ngược, định dạng ngày, vượt trần) → 400
  // INVALID_INPUT. AlmanacVocabError (Han-gate thiếu mục từ điển) là defect dữ liệu nội bộ, KHÔNG
  // phải lỗi người dùng: để nó propagate xuống ApiErrorFilter → 500 INTERNAL_ERROR thay vì đổ lỗi
  // 400 cho client.
  private runEngine(params: {
    topic: AlmanacTopic;
    topicLabel: string;
    startDate: string;
    endDate: string;
  }): AlmanacSelectionResult {
    try {
      return generateAlmanacSelection(params);
    } catch (error) {
      if (error instanceof AlmanacEngineError) {
        throw new ApiErrorHttpException(HttpStatus.BAD_REQUEST, 'INVALID_INPUT', error.message);
      }
      throw error;
    }
  }

  private async assertPremiumEntitlement(userId?: string): Promise<void> {
    if (apiEnv.AI_EXPLANATION_FREE_FOR_ALL) {
      return;
    }

    if (!userId) {
      throw new ApiErrorHttpException(
        HttpStatus.PAYMENT_REQUIRED,
        'PAYMENT_REQUIRED',
        'Tính năng chọn ngày Hoàng lịch yêu cầu đăng nhập và có XU. Vui lòng đăng nhập hoặc nạp XU.',
      );
    }

    const cost = 3;
    const success = await this.persistenceGateway.deductXU(userId, cost);
    if (!success) {
      throw new ApiErrorHttpException(
        HttpStatus.PAYMENT_REQUIRED,
        'INSUFFICIENT_FUNDS',
        `Tính năng chọn ngày Hoàng lịch yêu cầu ${cost} XU. Số dư XU của bạn không đủ, vui lòng nạp thêm XU.`,
      );
    }
  }

  private async assertCanCreate(userId: string, ipAddress: string, isAnonymous: boolean): Promise<void> {
    try {
      await this.quotasService.assertCanCreateAlmanacSelection(userId, ipAddress, isAnonymous);
    } catch (error) {
      throwQuotaRateLimited(error, 'Đã vượt hạn mức chọn ngày Hoàng lịch.');
    }
  }

  // Bài luận do LLM sinh; chọn ngày + chấm điểm vẫn tất định. Provider lỗi/timeout/CJK → rơi về
  // template Việt để lượt chọn ngày KHÔNG bị 500 (danh sách ngày đã chấm điểm là kết quả nền).
  // Đồng bộ tarot/dream/stick.
  private async generateNarrative(
    topic: AlmanacTopic,
    topicLabel: string,
    startDate: string,
    endDate: string,
    selection: AlmanacSelectionResult,
  ): Promise<string> {
    try {
      const providerResult = await this.providerRouter.generate('auto', {
        explanationKind: 'almanac-selection',
        promptOverride: buildAlmanacSelectionPrompt({
          topic,
          topicLabel,
          startDate,
          endDate,
          days: selection.days,
        }),
      });
      if (!providerResult || typeof providerResult.renderedMarkdown !== 'string') {
        throw new ProviderUnavailableError('LLM provider returned an empty or invalid narrative response.');
      }
      this.logger.log(
        `[almanac] outcome=generated provider=${providerResult.providerMetadata.provider ?? 'unknown'} topic=${topic} days=${selection.days.length}`,
      );
      return providerResult.renderedMarkdown;
    } catch (error) {
      if (error instanceof ProviderTimeoutError || error instanceof ProviderUnavailableError) {
        this.logger.warn(`[almanac] outcome=fallback reason=${error.constructor.name} message=${error.message}`);
        return this.generateDeterministicNarrative(topicLabel, selection);
      }
      throw error;
    }
  }

  private generateDeterministicNarrative(topicLabel: string, selection: AlmanacSelectionResult): string {
    const best = selection.days[0];
    if (!best) {
      return `Chưa có ngày phù hợp trong khoảng đã chọn cho việc ${topicLabel}. Hãy thử mở rộng khoảng ngày.`;
    }
    return `Trong khoảng đã chọn cho việc ${topicLabel}, ngày ${best.date} (${best.weekday}, ${best.lunarDate}) có điểm phù hợp cao nhất (${best.score}/100). Trực ${best.dayOfficer}, sao ${best.twentyEightStar}. Hãy xem đây là gợi ý tham khảo: cân nhắc lịch thực tế của bạn rồi chọn ngày thuận tiện nhất trong nhóm điểm cao.`;
  }
}
