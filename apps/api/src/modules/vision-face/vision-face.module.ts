import { Module } from '@nestjs/common';
import { VisionSharedModule } from '../vision-shared/vision-shared.module';
import { VisionFaceController } from './vision-face.controller';

/**
 * US-017e: module Xem Tướng. Mỏng — chỉ controller multipart; toàn bộ gate + upload + vision LLM
 * nằm ở VisionAnalysisService (VisionSharedModule), dùng chung với Xem Tay (US-017f).
 */
@Module({
  imports: [VisionSharedModule],
  controllers: [VisionFaceController],
})
export class VisionFaceModule {}
