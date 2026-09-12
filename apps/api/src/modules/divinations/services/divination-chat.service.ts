import { Injectable, Logger } from '@nestjs/common';
import {
  type AuthenticatedUser,
  type DivinationChatRequest,
  type DivinationChatResponse,
  divinationChatResponseSchema,
  type CompatibilityExplainRequest,
  type CompatibilityExplainResponse,
  compatibilityExplainResponseSchema,
  FEATURE_PRICING,
} from '@ziweiai/contracts';
import { AiFeatureExecutionOrchestrator } from '../../../providers/ai/ai-feature-execution.orchestrator';

@Injectable()
export class DivinationChatService {
  private readonly logger = new Logger(DivinationChatService.name);

  constructor(private readonly orchestrator: AiFeatureExecutionOrchestrator) {}

  async chat(
    user: AuthenticatedUser,
    ipAddress: string,
    input: DivinationChatRequest,
  ): Promise<DivinationChatResponse> {
    const isAnonymous = user.email === null;

    const prompt = `Bạn là Khâm Thiên Giám Ngự Bút — chuyên gia bói toán và vấn an số mệnh hoàng gia.
Người dùng đang có thắc mắc về chủ đề: "${input.topic || 'Vấn an chung'}".
Câu hỏi cụ thể của người dùng: "${input.question}".

Hãy đưa ra lời vấn an sâu sắc, thấu đáo, chuẩn mực thuật số phương Đông (Kinh Dịch, Âm Dương Ngũ Hành).
Phong thái điềm đạm, ngôn từ nhã nhặn, tôn trọng, mang tính định hướng tích cực và giải tỏa lo âu.
Tuyệt đối không phán xét tiêu cực cực đoan, không dùng chữ Hán thô.`;

    const answer = await this.orchestrator.executeFeature({
      userId: user.userId,
      ipAddress,
      isAnonymous,
      quotaFeatureKey: 'divination_chat',
      quotaErrorMessage: 'Bạn đã đạt giới hạn vấn an hôm nay.',
      explanationKind: 'divination_chat',
      // Phí XU đã được trừ an toàn ở tầng Controller qua RequireXU interceptor (fail-fast 402, auto refund)
      cost: 0,
      paymentErrorMessage: 'Lỗi trừ XU cho lượt vấn an Khâm Thiên Giám.',
      paymentInsufficientFundsMessage: 'Số dư không đủ (Cần 1 XU cho mỗi lượt vấn an). Vui lòng nạp thêm.',
      promptOverride: prompt,
      generateFallback: () => this.generateFallbackAnswer(input.question, input.topic),
    });

    return divinationChatResponseSchema.parse({
      answer,
      costXu: FEATURE_PRICING.CONVERSATION_MESSAGE,
    });
  }

