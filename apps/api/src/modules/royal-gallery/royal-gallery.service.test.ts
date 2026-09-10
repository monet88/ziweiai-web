import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
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
    it('không hồi sinh thẻ khi server đã có tombstone mới hơn client update', async () => {
      const userId = 'user-123';
      const tombstoneTime = '2026-09-10T14:00:00.000Z';
      const clientOldTime = '2026-09-10T12:00:00.000Z';

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
            title: 'Lá Số Cũ',
            isDeleted: false,
            createdAt: clientOldTime,
            updatedAt: clientOldTime,
          },
        ],
      };

      const result = await service.syncGallery(userId, request);

      // Upsert KHÔNG ĐƯỢC gọi đối với card-deleted-1 vì tombstone wins
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
            isDeleted: true,
            createdAt: '2026-09-10T12:00:00.000Z',
          },
        ],
      };

      await service.syncGallery(userId, request);
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('uploadCardImage', () => {
    it('tải lên file WebP hợp lệ vào bucket royal-gallery', async () => {
      const userId = 'user-abc';
      const cardId = 'card-xyz';
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46,
        0x20, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50,
      ]);

      const mockUpload = vi.fn().mockResolvedValue({ error: null });
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://signed.webp' },
        error: null,
      });

      const mockSupabase = {
        storage: {
          from: vi.fn((bucket: string) => {
            expect(bucket).toBe(GALLERY_BUCKET);
            return {
              upload: mockUpload,
              createSignedUrl: mockCreateSignedUrl,
            };
          }),
        },
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }),
      } as any;

      const service = new RoyalGalleryService(mockSupabase);
      const res = await service.uploadCardImage(userId, cardId, webpBuffer, 'image/webp');

      expect(res.storagePath).toBe(`${userId}/${cardId}.webp`);
      expect(res.signedUrl).toBe('https://signed.webp');
      expect(mockUpload).toHaveBeenCalledWith(
        `${userId}/${cardId}.webp`,
        webpBuffer,
        expect.objectContaining({ contentType: 'image/webp', upsert: true }),
      );
    });
  });
});
