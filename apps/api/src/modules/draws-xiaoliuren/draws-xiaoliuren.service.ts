import { HttpStatus, Injectable } from '@nestjs/common';
import {
  FEATURE_PRICING,
  xiaoLiuRenDrawSchema,
  type AuthenticatedUser,
  type XiaoLiuRenDraw,
  type XiaoLiuRenDrawRequest,
} from '@ziweiai/contracts';
import { calculateXiaoLiuRen } from '@ziweiai/astro-engine';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { apiEnv } from '../../config/env';
import { AiFeatureExecutionOrchestrator } from '../../providers/ai/ai-feature-execution.orchestrator';
import { buildXiaoLiuRenPrompt } from './xiaoliuren-prompts';

@Injectable()
export class DrawsXiaoLiuRenService {

  constructor(
    private readonly orchestrator: AiFeatureExecutionOrchestrator,
  ) {}

  async drawXiaoLiuRen(
    user: AuthenticatedUser,
    ipAddress: string,
    request: XiaoLiuRenDrawRequest,
  ): Promise<XiaoLiuRenDraw> {
    if (!apiEnv.EXTENDED_SYSTEM_XIAOLIUREN_ENABLED) {
      throw new ApiErrorHttpException(
        HttpStatus.FORBIDDEN,
        'FEATURE_DISABLED',
        'Tính năng Bấm Độn Tiểu Lục Nhâm hiện chưa được bật.',
      );
    }

    const normalizedQuestion = request.question.trim();
    if (!normalizedQuestion) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        'Câu hỏi gieo quẻ không được để trống.',
      );
    }

    const calcResult = calculateXiaoLiuRen({
      question: normalizedQuestion,
      method: request.method,
      numbers: request.numbers,
    });

    const promptOverride = buildXiaoLiuRenPrompt(calcResult);

    const narrative = await this.orchestrator.executeFeature({
      userId: user.userId,
      ipAddress,
      isAnonymous: !user.email,
      quotaFeatureKey: 'xiaoliuren-draw',
      quotaErrorMessage: 'Đã vượt hạn mức gieo quẻ Tiểu Lục Nhâm.',
      explanationKind: 'divination-reading',
      cost: FEATURE_PRICING.XIAOLIUREN,
      paymentErrorMessage: 'Tính năng gieo quẻ Tiểu Lục Nhâm yêu cầu đăng nhập và có XU. Vui lòng đăng nhập hoặc nạp XU.',
      paymentInsufficientFundsMessage: `Tính năng gieo quẻ yêu cầu ${FEATURE_PRICING.XIAOLIUREN} XU. Số dư XU của bạn không đủ, vui lòng nạp thêm XU.`,
      promptOverride,
      generateFallback: () => calcResult.deterministicNarrative,
      tier: 'light',
    });

    return xiaoLiuRenDrawSchema.parse({
      question: normalizedQuestion,
      method: calcResult.method,
      numbers: calcResult.numbers,
      firstPalace: calcResult.firstPalace,
      secondPalace: calcResult.secondPalace,
      targetPalace: calcResult.targetPalace,
      flowDescription: calcResult.flowDescription,
      lunarDateSummary: calcResult.lunarDateSummary,
      narrative,
      seed: request.seed,
    });
  }
}
