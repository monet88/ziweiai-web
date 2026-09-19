import { HttpStatus } from '@nestjs/common';
import { ApiErrorHttpException } from '../http/api-error';

export function assertChartSnapshotEligibleForAi(
  snapshot: { calculationConfidence?: { blocksExactReading?: boolean } } | null | undefined,
): void {
  if (snapshot?.calculationConfidence?.blocksExactReading) {
    throw new ApiErrorHttpException(
      HttpStatus.BAD_REQUEST,
      'INVALID_INPUT',
      'Chưa thể tạo luận giải hoặc hỏi đáp AI vì dữ liệu lá số/quẻ chưa đủ độ tin cậy. Vui lòng kiểm tra lại giờ sinh.',
    );
  }
}
