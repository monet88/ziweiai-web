import { Inject, Injectable, Logger } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import {
  type RoyalGalleryListResponse,
  type RoyalGalleryShareRecord,
  type SyncRoyalGalleryRequest,
  type SyncRoyalGalleryResponse,
} from '@ziweiai/contracts';
import { SUPABASE_CLIENT } from '../../database/supabase-client';

const GALLERY_BUCKET = 'vision-uploads'; // Tận dụng bucket private có sẵn từ migration 000002

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
   * 1. Áp dụng các thay đổi từ client (bao gồm cả đánh dấu deleted_at cho các item bị xóa).
   * 2. Truy vấn các thay đổi mới hơn lastSyncedAt từ server.
   * 3. Trả về serverItems (được ký Signed URL), deletedIds, và mốc syncedAt.
   */
  async syncGallery(
    userId: string,
    request: SyncRoyalGalleryRequest,
  ): Promise<SyncRoyalGalleryResponse> {
    const now = new Date().toISOString();
    const clientItems = request.items || [];

    // 1. Ghi nhận các item từ client
    for (const item of clientItems) {
      if (item.isDeleted) {
        // Đánh dấu soft-delete (tombstone)
        await this.supabase
          .from('royal_gallery_shares')
          .update({ deleted_at: now, updated_at: now })
          .eq('id', item.id)
          .eq('owner_user_id', userId);
      } else {
        // Upsert bản ghi thiệp
        await this.supabase
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
      }
    }

    // 2. Lấy dữ liệu từ server
    let query = this.supabase
      .from('royal_gallery_shares')
      .select('*')
      .eq('owner_user_id', userId);

    if (request.lastSyncedAt) {
      query = query.gt('updated_at', request.lastSyncedAt);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      this.logger.error(`[gallery] syncGallery query lỗi: ${error.message}`);
      throw new Error(error.message);
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
   */
  async uploadCardImage(
    userId: string,
    cardId: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<{ storagePath: string; signedUrl: string | null }> {
    const ext = contentType.includes('png') ? 'png' : 'webp';
    const storagePath = `royal-gallery/${userId}/${cardId}.${ext}`;

    const { error } = await this.supabase.storage
      .from(GALLERY_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      this.logger.error(`[gallery] Upload card image thất bại (cardId=${cardId}): ${error.message}`);
      throw new Error(`Storage upload error: ${error.message}`);
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
      const { data, error } = await this.supabase.storage
        .from(GALLERY_BUCKET)
        .createSignedUrl(storagePath, 3600); // 1 giờ

      if (error || !data?.signedUrl) {
        return null;
      }
      return data.signedUrl;
    } catch {
      return null;
    }
  }
}
