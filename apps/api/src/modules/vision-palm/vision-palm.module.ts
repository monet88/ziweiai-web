import { Module } from '@nestjs/common';
import { VisionSharedModule } from '../vision-shared/vision-shared.module';
import { VisionPalmController } from './vision-palm.controller';

/**
 * US-017f: module Xem Tay. Mỏng — chỉ controller multipart; toàn bộ gate + upload + vision LLM
 * nằm ở VisionAnalysisService (VisionSharedModule), dùng chung với Xem Tướng (US-017e).
 */
@Module({
  imports: [VisionSharedModule],
  controllers: [VisionPalmController],
})
export class VisionPalmModule {}
