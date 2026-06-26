import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { apiEnv } from '../../config/env';
import { mimeTypeToExtension } from '../../providers/ai/vision-prompt';

const VISION_BUCKET = 'vision-uploads';

/**
 * US-017e/f: tải ảnh vision (Xem Tướng/Xem Tay) lên bucket private `vision-uploads`.
 *
 * Bucket + RLS owner-only tạo ở migration 000002. Đường dẫn lưu dạng `{ownerUserId}/{requestId}.{ext}`
 * — folder đầu (= ownerUserId) khớp policy RLS `auth.uid()::text = (storage.foldername(name))[1]`.
 * Dùng service-role client (đã có ở SupabasePersistenceGateway) nên insert bỏ qua RLS; đường dẫn vẫn
 * neo theo ownerUserId để khi người dùng đọc bằng JWT thật vẫn đúng chủ sở hữu.
 *
 * Decision 0023 (override 0012): ảnh GIỮ VĨNH VIỄN để hiển thị lại trong lịch sử Xem Tướng/Xem Tay
 * (cron xoá 7 ngày đã unschedule ở migration 000009). Bucket vẫn private + RLS owner-only; client
 * KHÔNG đọc theo path mà qua signed URL ngắn hạn (createSignedImageUrl) — giảm rủi ro PII/sinh trắc.
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

  /**
   * Tạo signed URL ngắn hạn để client xem ảnh vision đã lưu (bucket private, không đọc được theo
   * path). Decision 0023: ảnh giữ vĩnh viễn nhưng vẫn private + RLS owner-only; chỉ phát URL ký
   * tạm thời khi liệt kê lịch sử. Lỗi ký (path lạ, ảnh đã xoá thủ công) → trả null, KHÔNG ném: một
   * ảnh hỏng không được làm sập cả danh sách lịch sử.
   */
  async createSignedImageUrl(imagePath: string, expiresInSeconds = 3600): Promise<string | null> {
    const { data, error } = await this.client.storage
      .from(VISION_BUCKET)
      .createSignedUrl(imagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      this.logger.warn(`[vision.storage] ký URL thất bại path=${imagePath}: ${error?.message ?? 'no signedUrl'}`);
      return null;
    }

    return data.signedUrl;
  }

  /**
   * Xoá ảnh vision khỏi Storage (quyền được quên, decision 0023). Bucket private không có cron dọn
   * nữa nên khi người dùng xoá một mục vision phải gỡ luôn file ảnh sinh trắc, không để mồ côi. Lỗi
   * xoá → ném để caller biết ảnh CHƯA bị gỡ (không nuốt: xoá ảnh sinh trắc là thao tác cần chắc chắn).
   */
  async deleteVisionImage(imagePath: string): Promise<void> {
    const { error } = await this.client.storage.from(VISION_BUCKET).remove([imagePath]);

    if (error) {
      this.logger.error(`[vision.storage] xoá ảnh thất bại path=${imagePath}: ${error.message}`);
      throw new Error(error.message);
    }
  }
}
