import { Module } from '@nestjs/common';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { QuotasModule } from '../quotas/quotas.module';
import { VisionAnalysisService } from './vision-analysis.service';
import { VisionStorageGateway } from './vision-storage.gateway';

/**
 * US-017e/f: hạ tầng luận giải vision dùng chung cho Xem Tướng + Xem Tay.
 *
 * Dùng chung AiProvidersModule (một bộ provider AI cho cả explanations/fortune/vision) + storage
 * gateway + VisionAnalysisService, rồi export service cho vision-face/vision-palm cắm vào.
 */
@Module({
  imports: [QuotasModule, AiProvidersModule],
  providers: [VisionStorageGateway, VisionAnalysisService],
  exports: [VisionAnalysisService],
})
export class VisionSharedModule {}
