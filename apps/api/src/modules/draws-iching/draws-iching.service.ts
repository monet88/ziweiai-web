import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser, IChingDraw, IChingHexagram, IChingLineValue, ichingDrawSchema } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { AiFeatureExecutionOrchestrator } from '../../providers/ai/ai-feature-execution.orchestrator';
import { IChingGroundingAdapter, HEXAGRAM_NAMES_VI } from './adapters/iching-grounding.adapter';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import type { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DrawsIchingService {
  private readonly logger = new Logger(DrawsIchingService.name);

  constructor(
    private readonly orchestrator: AiFeatureExecutionOrchestrator,
    private readonly groundingAdapter: IChingGroundingAdapter,
    @Inject(SUPABASE_CLIENT) private readonly supabaseClient: SupabaseClient,
  ) {}

  async drawIChing(
    user: AuthenticatedUser,
    ipAddress: string,
    question: string,
    castArray?: number[],
  ): Promise<IChingDraw> {
    const normalizedQuestion = question.trim();
    if (!normalizedQuestion) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        'Câu hỏi không được để trống.',
      );
    }

    if (!castArray || castArray.length !== 6) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        'Mảng gieo quẻ (cast_array) phải chứa đúng 6 hào.',
      );
    }

    const lines = castArray;
    const changingLines = lines
      .map((line, index) => (line === 6 || line === 9 ? index : -1))
      .filter((index) => index !== -1);

    // 2. Xác định Quẻ Chủ
    const baseBinary = lines.map((l) => (l === 7 || l === 9 ? 1 : 0)); // Dương = 1, Âm = 0
    const baseId = this.getHexagramIdByBinary(baseBinary);
    const baseHexagram: IChingHexagram = {
      id: baseId.toString(),
      name: HEXAGRAM_NAMES_VI[baseId - 1] || `Quẻ số ${baseId}`,
      lines: lines as [IChingLineValue, IChingLineValue, IChingLineValue, IChingLineValue, IChingLineValue, IChingLineValue],
    };

    // 3. Xác định Quẻ Biến (nếu có hào động)
    let changedHexagram: IChingHexagram | undefined;
    if (changingLines.length > 0) {
      const changedLines = lines.map((l) => {
        if (l === 6) return 7; // Lão Âm -> Thiếu Dương
        if (l === 9) return 8; // Lão Dương -> Thiếu Âm
        return l;
      });
      const changedBinary = changedLines.map((l) => (l === 7 || l === 9 ? 1 : 0));
      const changedId = this.getHexagramIdByBinary(changedBinary);
      changedHexagram = {
        id: changedId.toString(),
        name: HEXAGRAM_NAMES_VI[changedId - 1] || `Quẻ số ${changedId}`,
        lines: changedLines as [IChingLineValue, IChingLineValue, IChingLineValue, IChingLineValue, IChingLineValue, IChingLineValue],
      };
    }

    // 4. Grounding & Orchestrator
    const promptOverride = await this.groundingAdapter.getGroundingContext({
      question: normalizedQuestion,
      baseHexagram,
      changedHexagram,
      changingLines,
    });

    const narrative = await this.orchestrator.executeFeature({
      userId: user.userId,
      ipAddress,
      isAnonymous: !user.email,
      quotaFeatureKey: 'iching-draw',
      quotaErrorMessage: 'Đã vượt hạn mức gieo quẻ Kinh Dịch.',
      explanationKind: 'iching-reading',
      cost: 5, // Chi phí gieo quẻ là 5 XU
      paymentErrorMessage: 'Tính năng Kinh Dịch yêu cầu đăng nhập và có XU.',
      paymentInsufficientFundsMessage: 'Tính năng Kinh Dịch yêu cầu 5 XU. Số dư không đủ.',
      promptOverride,
      generateFallback: () => `Quẻ Chủ: ${baseHexagram.name}. ${changedHexagram ? 'Quẻ Biến: ' + changedHexagram.name : 'Không có hào động'}. (Hệ thống AI hiện đang bận, vui lòng thử lại sau để xem chi tiết luận giải).`,
    });

    // 5. Lưu kết quả vào CSDL thông qua Supabase Service Role
    try {
      const { error: dbError } = await this.supabaseClient
        .from('iching_draws')
        .insert({
          owner_user_id: user.userId,
          question: normalizedQuestion,
          cast_array: castArray,
          primary_hexagram_id: baseId,
          changed_hexagram_id: changedHexagram ? parseInt(changedHexagram.id) : null,
          ai_report: narrative,
        });

      if (dbError) {
        this.logger.error(`Lỗi khi lưu kết quả gieo quẻ vào DB: ${dbError.message}`);
      }
    } catch (e) {
      this.logger.error(`Exception khi lưu kết quả gieo quẻ vào DB:`, e);
    }

    return ichingDrawSchema.parse({
      question: normalizedQuestion,
      baseHexagram,
      changedHexagram,
      changingLines,
      narrative,
      cast_array: castArray,
    });
  }

  // Tạm mapping cơ bản, thực tế cần bảng tra đúng 64 quẻ theo Văn Vương
  private getHexagramIdByBinary(binary: number[]): number {
    const binaryStr = binary.join('');
    
    // Theo King Wen sequence (Văn Vương): Mảng 6 bit biểu diễn từ hào Sơ -> hào Thượng. 
    // Trong Kinh Dịch, quẻ được đọc từ dưới lên trên, index 0 của mảng là hào 1 (Sơ hào).
    // Ở đây ta sử dụng bảng map nhị phân sang ID quẻ (từ 1 đến 64). 
    const table: Record<string, number> = {
      '111111': 1,  '000000': 2,  '100010': 3,  '010001': 4,  '111010': 5,  '010111': 6,
      '010000': 7,  '000010': 8,  '111011': 9,  '110111': 10, '111000': 11, '000111': 12,
      '101111': 13, '111101': 14, '001000': 15, '000100': 16, '100110': 17, '011001': 18,
      '110000': 19, '000011': 20, '100101': 21, '101001': 22, '000001': 23, '100000': 24,
      '100111': 25, '111001': 26, '100001': 27, '011110': 28, '010010': 29, '101101': 30,
      '001110': 31, '011100': 32, '001111': 33, '111100': 34, '000101': 35, '101000': 36,
      '101011': 37, '110101': 38, '001010': 39, '010100': 40, '110001': 41, '100011': 42,
      '111110': 43, '011111': 44, '000110': 45, '011000': 46, '010110': 47, '011010': 48,
      '101110': 49, '011101': 50, '100100': 51, '001001': 52, '001011': 53, '110100': 54,
      '101100': 55, '001101': 56, '011011': 57, '110110': 58, '010011': 59, '110010': 60,
      '110011': 61, '001100': 62, '101010': 63, '010101': 64
    };
    
    return table[binaryStr] || 1; // Fallback
  }
}
