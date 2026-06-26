import { Module } from '@nestjs/common';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { DatabaseModule } from '../../database/database.module';
import { QuotasModule } from '../quotas/quotas.module';
import { VisionAnalysisService } from './vision-analysis.service';
import { VisionStorageGateway } from './vision-storage.gateway';
import { VisionController } from './vision.controller';

/**
 * US-017e/f: hạ tầng luận giải vision dùng chung cho Xem Tướng + Xem Tay.
 *
 * Dùng chung AiProvidersModule (một bộ provider AI cho cả explanations/fortune/vision) + storage
 * gateway + VisionAnalysisService, rồi export service cho vision-face/vision-palm cắm vào.
 *
 * VisionController (DELETE /vision/results/:id, decision 0023 — quyền được quên) sống ở module
 * dùng chung này vì xoá theo vision result id là kind-agnostic (không thuộc face/palm riêng).
 */
@Module({
  imports: [QuotasModule, AiProvidersModule, DatabaseModule],
  controllers: [VisionController],
  providers: [VisionStorageGateway, VisionAnalysisService],
  exports: [VisionAnalysisService, VisionStorageGateway],
})
export class VisionSharedModule {}
