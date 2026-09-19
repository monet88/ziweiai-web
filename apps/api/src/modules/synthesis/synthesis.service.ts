import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  type AstrologicalSynthesisRequest,
  type AstrologicalSynthesisResponse,
  astrologicalSynthesisResponseSchema,
} from '@ziweiai/contracts';
import { ChartsRepository } from '../../database/repositories/charts.repository';
import { AiFeatureExecutionOrchestrator } from '../../providers/ai/ai-feature-execution.orchestrator';
import { buildSynthesisPrompt, calculateQuickLifePath } from './synthesis-prompt.builder';

interface SynthesisCacheEntry {
  response: AstrologicalSynthesisResponse;
  expiresAt: number;
}

const MAX_SYNTHESIS_CACHE_ENTRIES = 200;
const SYNTHESIS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 giờ

@Injectable()
export class SynthesisService {
  private readonly logger = new Logger(SynthesisService.name);
  // In-memory bounded cache với TTL cho synthesis theo chartId
  private readonly synthesisCache = new Map<string, SynthesisCacheEntry>();

  constructor(
    private readonly chartsRepository: ChartsRepository,
    private readonly aiOrchestrator: AiFeatureExecutionOrchestrator,
  ) {}

  private getFromCache(chartId: string): AstrologicalSynthesisResponse | null {
    const entry = this.synthesisCache.get(chartId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.synthesisCache.delete(chartId);
      return null;
    }
    return { ...entry.response, metadata: { ...entry.response.metadata, isCached: true } };
  }

  private setToCache(chartId: string, response: AstrologicalSynthesisResponse): void {
    if (this.synthesisCache.size >= MAX_SYNTHESIS_CACHE_ENTRIES) {
      const oldestKey = this.synthesisCache.keys().next().value;
      if (oldestKey) this.synthesisCache.delete(oldestKey);
    }
    this.synthesisCache.set(chartId, {
      response,
      expiresAt: Date.now() + SYNTHESIS_CACHE_TTL_MS,
    });
  }

  /**
   * Lấy kết quả luận giải tổng hợp đã có sẵn (hoặc null nếu chưa tạo)
   */
  async getExistingSynthesis(
    chartId: string,
    userId: string,
  ): Promise<AstrologicalSynthesisResponse | null> {
    const cached = this.getFromCache(chartId);
    if (cached) {
      return cached;
    }

    // Kiểm tra lá số
    const chart = await this.chartsRepository.findChartSnapshotById(userId, chartId);
    if (!chart) {
      // Thử tìm public chart
      const publicChart = await this.chartsRepository.findPublicChartSnapshotById(chartId);
      if (!publicChart) {
        throw new NotFoundException('Không tìm thấy dữ liệu lá số');
      }
    }

    return null;
  }

  /**
   * Tạo mới Đại Bản Luận Giải Tổng Hợp Tam Môn Phái
   */
  async generateSynthesis(
    request: AstrologicalSynthesisRequest,
    userId: string,
  ): Promise<AstrologicalSynthesisResponse> {
    // 1. Kiểm tra cache trước để bảo vệ quyền lợi XU của người dùng
    const cached = this.getFromCache(request.chartId);
    if (cached) {
      return cached;
    }

    // 2. Tìm snapshot lá số
    let chartRecord = await this.chartsRepository.findChartSnapshotById(userId, request.chartId);
    if (!chartRecord) {
      chartRecord = await this.chartsRepository.findPublicChartSnapshotById(request.chartId);
    }
    if (!chartRecord) {
      throw new NotFoundException(`Không tìm thấy lá số với ID: ${request.chartId}`);
    }

    const snapshot = chartRecord.snapshot;
    if (!snapshot) {
      throw new BadRequestException('Dữ liệu lá số không hợp lệ');
    }

    // 3. Build Prompt
    const { systemPrompt, userPrompt } = buildSynthesisPrompt(snapshot, request);

    // 4. Gọi AI qua Orchestrator
    this.logger.log(`Khởi tạo Luận Giải Tổng Hợp cho chartId=${request.chartId}, user=${userId}`);
    let aiRawText = '';
    try {
      const executionResult = await this.aiOrchestrator.executeFeature({
        userId,
        ipAddress: '127.0.0.1',
        isAnonymous: false,
        quotaFeatureKey: 'astrological-synthesis',
        quotaErrorMessage: 'Đã vượt hạn mức luận giải tổng hợp.',
        explanationKind: 'astrological-synthesis',
        cost: 0,
        paymentErrorMessage: 'Yêu cầu đăng nhập và có XU.',
        paymentInsufficientFundsMessage: 'Số dư XU không đủ để thực hiện luận giải tổng hợp.',
        promptOverride: `${systemPrompt}\n\n${userPrompt}`,
        generateFallback: () => '',
      });
      aiRawText = executionResult;
    } catch (err: any) {
      this.logger.warn(`AI Orchestrator thất bại khi tạo synthesis: ${err.message}. Sử dụng Fallback hoàng triều.`);
      aiRawText = '';
    }

    // 5. Parse JSON hoặc fallback
    const result = this.parseOrFallback(aiRawText, request, snapshot);

    // 6. Lưu vào cache
    this.setToCache(request.chartId, result);

    return result;
  }

