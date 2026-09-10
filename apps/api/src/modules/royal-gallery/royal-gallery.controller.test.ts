import { describe, expect, it, vi } from 'vitest';
import { RoyalGalleryController } from './royal-gallery.controller';
import { RoyalGalleryProGuard } from './royal-gallery.guard';

describe('RoyalGalleryController & Guard', () => {
  const mockService = {
    listShares: vi.fn().mockResolvedValue([
      {
        id: 'test-card-1',
        ownerUserId: '11111111-1111-4111-8111-111111111111',
        cardType: 'ziwei',
        title: 'Lá Số Hoàng Triều',
        aspectRatio: 'standard',
        createdAt: '2026-09-10T12:00:00.000Z',
        imageUrl: 'https://example.com/signed-url',
      },
    ]),
    syncGallery: vi.fn().mockResolvedValue({
      serverItems: [],
      deletedIds: [],
      syncedAt: '2026-09-10T12:00:00.000Z',
    }),
    uploadCardImage: vi.fn().mockResolvedValue({
      storagePath: 'royal-gallery/1111/card-1.png',
      signedUrl: 'https://example.com/signed.png',
    }),
    deleteShare: vi.fn().mockResolvedValue(undefined),
  };

  const controller = new RoyalGalleryController(mockService as any);

  it('listGallery trả về danh sách thiệp đã ký URL', async () => {
    const user = { userId: '11111111-1111-4111-8111-111111111111', email: 'vip@user.com' };
    const res = await controller.listGallery(user, 50);
    expect(res.items).toHaveLength(1);
    expect(mockService.listShares).toHaveBeenCalledWith(user.userId, 50);
  });

  it('syncGallery gọi đúng service với body', async () => {
    const user = { userId: '11111111-1111-4111-8111-111111111111', email: 'vip@user.com' };
    const body = { lastSyncedAt: null, items: [] };
    const res = await controller.syncGallery(user, body);
    expect(res.syncedAt).toBeDefined();
    expect(mockService.syncGallery).toHaveBeenCalledWith(user.userId, body);
  });

  it('deleteShare gọi đúng service với cardId', async () => {
    const user = { userId: '11111111-1111-4111-8111-111111111111', email: 'vip@user.com' };
    const res = await controller.deleteShare(user, 'card-1');
    expect(res.success).toBe(true);
    expect(mockService.deleteShare).toHaveBeenCalledWith(user.userId, 'card-1');
  });

  describe('RoyalGalleryProGuard', () => {
    const guard = new RoyalGalleryProGuard();

    it('từ chối khi không có user hoặc không có email (anonymous)', () => {
      const mockContextAnon = {
        switchToHttp: () => ({
          getRequest: () => ({
            authenticatedUser: { userId: 'anon-1', email: null },
          }),
        }),
      } as any;

      expect(() => guard.canActivate(mockContextAnon)).toThrowError();
    });

    it('cho phép khi có email danh tính đầy đủ', () => {
      const mockContextPro = {
        switchToHttp: () => ({
          getRequest: () => ({
            authenticatedUser: { userId: 'vip-1', email: 'pro@royalty.vn' },
          }),
        }),
      } as any;

      expect(guard.canActivate(mockContextPro)).toBe(true);
    });
  });
});
