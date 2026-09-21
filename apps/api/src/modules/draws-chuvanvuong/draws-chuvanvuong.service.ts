import { HttpStatus, Injectable } from '@nestjs/common';
import {
  FEATURE_PRICING,
  chuVanVuongDrawSchema,
  type AuthenticatedUser,
  type ChuVanVuongDraw,
  type ChuVanVuongDrawRequest,
} from '@ziweiai/contracts';
import { calculateChuVanVuong } from '@ziweiai/astro-engine';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { AiFeatureExecutionOrchestrator } from '../../providers/ai/ai-feature-execution.orchestrator';
import { buildChuVanVuongPrompt } from './chuvanvuong-prompts';

@Injectable()
export class DrawsChuVanVuongService {
  constructor(
    private readonly orchestrator: AiFeatureExecutionOrchestrator,
  ) {}

  async drawChuVanVuong(
    user: AuthenticatedUser,
    ipAddress: string,
    request: ChuVanVuongDrawRequest,
  ): Promise<ChuVanVuongDraw> {
    const normalizedQuestion = request.question.trim();
    if (!normalizedQuestion) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        'Câu hỏi gieo quẻ không được để trống.',
      );
    }

    const calcResult = calculateChuVanVuong({
      question: normalizedQuestion,
      method: request.method,
      numbers: request.numbers,
      coins: request.coins,
      hexagramId: request.hexagramId,
    });

    const promptOverride = buildChuVanVuongPrompt(calcResult);

    const narrative = await this.orchestrator.executeFeature({
      userId: user.userId,
      ipAddress,
      isAnonymous: !user.email,
      quotaFeatureKey: 'chuvanvuong-draw',
      quotaErrorMessage: 'Đã vượt hạn mức gieo quẻ Chu Văn Vương.',
      explanationKind: 'divination-reading',
      cost: FEATURE_PRICING.CHUVANVUONG,
      paymentErrorMessage:
        'Tính năng gieo quẻ Chu Văn Vương yêu cầu đăng nhập và có XU. Vui lòng đăng nhập hoặc nạp XU.',
      paymentInsufficientFundsMessage: `Tính năng gieo quẻ Chu Văn Vương yêu cầu ${FEATURE_PRICING.CHUVANVUONG} XU. Số dư XU của bạn không đủ, vui lòng nạp thêm XU.`,
      promptOverride,
      generateFallback: () => calcResult.deterministicNarrative,
      tier: 'light',
    });

    return chuVanVuongDrawSchema.parse({
      question: normalizedQuestion,
      method: calcResult.method,
      hexagram: calcResult.hexagram,
      numbers: calcResult.numbers,
      coins: calcResult.coins,
      narrative,
      timestamp: new Date().toISOString(),
    });
  }
}