  private parseOrFallback(
    rawText: string,
    request: AstrologicalSynthesisRequest,
    snapshot: any,
  ): AstrologicalSynthesisResponse {
    const birthDateStr = snapshot.birthProfile?.normalizedBirth?.solarDateString || snapshot.createdAt || '2000-01-01';
    const lifePath = calculateQuickLifePath(birthDateStr);
    const nowIso = new Date().toISOString();

    if (rawText) {
      try {
        // Làm sạch markdown codeblock ```json ... ```
        const cleaned = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        const parsed = JSON.parse(cleaned);
        const validated = astrologicalSynthesisResponseSchema.parse({
          chartId: request.chartId,
          createdAt: nowIso,
          consensusScore: typeof parsed.consensusScore === 'number' ? parsed.consensusScore : 86,
          summary: parsed.summary || 'Đại bản luận giải tổng hòa Thiên - Địa - Nhân vận số tường minh.',
          heavenAspect: parsed.heavenAspect || {
            title: 'Thiên Đạo • Tinh Tú Tử Vi Chỉ Lối',
            detail: 'Tử Vi Đẩu Số định hình khung mệnh cách, chỉ ra thiên hướng và cơ nghiệp.',
            starsSummary: ['Mệnh Cung Vững Vàng', 'Tam Hợp Sáng Sủa'],
          },
          earthAspect: parsed.earthAspect || {
            title: 'Địa Đạo • Bát Tự Ngũ Hành Vượng Suy',
            detail: 'Bát Tự xét dòng chảy ngũ hành tứ trụ, điều hòa khí lực và dụng thần.',
            elementsSummary: ['Ngũ hành cân bằng', 'Dụng thần tương trợ'],
          },
          humanAspect: parsed.humanAspect || {
            title: 'Nhân Đạo • Sóng Rung Số Đạo & Tâm Thức',
            detail: `Thần Số Học Pythagoras khai mở con số chủ đạo ${lifePath}.`,
            lifePathSummary: `Con số đường đời ${lifePath}: Khát vọng và sứ mệnh tự thân.`,
          },
          disciplines: Array.isArray(parsed.disciplines) && parsed.disciplines.length > 0 ? parsed.disciplines : [
            {
              discipline: 'ziwei',
              title: 'Tử Vi Đẩu Số',
              keyFindings: ['Khung mệnh vững chãi', 'Thế đứng tinh diệu cát lợi'],
              elementBalance: 'Tương hòa bản mệnh',
              potentialRisk: 'Chú trọng gia đạo và tài chính trung vận',
              opportunity: 'Đại hạn mở ra nhiều bước ngoặt lớn',
            },
            {
              discipline: 'bazi',
              title: 'Bát Tự Tứ Trụ',
              keyFindings: ['Khí lực can chi tương sinh', 'Tàng can hỗ trợ dụng thần'],
              elementBalance: 'Ngũ hành lưu chuyển',
              potentialRisk: 'Tránh hao tán khi gặp năm khắc chế',
              opportunity: 'Được quý nhân nâng đỡ trong công việc',
            },
            {
              discipline: 'numerology',
              title: 'Thần Số Pythagoras',
              keyFindings: [`Số chủ đạo ${lifePath}`, 'Năng lượng nội lực bền bỉ'],
              elementBalance: 'Tần số rung động tích cực',
              potentialRisk: 'Dễ cầu toàn và áp lực tinh thần',
              opportunity: 'Giai đoạn bứt phá thành tựu cá nhân',
            },
          ],
          actionableStrategy: parsed.actionableStrategy || {
            doList: ['Phát huy thế mạnh chuyên môn', 'Chủ động xây dựng quan hệ uy tín'],
            dontList: ['Hạn chế đầu cơ rủi ro cao', 'Tránh nóng nảy trong đàm phán'],
            strategicTiming: 'Nửa cuối năm là thời cơ đắc địa để bứt phá mục tiêu.',
            auspiciousElements: ['Màu sắc: Xanh Dương, Trắng', 'Hướng: Đông Bắc, Tây Nam'],
          },
          metadata: {
            generatedAt: nowIso,
            modelUsed: 'gemini-2.5-flash',
            isCached: false,
          },
        });

        return validated;
      } catch (e: any) {
        this.logger.warn(`Không thể parse JSON từ AI output, chuyển sang Fallback hoàng triều: ${e.message}`);
      }
    }

    // Static Fallback Hoàng Triều
    return {
      chartId: request.chartId,
      createdAt: nowIso,
      consensusScore: 89,
      summary: 'Khâm Thiên Giám Ngự Bút: Bản mệnh tụ hội linh khí Thiên - Địa - Nhân. Tinh bàn Tử Vi kiên cố, Bát Tự ngũ hành tương sinh, phối hợp cùng Số Đạo kiến tạo lộ trình cuộc đời hanh thông.',
      heavenAspect: {
        title: 'Thiên Đạo • Tinh Tú Tử Vi Chỉ Lối',
        detail: 'Hệ thống chính tinh và trung tinh tại Mệnh Cung định hình bản lĩnh kiên cường, có tầm nhìn chiến lược và khả năng gầy dựng sự nghiệp bền vững.',
        starsSummary: ['Chủ Mệnh Đắc Địa', 'Khoa Quyền Lộc Hội Chiếu', 'Phúc Đức Vững Chãi'],
      },
      earthAspect: {
        title: 'Địa Đạo • Bát Tự Ngũ Hành Vượng Suy',
        detail: 'Tứ trụ năm tháng ngày giờ sinh hình thành thế cân bằng, dụng thần phát huy tác dụng giải trừ các điểm xung khắc tiềm tàng trong can chi.',
        elementsSummary: ['Khí lực ngũ hành hài hòa', 'Dụng thần đắc lực', 'Hỷ thần tương trợ'],
      },
      humanAspect: {
        title: 'Nhân Đạo • Sóng Rung Số Đạo & Tâm Thức',
        detail: `Con số chủ đạo ${lifePath} phản ánh ý chí kiên định, khả năng tự chủ và khát khao tạo dựng giá trị thực tế cho cộng đồng.`,
        lifePathSummary: `Số Đạo ${lifePath}: Bản lĩnh người tiên phong và thấu triệt thời cuộc.`,
      },
      disciplines: [
        {
          discipline: 'ziwei',
          title: 'Tử Vi Đẩu Số (Thiên Thời)',
          keyFindings: ['Cung Mệnh định hướng cốt cách tôn nghiêm', 'Tài Quan song hành cát lợi'],
          elementBalance: 'Bản mệnh đồng điệu ngũ hành cục',
          potentialRisk: 'Cần chú ý giữ hòa khí trong các mối quan hệ hợp tác',
          opportunity: 'Thời vận rộng mở khi bước vào các đại hạn tương sinh',
        },
        {
          discipline: 'bazi',
          title: 'Bát Tự Tứ Trụ (Địa Lợi)',
          keyFindings: ['Tứ trụ nạp âm tương sinh', 'Tàng can nâng đỡ ngày chủ'],
          elementBalance: 'Âm dương điều hòa theo mùa sinh',
          potentialRisk: 'Lưu ý các năm có thiên can khắc chế',
          opportunity: 'Gặp gỡ quý nhân giúp khai thông các nút thắt sự nghiệp',
        },
        {
          discipline: 'numerology',
          title: 'Thần Số Pythagoras (Nhân Hòa)',
          keyFindings: [`Số đường đời ${lifePath}`, 'Nội lực và khả năng học hỏi vượt trội'],
          elementBalance: 'Rung động số học tương thích mệnh số',
          potentialRisk: 'Áp lực nội tâm khi mục tiêu đặt ra quá cao',
          opportunity: 'Khai phóng tiềm năng sáng tạo và năng lực lãnh đạo',
        },
      ],
      actionableStrategy: {
        doList: [
          'Kiên định với kế hoạch dài hạn, trau dồi tri thức cốt lõi',
          'Tích lũy tài chính có kỷ luật và mở rộng mạng lưới uy tín',
          'Lắng nghe trực giác kết hợp với phân tích dữ liệu thực tế',
        ],
        dontList: [
          'Tránh quyết định vội vàng khi tâm trạng xao động',
          'Không nên mở rộng đầu tư vào các lĩnh vực chưa am hiểu',
          'Hạn chế tranh chấp pháp lý hoặc cam kết ngoài khả năng',
        ],
        strategicTiming: 'Giai đoạn giữa năm và các tháng cuối quý là thời điểm đắc cát nhất.',
        auspiciousElements: ['Màu sắc cát tường: Vàng Hoàng Gia, Trắng, Lam Đậm', 'Phương vị vượng khí: Chính Bắc, Đông Nam'],
      },
      metadata: {
        generatedAt: nowIso,
        modelUsed: 'fallback-royal-engine',
        isCached: false,
      },
    };
  }
}
