import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import {
  type RoyalGalleryListResponse,
  type RoyalGalleryShareRecord,
  type SyncRoyalGalleryRequest,
  type SyncRoyalGalleryResponse,
} from '@ziweiai/contracts';
import { SUPABASE_CLIENT } from '../../database/supabase-client';

export const GALLERY_BUCKET = 'royal-gallery';

/**
 * Kiểm tra Magic Bytes nhị phân của ảnh (PNG hoặc WebP)
 */
export function validateImageMagicBytes(buffer: Buffer): { format: 'png' | 'webp'; mimeType: string } {
  if (!buffer || buffer.length < 12) {
    throw new BadRequestException('Dữ liệu tệp ảnh không hợp lệ hoặc quá ngắn');
  }

  // PNG: 89 50 4E 47
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;

  // WebP: RIFF .... WEBP
  const isWebp =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  if (isWebp) {
    return { format: 'webp', mimeType: 'image/webp' };
  }
  if (isPng) {
    return { format: 'png', mimeType: 'image/png' };
  }

  throw new BadRequestException('Định dạng ảnh không được hỗ trợ. Chỉ chấp nhận ảnh WebP hoặc PNG chuẩn.');
}

@Injectable()
export class RoyalGalleryService {
  private readonly logger = new Logger(RoyalGalleryService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  /**
   * Lấy danh sách thiệp đang hoạt động của người dùng (hỗ trợ phân trang offset & limit)
   */
  async listShares(
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<RoyalGalleryListResponse> {
    // 1. Đếm tổng số lượng bản ghi chưa bị xóa
    const { count, error: countErr } = await this.supabase
      .from('royal_gallery_shares')
      .select('*', { count: 'exact', head: true })
      .eq('owner_user_id', userId)
      .is('deleted_at', null);

    if (countErr) {
      this.logger.error(`[gallery] listShares count lỗi (userId=${userId}): ${countErr.message}`);
    }

    const total = count ?? 0;

    // 2. Lấy trang dữ liệu theo khoảng offset -> offset + limit - 1
    const { data, error } = await this.supabase
      .from('royal_gallery_shares')
      .select('*')
      .eq('owner_user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error(`[gallery] listShares lỗi (userId=${userId}): ${error.message}`);
      throw new Error(`Database error: ${error.message}`);
    }

    const items = await this.mapAndSignRecords(data || []);
    const hasMore = offset + items.length < total;

    return { items, total, hasMore };
  }

  /**
   * Đồng bộ hai chiều Delta Sync:
   * 1. Áp dụng các thay đổi từ client (tombstone mới hơn luôn thắng).
   * 2. Truy vấn các thay đổi mới hơn lastSyncedAt từ server.
   * 3. Trả về serverItems (được ký Signed URL), deletedIds, và mốc syncedAt.
   */
  async syncGallery(
    userId: string,
    request: SyncRoyalGalleryRequest,
  ): Promise<SyncRoyalGalleryResponse> {
    const now = new Date().toISOString();
    const clientItems = request.items || [];

    // 1. Đọc trước trạng thái hiện có của các item trên server để giải quyết xung đột (conflict resolution)
    const itemIds = clientItems.map((i) => i.id).filter(Boolean);
    const existingMap = new Map<string, any>();
    if (itemIds.length > 0) {
      const { data: existingRows, error: fetchErr } = await this.supabase
        .from('royal_gallery_shares')
        .select('id, updated_at, deleted_at')
        .eq('owner_user_id', userId)
        .in('id', itemIds);

      if (fetchErr) {
        this.logger.error(`[gallery] syncGallery fetch existing rows error: ${fetchErr.message}`);
        throw new Error(`Database error: ${fetchErr.message}`);
      }

      for (const row of existingRows || []) {
        existingMap.set(row.id, row);
      }
    }

    // 2. Ghi nhận các item từ client
    for (const item of clientItems) {
      const existing = existingMap.get(item.id);

      if (item.isDeleted) {
        // Đánh dấu soft-delete (tombstone)
        const { error: delErr } = await this.supabase
          .from('royal_gallery_shares')
          .update({ deleted_at: now, updated_at: now })
          .eq('id', item.id)
          .eq('owner_user_id', userId);

        if (delErr) {
          this.logger.error(`[gallery] syncGallery soft-delete error (id=${item.id}): ${delErr.message}`);
          throw new Error(`Database error: ${delErr.message}`);
        }
      } else {
        // KIỂM TRA CHỐNG HỒI SINH THẺ (Anti-Tombstone Resurrection):
        // Nếu trên server thẻ này đã bị xóa (deleted_at != null):
        if (existing && existing.deleted_at != null) {
          const clientTime = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
          const tombstoneTime = new Date(existing.deleted_at).getTime();

          // Nếu client không có updatedAt hoặc updatedAt cũ hơn hoặc bằng tombstone: Tombstone WINS!
          if (clientTime <= tombstoneTime) {
            this.logger.log(`[gallery] Bỏ qua client active update vì server đã có tombstone mới hơn (id=${item.id})`);
            continue; // Bỏ qua, không hồi sinh thẻ!
          }
        }

        // Upsert bản ghi thiệp
        const { error: upsertErr } = await this.supabase
          .from('royal_gallery_shares')
          .upsert(
            {
              id: item.id,
              owner_user_id: userId,
              card_type: item.cardType,
              title: item.title,
              subtitle: item.subtitle ?? null,
              aspect_ratio: item.aspectRatio ?? 'standard',
              custom_seal_name: item.customSealName ?? null,
              storage_path: item.storagePath ?? null,
              image_path: item.imagePath ?? null,
              payload: item.payload ?? {},
              created_at: item.createdAt,
              updated_at: now,
              deleted_at: null,
            },
            { onConflict: 'id' },
          );

        if (upsertErr) {
          this.logger.error(`[gallery] syncGallery upsert error (id=${item.id}): ${upsertErr.message}`);
          throw new Error(`Database error: ${upsertErr.message}`);
        }
      }
    }

    // 3. Lấy dữ liệu thay đổi từ server
    let query = this.supabase
      .from('royal_gallery_shares')
      .select('*')
      .eq('owner_user_id', userId);

    if (request.lastSyncedAt) {
      query = query.gt('updated_at', request.lastSyncedAt);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      this.logger.error(`[gallery] syncGallery query server items error: ${error.message}`);
      throw new Error(`Database error: ${error.message}`);
    }

    const activeRows: any[] = [];
    const deletedIds: string[] = [];

    for (const row of data || []) {
      if (row.deleted_at) {
        deletedIds.push(row.id);
      } else {
        activeRows.push(row);
      }
    }

    const serverItems = await this.mapAndSignRecords(activeRows);

    return {
      serverItems,
      deletedIds,
      syncedAt: now,
    };
  }

  /**
   * Upload file ảnh binary thiệp hoàng triều lên Supabase Storage
   * Kiểm tra Magic Bytes nhị phân thực tế để chống giả mạo định dạng
   */
  async uploadCardImage(
    userId: string,
    cardId: string,
    fileBuffer: Buffer,
    _declaredContentType: string,
  ): Promise<{ storagePath: string; signedUrl: string | null }> {
    // 1. Kiểm tra Magic Bytes nhị phân thực tế của tệp
    const { format, mimeType } = validateImageMagicBytes(fileBuffer);
    const storagePath = `${userId}/${cardId}.${format}`;

    // 2. Upload file nhị phân lên bucket royal-gallery
    const { error: uploadError } = await this.supabase.storage
      .from(GALLERY_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      this.logger.error(`[gallery] Upload card image thất bại (cardId=${cardId}): ${uploadError.message}`);
      throw new Error(`Storage upload error: ${uploadError.message}`);
    }

    // 3. Cập nhật storage_path vào bản ghi nếu thẻ đã có sẵn
    const { error: updateError } = await this.supabase
      .from('royal_gallery_shares')
      .update({
        storage_path: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .eq('owner_user_id', userId);

    if (updateError) {
      this.logger.warn(`[gallery] Cập nhật storage_path trong DB thẻ ${cardId}: ${updateError.message}`);
    }

    const signedUrl = await this.signSinglePath(storagePath);
    return { storagePath, signedUrl };
  }

  /**
   * Soft-delete một thiệp theo ID
   */
  async deleteShare(userId: string, cardId: string): Promise<void> {
    const { error } = await this.supabase
      .from('royal_gallery_shares')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', cardId)
      .eq('owner_user_id', userId);

    if (error) {
      this.logger.error(`[gallery] deleteShare thất bại (cardId=${cardId}): ${error.message}`);
      throw new Error(error.message);
    }
  }

  /**
   * Helper ký Signed URL cho danh sách bản ghi
   */
  private async mapAndSignRecords(rows: any[]): Promise<RoyalGalleryShareRecord[]> {
    return Promise.all(
      rows.map(async (row) => {
        let signedUrl: string | null = row.image_url ?? null;

        if (row.storage_path) {
          const generated = await this.signSinglePath(row.storage_path);
          if (generated) {
            signedUrl = generated;
          }
        }

        return {
          id: row.id,
          ownerUserId: row.owner_user_id,
          cardType: row.card_type,
          title: row.title,
          subtitle: row.subtitle ?? null,
          aspectRatio: row.aspect_ratio ?? 'standard',
          customSealName: row.custom_seal_name ?? null,
          storagePath: row.storage_path ?? null,
          imagePath: row.image_path ?? null,
          imageUrl: signedUrl,
          payload: row.payload ?? {},
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          deletedAt: row.deleted_at ?? null,
        };
      }),
    );
  }

  private async signSinglePath(storagePath: string): Promise<string | null> {
    try {
      // Hỗ trợ backwards compatibility: nếu path cũ lưu từ vision-uploads (royal-gallery/...)
      const bucket = storagePath.startsWith('royal-gallery/') ? 'vision-uploads' : GALLERY_BUCKET;
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, 3600); // 1 giờ

      if (error) {
        this.logger.warn(`[gallery] Tạo signed URL thất bại (path=${storagePath}): ${error.message}`);
        return null;
      }
      return data.signedUrl;
    } catch {
      return null;
    }
  }
}
