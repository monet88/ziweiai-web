import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { apiEnv } from '../../config/env';
import { mimeTypeToExtension } from '../../providers/ai/vision-prompt';

const VISION_BUCKET = 'vision-uploads';

/**
 * US-017e/f: tải ảnh vision (Xem Tướng/Xem Tay) lên bucket private `vision-uploads`.
 *
 * Bucket + RLS owner-only + cron xoá ảnh > 7 ngày đã tạo ở migration 000002 (decision 0012). Đường
 * dẫn lưu dạng `{ownerUserId}/{requestId}.{ext}` — folder đầu (= ownerUserId) khớp policy RLS
 * `auth.uid()::text = (storage.foldername(name))[1]`. Dùng service-role client (đã có ở
 * SupabasePersistenceGateway) nên insert bỏ qua RLS; đường dẫn vẫn neo theo ownerUserId để khi
 * người dùng đọc bằng JWT thật vẫn đúng chủ sở hữu + để cron/cleanup nhất quán.
 *
 * Chỉ giữ ảnh ngắn hạn (cron xoá 7 ngày); chỉ trả về `imagePath` (Storage path) cho kết quả, KHÔNG
 * trả ảnh gốc — giảm rủi ro PII/sinh trắc (decision 0012).
 */
@Injectable()
export class VisionStorageGateway {
  private readonly logger = new Logger(VisionStorageGateway.name);
  private readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(apiEnv.SUPABASE_URL, apiEnv.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  /**
   * Tải ảnh lên bucket; trả về Storage path đã lưu. `requestId` là UUID sinh tại đây để đường dẫn
   * duy nhất theo lượt (không đụng dedupe giữa các lần xem của cùng người dùng).
   */
  async uploadVisionImage(params: {
    ownerUserId: string;
    imageBytes: Uint8Array;
    mimeType: string;
  }): Promise<{ imagePath: string }> {
    const requestId = randomUUID();
    const extension = mimeTypeToExtension(params.mimeType);
    const imagePath = `${params.ownerUserId}/${requestId}.${extension}`;

    const { error } = await this.client.storage
      .from(VISION_BUCKET)
      .upload(imagePath, params.imageBytes, { contentType: params.mimeType, upsert: false });

    if (error) {
      this.logger.error(`[vision.storage] upload thất bại path=${imagePath}: ${error.message}`);
      throw new Error(error.message);
    }

    return { imagePath };
  }
}