  async explainCompatibility(
    user: AuthenticatedUser,
    ipAddress: string,
    input: CompatibilityExplainRequest,
  ): Promise<CompatibilityExplainResponse> {
    const isAnonymous = user.email === null;

    const prompt = `Bạn là Khâm Thiên Giám Ngự Bút — bậc thầy hợp hôn, mệnh lý Bát Tự lứa đôi hoàng gia.
Hãy thực hiện bài luận giải chuyên sâu về mối lương duyên giữa:
- Người thứ nhất: ${input.person1.name} (Sinh năm ${input.person1.birthYear}, ${input.person1.lunarYearCanChi || ''}, Ngũ Hành: ${input.person1.element || 'Chưa rõ'}).
- Người thứ hai: ${input.person2.name} (Sinh năm ${input.person2.birthYear}, ${input.person2.lunarYearCanChi || ''}, Ngũ Hành: ${input.person2.element || 'Chưa rõ'}).
- Điểm hòa hợp tổng quan: ${input.overallScore}/100 (${input.verdictTitle || 'Cát Tường'}).

Yêu cầu định dạng:
- Viết bài luận sâu sắc, nhã nhặn bằng tiếng Việt.
- Bố cục gồm các phần:
  1. Căn Duyên Tiền Định (Đánh giá tương hợp Can Chi, Ngũ Hành Nạp Âm).
  2. Bát Trạch & Điểm Tương Phối (Ưu thế gắn kết và những điểm xung đột cần lưu ý).
  3. Phương Pháp Hòa Hợp & Kích Hoạt Vận Khí (Lời khuyên phong thủy nhà ở, màu sắc, ứng xử để trăm năm hạnh phúc).
- Tuyệt đối không dùng chữ Hán thô.`;

    const explanation = await this.orchestrator.executeFeature({
      userId: user.userId,
      ipAddress,
      isAnonymous,
      quotaFeatureKey: 'compatibility_explain',
      quotaErrorMessage: 'Bạn đã đạt giới hạn luận giải hợp hôn hôm nay.',
      explanationKind: 'compatibility_explain',
      // Phí XU đã được trừ an toàn ở tầng Controller qua RequireXU interceptor (fail-fast 402, auto refund)
      cost: 0,
      paymentErrorMessage: 'Lỗi trừ XU cho lượt luận giải Duyên Định Cung Đình.',
      paymentInsufficientFundsMessage: 'Số dư không đủ (Cần 15 XU để thỉnh Khâm Thiên Giám luận giải hợp hôn). Vui lòng nạp thêm.',
      promptOverride: prompt,
      generateFallback: () => this.generateFallbackCompatibility(input),
    });

    return compatibilityExplainResponseSchema.parse({
      explanation,
      costXu: FEATURE_PRICING.SYNTHESIS_REPORT,
    });
  }

  private generateFallbackAnswer(_query: string, _topic?: string): string {
    return `📜 **KHÂM THIÊN GIÁM NGỰ PHÁN — TỬ VI CHIÊM BÁI**\n\n` +
      `✦ **1. Huyền Cơ Chiếu Rọi:**\n` +
      `Bản mệnh tương ứng với biến chuyển Càn Khôn. Câu hỏi của Đại Hiệp cho thấy thời vận đang bước vào giai đoạn chuyển giao năng lượng quan trọng.\n\n` +
      `✦ **2. Điểm Tựa Bản Mệnh:**\n` +
      `Nội tâm kiên định, hành sự cẩn trọng thì ắt gặt hái quả ngọt. Hãy chú trọng giữ hòa khí và trau dồi đức hạnh.\n\n` +
      `✦ **3. Ngự Ý Trao Gửi:**\n` +
      `Vạn sự hanh thông bắt nguồn từ tâm an định. Chư vị cát tinh luôn hộ trì người kiên trì chính đạo.`;
  }

  private generateFallbackCompatibility(input: CompatibilityExplainRequest): string {
    return `❤️ **KHÂM THIÊN GIÁM NGỰ BÚT — DUYÊN ĐỊNH CUNG ĐÌNH**\n\n` +
      `Phối hôn giữa ${input.person1.name} (${input.person1.birthYear}) và ${input.person2.name} (${input.person2.birthYear}) ` +
      `tạo nên cục diện "${input.verdictTitle || 'Thiên Duyên Hòa Hợp'}" với điểm số ${input.overallScore}/100.\n\n` +
      `✦ **1. Tương Hợp Nạp Âm:** Khí chất đôi bên tương sinh, dễ tìm thấy sự đồng điệu trong chí hướng và đời sống.\n\n` +
      `✦ **2. Điểm Cần Lưu Ý:** Sự thẳng thắn đôi khi vô tình gây hiểu lầm. Nên lấy sự lắng nghe và nhẫn nại làm cầu nối.\n\n` +
      `✦ **3. Phong Thủy Kích Hoạt:** Bài trí không gian sống hướng Sinh Khí, cân bằng năng lượng Âm Dương để tài lộc và gia đạo luôn hưng thịnh.`;
  }
}
