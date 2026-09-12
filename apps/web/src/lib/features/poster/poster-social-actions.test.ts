import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildShareUrl,
  openFacebookShare,
  openZaloShare,
  openTelegramShare,
  copyToClipboard,
} from './poster-social-actions';

describe('poster-social-actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildShareUrl', () => {
    it('appends referral code when provided', () => {
      const url = buildShareUrl('/charts/123', 'REF_TEST');
      expect(url).toContain('/charts/123');
      expect(url).toContain('ref=REF_TEST');
    });

    it('builds clean URL when referral code is missing', () => {
      const url = buildShareUrl('/charts/123', null);
      expect(url).toContain('/charts/123');
      expect(url).not.toContain('ref=');
    });
  });

  describe('openFacebookShare', () => {
    it('opens window with correct Facebook sharer URL', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      openFacebookShare('https://tuvitoantap.vercel.app/share/123', 'Bản đồ vận mệnh');
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer/sharer.php?u='),
        '_blank',
        expect.any(String),
      );
    });
  });

  describe('openZaloShare', () => {
    it('opens window with correct Zalo share URL', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      openZaloShare('https://tuvitoantap.vercel.app/share/123');
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('sp.zalo.me/share_inline?link='),
        '_blank',
        expect.any(String),
      );
    });
  });

  describe('openTelegramShare', () => {
    it('opens window with correct Telegram share URL', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      openTelegramShare('https://tuvitoantap.vercel.app/share/123', 'Khám phá');
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('t.me/share/url?url='),
        '_blank',
        expect.any(String),
      );
    });
  });

  describe('copyToClipboard', () => {
    it('returns true when writeText succeeds', async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });
      const res = await copyToClipboard('https://test.com');
      expect(res).toBe(true);
    });
  });
});
