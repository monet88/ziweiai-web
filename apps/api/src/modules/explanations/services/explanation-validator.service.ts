import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiErrorHttpException } from '../../../common/http/api-error';
import { isZiweiChartSnapshot, type CreateExplanationRequest } from '@ziweiai/contracts';

@Injectable()
export class ExplanationValidatorService {
  validateSnapshot(chartRecord: any, input: CreateExplanationRequest): void {
    if (!chartRecord) {
      throw new ApiErrorHttpException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Không tìm thấy lá số đã lưu.');
    }

    if (chartRecord.snapshot.calculationConfidence?.blocksExactReading) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        'Chưa thể tạo luận giải AI vì dữ liệu lá số/quẻ chưa đủ tin cậy. Vui lòng tạo lại với dữ liệu đầy đủ trước khi luận giải.',
      );
    }

    // Early validation palaceScope vs snapshot (P1 fix từ review PR #5)
    if (input.palaceScope) {
      const snap = chartRecord.snapshot;
      if (!isZiweiChartSnapshot(snap)) {
        throw new ApiErrorHttpException(
          HttpStatus.BAD_REQUEST,
          'INVALID_INPUT',
          'palaceScope chỉ áp dụng cho lá số Tử Vi Đẩu Số.'
        );
      }

      if (input.palaceScope === 'decadal' || input.palaceScope === 'yearly') {
        if (!snap.horoscope || !snap.horoscope[input.palaceScope]) {
          throw new ApiErrorHttpException(
            HttpStatus.BAD_REQUEST,
            'INVALID_INPUT',
            `Không tìm thấy dữ liệu cho palaceScope: ${input.palaceScope}`
          );
        }
      } else {
        // 12 cung: kiểm tra theo nameKey
        const palaceExists = Array.isArray(snap.palaces) &&
          snap.palaces.some((p: { nameKey?: unknown }) => {
            if (!p) return false;
            if (p.nameKey === input.palaceScope) return true;
            if (typeof p.nameKey === 'string' && p.nameKey.startsWith('legacyPalace')) return true;
            return false;
          });
        if (!palaceExists) {
          throw new ApiErrorHttpException(
            HttpStatus.BAD_REQUEST,
            'INVALID_INPUT',
            `Không tìm thấy dữ liệu cho palaceScope: ${input.palaceScope}`
          );
        }
      }
    }
  }
}
