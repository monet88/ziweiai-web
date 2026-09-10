import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RoyalGalleryService, validateImageMagicBytes, GALLERY_BUCKET } from './royal-gallery.service';

describe('RoyalGalleryService & Image Validation', () => {
  describe('validateImageMagicBytes', () => {
    it('nhận diện chính xác file PNG hợp lệ', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const res = validateImageMagicBytes(pngBuffer);
      expect(res.format).toBe('png');
      expect(res.mimeType).toBe('image/png');
    });

    it('nhận diện chính xác file WebP hợp lệ', () => {
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x20, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50, // WEBP
      ]);
      const res = validateImageMagicBytes(webpBuffer);
      expect(res.format).toBe('webp');
      expect(res.mimeType).toBe('image/webp');
    });

    it('từ chối dữ liệu ngắn hoặc sai magic bytes', () => {
      expect(() => validateImageMagicBytes(Buffer.from([1, 2, 3]))).toThrow(BadRequestException);
      expect(() => validateImageMagicBytes(Buffer.from('this is not an image binary data!'))).toThrow(BadRequestException);
    });
  });

  describe('syncGallery Anti-Resurrection Logic', () => {
    it('không bao giờ hồi sinh thẻ khi server đã có tombstone, kể cả khi client gửi timestamp tương lai (Strict Tombstone Precedence)', async () => {
      const userId = 'user-123';
      const tombstoneTime = '2026-09-10T14:00:00.000Z';
      const clientFutureTime = '2035-01-01T00:00:00.000Z'; // Client clock lệch hoặc cố tình gửi tương lai

      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'royal_gallery_shares') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: 'card-deleted-1',
                        updated_at: tombstoneTime,
                        deleted_at: tombstoneTime,
                      },
                    ],
                    error: null,
                  }),
                  gt: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
              upsert: mockUpsert,
              update: mockUpdate,
            };
          }
          return {} as any;
        }),
        storage: {
          from: vi.fn().mockReturnValue({
            createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.url' }, error: null }),
          }),
        },
      } as any;

      const service = new RoyalGalleryService(mockSupabase);

      const request = {
        items: [
          {
            id: 'card-deleted-1',
            cardType: 'ziwei' as const,
            title: 'Lá Số Cũ Giả Mạo Timestamp',
            aspectRatio: 'standard' as const,
            payload: {},
            isDeleted: false,
            createdAt: clientFutureTime,
            updatedAt: clientFutureTime,
          },
        ],
      };

      const result = await service.syncGallery(userId, request);

      // Upsert TUYỆT ĐỐI KHÔNG ĐƯỢC gọi vì Server Tombstone WINS
      expect(mockUpsert).not.toHaveBeenCalled();
      expect(result.syncedAt).toBeDefined();
    });

    it('ghi nhận soft-delete khi client gửi isDeleted: true', async () => {
      const userId = 'user-123';
      const mockEq2 = vi.fn().mockResolvedValue({ error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 });

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
          update: mockUpdate,
          upsert: vi.fn().mockResolvedValue({ error: null }),
        })),
        storage: {
          from: vi.fn().mockReturnValue({
            createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.url' }, error: null }),
          }),
        },
      } as any;

      const service = new RoyalGalleryService(mockSupabase);

      const request = {
        items: [
          {
            id: 'card-to-delete',
            cardType: 'tarot' as const,
            title: 'Thẻ Cần Xóa',
            aspectRatio: 'standard' as const,
            payload: {},
            isDeleted: true,
            createdAt: '2026-09-10T12:00:00.000Z',
          },
        ],
      };

      await service.syncGallery(userId, request);
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('uploadCardImage - Validation & Compensation', () => {
    const validWebpBuffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46,
      0x20, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50,
    ]);

    it('ném NotFoundException nếu thẻ không tồn tại trong DB', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      } as any;

      const service = new RoyalGalleryService(mockSupabase);
      await expect(
        service.uploadCardImage('user-1', 'non-existent-card', validWebpBuffer, 'image/webp'),
      ).rejects.toThrow(NotFoundException);
    });

    it('ném NotFoundException nếu thẻ đã bị soft-deleted', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'card-deleted', deleted_at: '2026-09-10T10:00:00.000Z' },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any;

      const service = new RoyalGalleryService(mockSupabase);
      await expect(
        service.uploadCardImage('user-1', 'card-deleted', validWebpBuffer, 'image/webp'),
      ).rejects.toThrow(NotFoundException);
    });

    it('thực hiện compensation xóa storage nếu cập nhật database thất bại', async () => {
      const userId = 'user-comp';
      const cardId = 'card-comp';
      const mockRemove = vi.fn().mockResolvedValue({ error: null });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: cardId, storage_path: null, deleted_at: null },
                  error: null,
                }),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: null,
                      error: { message: 'DB connection broke during update' },
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
        storage: {
          from: vi.fn().mockReturnValue({
            upload: vi.fn().mockResolvedValue({ error: null }),
            remove: mockRemove,
          }),
        },
      } as any;

      const service = new RoyalGalleryService(mockSupabase);
      await expect(
        service.uploadCardImage(userId, cardId, validWebpBuffer, 'image/webp'),
      ).rejects.toThrow(/Cập nhật thông tin thiệp thất bại/);

      // Verify compensation action: storage.remove was called with the newly uploaded versioned path
      expect(mockRemove).toHaveBeenCalledWith([expect.stringMatching(new RegExp(`^${userId}/${cardId}_\\d+\\.webp$`))]);
    });

    it('không làm mất ảnh cũ nếu cập nhật ảnh mới bị lỗi DB (safe overwrite compensation)', async () => {
      const userId = 'user-safe';
      const cardId = 'card-safe';
      const oldPath = `${userId}/${cardId}_old.webp`;
      const mockRemove = vi.fn().mockResolvedValue({ error: null });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: cardId, storage_path: oldPath, deleted_at: null },
                  error: null,
                }),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: null,
                      error: { message: 'Simulated DB failure on overwrite' },
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
        storage: {
          from: vi.fn().mockReturnValue({
            upload: vi.fn().mockResolvedValue({ error: null }),
            remove: mockRemove,
          }),
        },
      } as any;

      const service = new RoyalGalleryService(mockSupabase);
      await expect(
        service.uploadCardImage(userId, cardId, validWebpBuffer, 'image/webp'),
      ).rejects.toThrow(/Cập nhật thông tin thiệp thất bại/);

      // Verify: remove() was called ONLY for the newly uploaded file, NOT the old path!
      expect(mockRemove).toHaveBeenCalledTimes(1);
      expect(mockRemove).not.toHaveBeenCalledWith([oldPath]);
    });

    it('tải lên thành công khi thẻ hợp lệ và cập nhật DB thành công, dọn dẹp ảnh cũ nếu có', async () => {
      const userId = 'user-ok';
      const cardId = 'card-ok';
      const oldPath = `${userId}/${cardId}_legacy.webp`;
      const mockUpload = vi.fn().mockResolvedValue({ error: null });
      const mockRemove = vi.fn().mockResolvedValue({ error: null });
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://signed.webp' },
        error: null,
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: cardId, storage_path: oldPath, deleted_at: null },
                  error: null,
                }),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { id: cardId, storage_path: 'new-path' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
        storage: {
          from: vi.fn((bucket: string) => {
            expect(bucket).toBe(GALLERY_BUCKET);
            return {
              upload: mockUpload,
              remove: mockRemove,
              createSignedUrl: mockCreateSignedUrl,
            };
          }),
        },
      } as any;

      const service = new RoyalGalleryService(mockSupabase);
      const res = await service.uploadCardImage(userId, cardId, validWebpBuffer, 'image/webp');

      expect(res.storagePath).toMatch(new RegExp(`^${userId}/${cardId}_\\d+\\.webp$`));
      expect(res.signedUrl).toBe('https://signed.webp');
      expect(mockUpload).toHaveBeenCalled();
      // Old path was cleaned up on success!
      expect(mockRemove).toHaveBeenCalledWith([oldPath]);
    });
  });
});
