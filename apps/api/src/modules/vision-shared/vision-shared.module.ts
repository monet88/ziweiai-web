import { Module } from '@nestjs/common';
import { DeepseekExplanationProvider } from '../../providers/ai/deepseek-explanation-provider';
import { ExplanationProviderRouter } from '../../providers/ai/explanation-provider-router';
import { GeminiExplanationProvider } from '../../providers/ai/gemini-explanation-provider';
import { OpenAiCompatibleExplanationProvider } from '../../providers/ai/openai-compatible-explanation-provider';
import { QuotasModule } from '../quotas/quotas.module';
import { VisionAnalysisService } from './vision-analysis.service';
import { VisionStorageGateway } from './vision-storage.gateway';

/**
 * US-017e/f: hạ tầng luận giải vision dùng chung cho Xem Tướng + Xem Tay.
 *
 * Gói provider AI (đăng ký riêng tại đây vì các provider chưa export thành module dùng chung) +
 * storage gateway + VisionAnalysisService, rồi export service cho vision-face/vision-palm cắm vào.
 */
@Module({
  imports: [QuotasModule],
  providers: [
    DeepseekExplanationProvider,
    OpenAiCompatibleExplanationProvider,
    GeminiExplanationProvider,
    ExplanationProviderRouter,
    VisionStorageGateway,
    VisionAnalysisService,
  ],
  exports: [VisionAnalysisService],
})
export class VisionSharedModule {}
