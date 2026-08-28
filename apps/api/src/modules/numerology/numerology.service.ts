import { Injectable, Logger } from '@nestjs/common';
import { type AuthenticatedUser } from '@ziweiai/contracts';
import { AiFeatureExecutionOrchestrator } from '../../providers/ai/ai-feature-execution.orchestrator';

export interface NumerologyInput {
  lifePath: number;
  destiny: number;
  soulUrge: number;
  personality: number;
  fullName: string;
}

@Injectable()
export class NumerologyService {
  private readonly logger = new Logger(NumerologyService.name);

  constructor(private readonly orchestrator: AiFeatureExecutionOrchestrator) {}

  async explainNumerology(
    user: AuthenticatedUser,
    ipAddress: string,
    input: NumerologyInput,
  ): Promise<{ narrative: string }> {
    const promptOverride = `Bạn là chuyên gia Thần Số Học (Numerology) theo trường phái Pythagoras.
Hãy luận giải chi tiết cho người có tên là "${input.fullName}".
Các chỉ số cốt lõi của họ là:
- Đường đời (Life Path): ${input.lifePath}
- Sứ mệnh (Destiny/Expression): ${input.destiny}
- Linh hồn (Soul Urge): ${input.soulUrge}
- Nhân cách (Personality): ${input.personality}

BẮT BUỘC: Viết hoàn toàn bằng tiếng Việt.
Trả về định dạng Markdown, phân tích ý nghĩa từng con số, sự kết hợp giữa các con số, điểm mạnh điểm yếu, và lời khuyên phát triển bản thân. Bài viết cần súc tích, truyền cảm hứng và sâu sắc.`;

    const narrative = await this.orchestrator.executeFeature({
      userId: user.userId,
      ipAddress,
      isAnonymous: !user.email,
      quotaFeatureKey: 'numerology-explain',
      quotaErrorMessage: 'Đã vượt hạn mức luận giải Thần Số Học.',
      explanationKind: 'numerology-reading',
      cost: 10,
      paymentErrorMessage: 'Tính năng Luận giải Thần Số Học yêu cầu đăng nhập và có XU. Vui lòng đăng nhập hoặc nạp XU.',
      paymentInsufficientFundsMessage: 'Luận giải chuyên sâu yêu cầu 10 XU. Số dư XU của bạn không đủ, vui lòng nạp thêm XU.',
      promptOverride,
      generateFallback: () =>
        `Bạn mang Đường Đời số ${input.lifePath}, Sứ mệnh số ${input.destiny}, Linh hồn số ${input.soulUrge}, và Nhân cách số ${input.personality}. Vũ trụ đang gửi đến bạn thông điệp hãy khai phá sức mạnh nội tại từ những con số này để đạt được thành công viên mãn. (Hệ thống AI hiện đang bận, vui lòng thử lại sau để xem bản phân tích chi tiết).`,
    });

    return { narrative };
  }
}
