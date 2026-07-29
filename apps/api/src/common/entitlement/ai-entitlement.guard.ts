import { HttpStatus, Logger } from '@nestjs/common';
import { ApiErrorHttpException } from '../http/api-error';
import { apiEnv } from '../../config/env';


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
    HttpStatus.FORBIDDEN,
    'FORBIDDEN',
    'Báo cáo năm AI tạm khoá ở giai đoạn beta. Vui lòng quay lại sau.',
  );
}
