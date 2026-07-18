import { HttpStatus, Logger } from '@nestjs/common';
import { ApiErrorHttpException } from '../http/api-error';
import { apiEnv } from '../../config/env';

/**
 * Gate entitlement AI dùng chung (decision 0010).
 *
 * Trích từ `ExplanationsService.assertCanUseAiExplanation` để cả luận giải và báo cáo năm
 * (US-016) cùng dùng một nguồn — không copy logic. Cờ `AI_EXPLANATION_FREE_FOR_ALL=true`
 * (mặc định giai đoạn test) → no-op; `false` → fail-closed 402.
 */
export function assertCanUseAiExplanation(logger?: Logger): void {
  if (apiEnv.AI_EXPLANATION_FREE_FOR_ALL) {
    logger?.warn('AI_EXPLANATION_FREE_FOR_ALL=true — gate bypassed (free for all). Set false in production.');
    return;
  }
  throw new ApiErrorHttpException(
    HttpStatus.PAYMENT_REQUIRED,
    'PAYMENT_REQUIRED',
    'Tính năng luận giải AI yêu cầu gói trả phí. Vui lòng nâng cấp để tiếp tục.',
  );
}

/**
 * Gate riêng cho báo cáo năm (US-016): đường tốn token cao nên có phanh độc lập
 * `AI_ANNUAL_REPORT_ENABLED` (mặc định `false`). Annual phải qua CẢ hai gate — một
 * cờ off → vẫn 402. Cache-hit bypass gate (kết quả đã sinh thì cho xem, theo 0010).
 */
export function assertAnnualReportEnabled(logger?: Logger): void {
  if (apiEnv.AI_ANNUAL_REPORT_ENABLED) {
    return;
  }
  logger?.warn('[annual] feature locked — AI_ANNUAL_REPORT_ENABLED=false');
  throw new ApiErrorHttpException(
    HttpStatus.PAYMENT_REQUIRED,
    'PAYMENT_REQUIRED',
    'Báo cáo năm AI tạm khoá ở giai đoạn beta. Vui lòng quay lại sau.',
  );
}
