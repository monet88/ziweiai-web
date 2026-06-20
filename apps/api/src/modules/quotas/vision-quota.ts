import { HttpStatus } from '@nestjs/common';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { apiEnv } from '../../config/env';

// Separate vision quota method (used by face/palm modules).
// For MVP this is a simple count-based gate similar to daily chart quota.
// In a future billing integration this can be unified under assertCanUseAiExplanation with a cost factor.
export async function assertCanUseAiVisionExplanation(
  countVisionSince: (userId: string, sinceIso: string) => Promise<number>,
  userId: string,
): Promise<void> {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const sinceIso = new Date(Date.now() - ONE_DAY_MS).toISOString();
  const used = await countVisionSince(userId, sinceIso);
  if (used >= apiEnv.API_VISION_REQUESTS_PER_DAY_PER_USER) {
    throw new ApiErrorHttpException(
      HttpStatus.TOO_MANY_REQUESTS,
      'VISION_QUOTA_EXCEEDED',
      'Bạn đã dùng hết lượt phân tích hình ảnh hôm nay. Vui lòng thử lại vào ngày mai.',
    );
  }
}
